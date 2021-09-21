import "@babel/polyfill";
import fs from "fs";
import path from "path";
import gql from "graphql-tag";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, {verifyRequest} from "@shopify/koa-shopify-auth";
import Shopify, {ApiVersion} from "@shopify/shopify-api";
import {createClient} from "./handlers/index";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import KoaBody from "koa-body";
import speakingurl from "speakingurl";
import AWSService from "./aws";
import updateProduct from "./handlers/mutations/updateProduct";
import removeMetafield from "./handlers/mutations/removeMetafield";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
    dev,
});
const handle = app.getRequestHandler();
const aws = new AWSService();
const client = createClient(process.env.SHOP, process.env.ETM_SHOPIFY_KEY, process.env.ETM_SHOPIFY_PASSWORD);

Shopify.Context.initialize({
    API_KEY: process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
    SCOPES: process.env.SCOPES.split(","),
    HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
    API_VERSION: ApiVersion.October20,
    IS_EMBEDDED_APP: true,
    // This should be replaced with your preferred storage strategy
    SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};
const ACTIVE_SHOPIFY_SHOPS_REDIRECTS = {};
const ALLOWED_INITIAL_URL_FOR_REDIRECT = [
    "/product/upload"
];

app.prepare().then(async () => {
    const server = new Koa();
    const router = new Router();
    server.keys = [Shopify.Context.API_SECRET_KEY];
    server.use(
        createShopifyAuth({
            async afterAuth(ctx) {
                // Access token and shop available in ctx.state.shopify
                const {shop, accessToken, scope} = ctx.state.shopify;
                const host = ctx.query.host;
                ACTIVE_SHOPIFY_SHOPS[shop] = scope;
                console.log("ACTIVE_SHOPIFY_SHOPS_REDIRECTS", ACTIVE_SHOPIFY_SHOPS_REDIRECTS)
                console.log("ALLOWED_INITIAL_URL_FOR_REDIRECT", ALLOWED_INITIAL_URL_FOR_REDIRECT)

                const response = await Shopify.Webhooks.Registry.register({
                    shop,
                    accessToken,
                    path: "/webhooks",
                    topic: "APP_UNINSTALLED",
                    webhookHandler: async (topic, shop, body) =>
                        delete ACTIVE_SHOPIFY_SHOPS[shop],
                });

                if (!response.success) {
                    console.log(`Failed to register APP_UNINSTALLED webhook: ${response.result}`);
                }

                let redirectUrl = "/";
                let queryString = "shop=" + shop + "&host=" + host;
                if (ACTIVE_SHOPIFY_SHOPS_REDIRECTS && ACTIVE_SHOPIFY_SHOPS_REDIRECTS[shop]) {
                    let tempUrl = new URL("https://" + process.env.SHOP + ACTIVE_SHOPIFY_SHOPS_REDIRECTS[shop]);
                    redirectUrl = tempUrl.pathname;
                    queryString += "&id=" + tempUrl.searchParams.get("id");
                }

                // Redirect to app with shop parameter upon auth
                ctx.redirect(`${redirectUrl}?${queryString}`);
            },
        })
    );

    const handleRequest = async (ctx) => {
        console.log("handleRequest", ctx.req.url)
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    };

    router.post("/webhooks", async (ctx) => {
        try {
            await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
            console.log(`Webhook processed, returned status code 200`);
        } catch (error) {
            console.log(`Failed to process webhook: ${error}`);
        }
    });

    router.post("/graphql", verifyRequest({returnHeader: true}), async (ctx, next) => {
        console.log("router: /graphql")
        await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    });

    router.post("/product/upload/:productId", KoaBody({multipart: true, keepExtensions: true}), async (ctx, next) => {
        console.log("/product/upload")
        const {productId} = ctx.params;
        const body = ctx.request.body;
        const file = ctx.request.files?.file;
        console.log("body", body)

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = "productId missing";
            return;
        }

        if (!file) {
            ctx.res.status = 400;
            ctx.body = "file missing";
            return;
        }

        try {
            const downloads = String(body.downloads).length ? body.downloads.split(",") : [];
            if (downloads && downloads.length) {
                for (let i = 0; i < downloads.length; i++) {
                    await removeMetafield(client, downloads[i]);
                }
            }
        } catch (e) {
            console.log("error in removeMetafield", e.toString());
        }

        const shopifyId = "gid://shopify/Product/" + productId;
        console.log("in /product/upload/:productId, shopifyId", shopifyId)
        const slug = speakingurl(file.name);
        const filePath = path.join(process.cwd(), "data", slug);
        const reader = fs.createReadStream(file.path);
        console.log("filePath", filePath, "slug", slug)

        try {
            await aws.upload(reader, "downloads/" + slug);
        } catch (e) {
            console.log(e);
            ctx.body = e.toString();
        }

        const res = await updateProduct(client, shopifyId, slug);
        ctx.body = "ok";
    });

    router.post("/product/:productId", async (ctx, next) => {
        const {productId} = ctx.params;

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = "productId missing";
            return;
        }

        const shopifyId = "gid://shopify/Product/" + productId;
        console.log("in /product/:productId, shopifyId", shopifyId)

        try {
            const res = await client.query({
                query: gql`
                    query($id:ID!) {
                        product(id:$id) {
                            title
                            description
                            metafields(first: 1, namespace: "Download") {
                                edges {
                                    node {
                                        id
                                        key
                                        namespace
                                        createdAt
                                        description
                                        value
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    id: shopifyId
                }
            });
            ctx.body = res.data;
        } catch (e) {
            console.log(e);
            ctx.body = {
                empty: true
            };
        }


    });

    router.get("(/_next/static/.*)", handleRequest); // Static content is clear
    router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
    router.get("(.*)", async (ctx) => {
        const shop = ctx.query.shop;

        // This shop hasn't been seen yet, go through OAuth to create a session
        if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
            ACTIVE_SHOPIFY_SHOPS_REDIRECTS[shop] = ctx.req.url;
            ctx.redirect(`/auth?shop=${shop}`);
        } else {
            await handleRequest(ctx);
        }
    });

    server.use(router.allowedMethods());
    server.use(router.routes());
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
