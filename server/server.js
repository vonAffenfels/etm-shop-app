import "@babel/polyfill";
import fs from "fs";
import path from "path";
import gql from "graphql-tag";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, {verifyRequest} from "@shopify/koa-shopify-auth";
import Shopify, {ApiVersion} from "@shopify/shopify-api";
import {createClient, updateProduct, updateProductVariant, removeMetafield, getProduct, getProductBySku} from "./handlers/index";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import KoaBody from "koa-body";
import speakingurl from "speakingurl";
import AWSService from "./aws";
import fetch from "node-fetch";
import {wakeDyno} from "heroku-keep-awake";

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
const IMAGE_TYPE_SUFFIXES = [
    "gif",
    "jpg",
    "jpeg",
    "png"
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
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    };

    router.get("/ping", async (ctx) => {
        ctx.res.status = 200;
        ctx.body = "ok";
    });

    router.post("/webhooks", async (ctx) => {
        try {
            await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
            console.log(`Webhook processed, returned status code 200`);
        } catch (error) {
            console.log(`Failed to process webhook: ${error}`);
        }
    });

    router.post("/graphql", verifyRequest({returnHeader: true}), async (ctx, next) => {
        await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    });

    router.post("/metafield/remove/:id", async (ctx, next) => {
        const {id} = ctx.params;

        if (!id) {
            ctx.res.status = 404;
            ctx.body = {
                error: "id not found"
            };
        }

        await removeMetafield(client, "gid://shopify/Metafield/" + id);

        ctx.res.status = 200;
        ctx.body = {
            success: true
        };
    });

    router.get("/product/download/valid/:productId", async (ctx, next) => {
        const {productId} = ctx.params;

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = {
                error: "productId missing"
            };
            return;
        }

        // const productId = Buffer.from(productHash, "hex").toString();
        const shopifyId = "gid://shopify/Product/" + productId;
        const res = await getProduct(client, shopifyId);

        if (!res.data || !res.data.product) {
            ctx.res.status = 404;
            ctx.body = {
                error: "no product found for id " + shopifyId
            };
            return;
        }

        const metafields = res.data.product.metafields;

        if (!metafields || !metafields.edges || !metafields.edges.length) {
            ctx.res.status = 404;
            ctx.body = {
                error: "no attached files found for product with id " + shopifyId
            };
            return;
        }

        const downloadFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "filename");

        if (!downloadFields.length) {
            ctx.res.status = 404;
            ctx.body = {
                error: "no attached files found for product with id " + shopifyId
            };
            return;
        }

        const userAgent = ctx.req.headers["user-agent"];
        const isSubscriber = String(ctx.req.headers["e-valid-abo"]) == "1";
        if (userAgent === "euro-api") {
            const downloadDateFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "downloaddate");
            if (downloadDateFields.length) {
                let dateTime = new Date(downloadDateFields[0].value).getTime();
                let compareTime = new Date();

                if (isSubscriber) {
                    compareTime.setDate(compareTime.getDate() - 2);
                }

                if (compareTime.getTime() < dateTime) {
                    return ctx.body = {
                        error: "releasedate not reached"
                    }
                }
            }
        }

        return ctx.body = {
            success: true
        };
    });

    router.get("/product/download/:productId", async (ctx, next) => {
        const {productId} = ctx.params;

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = "productId missing";
            return;
        }

        // const productId = Buffer.from(productHash, "hex").toString();
        const shopifyId = "gid://shopify/Product/" + productId;
        const res = await getProduct(client, shopifyId);

        if (!res.data || !res.data.product) {
            ctx.res.status = 404;
            ctx.body = "no product found for id " + shopifyId;
            return;
        }

        const metafields = res.data.product.metafields;

        if (!metafields || !metafields.edges || !metafields.edges.length) {
            ctx.res.status = 404;
            ctx.body = "no attached files found for product with id " + shopifyId;
            return;
        }

        const downloadFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "filename");

        if (!downloadFields.length) {
            ctx.res.status = 404;
            ctx.body = "no attached files found for product with id " + shopifyId;
            return;
        }

        const userAgent = ctx.req.headers["user-agent"];
        const isSubscriber = String(ctx.req.headers["e-valid-abo"]) == "1";
        if (userAgent === "euro-api") {
            const downloadDateFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "downloaddate");
            if (downloadDateFields.length) {
                let dateTime = new Date(downloadDateFields[0].value).getTime();
                let compareTime = new Date();

                if (isSubscriber) {
                    compareTime.setDate(compareTime.getDate() - 2);
                }

                if (compareTime.getTime() < dateTime) {
                    return ctx.body = {
                        error: "releasedate not reached"
                    }
                }
            }
        }

        const downloadField = downloadFields[0];
        const fileName = String(downloadField.value);
        const fileSuffix = String(fileName.split("-").pop()).toLowerCase();

        ctx.set("Content-disposition", "attachment; filename=" + (fileName.replace("-" + fileSuffix, "." + fileSuffix)));
        if (IMAGE_TYPE_SUFFIXES.indexOf(fileSuffix) !== -1) {
            ctx.set("Content-type", "image/" + fileSuffix);
        } else if (fileSuffix === "pdf") {
            ctx.set("Content-type", "application/" + fileSuffix);
        }
        ctx.body = await aws.download("downloads/" + fileName);
    });

    router.post("/product/variant/save/:productVariantId", KoaBody(), async (ctx, next) => {
        const {productVariantId} = ctx.params;
        console.log("body", ctx.request.body)

        const shopifyId = "gid://shopify/ProductVariant/" + productVariantId;
        const {subPrice, subSku, subPriceId, subSkuId} = ctx.request.body;

        try {
            let metafields = [];
            if (subPrice) {
                let metafield = {
                    description: "special subscriber price",
                    namespace: "subscription",
                    key: "subscriberPrice",
                    value: parseFloat(String(subPrice).replace(",", ".")).toFixed(2),
                    valueType: "STRING"
                };
                if (subPriceId) {
                    metafield.id = subPriceId;
                }
                metafields.push(metafield);
            } else if (subPriceId) {
                await removeMetafield(client, subPriceId);
            }

            if (subSku) {
                let metafield = {
                    description: "real sku of the sub. bonus",
                    namespace: "subscription",
                    key: "realSku",
                    value: String(subSku),
                    valueType: "STRING"
                };
                if (subSkuId) {
                    metafield.id = subSkuId;
                }
                metafields.push(metafield);
            } else if (subSkuId) {
                await removeMetafield(client, subPriceId)
            }

            if (metafields.length) {
                await updateProductVariant(client, shopifyId, metafields);
            }
            ctx.body = {success: true};

        } catch (e) {
            console.log(e);
            ctx.body = {
                error: e.toString()
            }
        }
    });

    router.post("/product/upload/:productId", KoaBody({multipart: true, keepExtensions: true}), async (ctx, next) => {
        const {productId} = ctx.params;
        const body = ctx.request.body;
        const file = ctx.request.files?.file;

        console.log("body", JSON.stringify(body, null, 3))

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = "productId missing";
            return;
        }

        const shopifyId = "gid://shopify/Product/" + productId;
        const metafields = [];

        if (file) {
            const slug = speakingurl(file.name);
            const reader = fs.createReadStream(file.path);

            let metafield = {
                description: "filename of the associated download attachment",
                namespace: "Download",
                key: "filename",
                value: slug,
                valueType: "STRING"
            };
            if (body.downloads) {
                metafield.id = body.downloads;
            }
            metafields.push(metafield);

            try {
                await aws.upload(reader, "downloads/" + slug);
            } catch (e) {
                console.log(e);
                ctx.body = e.toString();
            }
        } else if (body.downloads) {
            await removeMetafield(client, body.downloads);
        }

        if (body.downloaddate) {
            let metafield = {
                description: "release date for download attachments",
                namespace: "Download",
                key: "downloaddate",
                value: body.downloaddate,
                valueType: "STRING"
            };
            if (body.downloaddateid) {
                metafield.id = body.downloaddateid;
            }
            metafields.push(metafield);
        } else if (body.downloaddateid) {
            await removeMetafield(client, body.downloaddateid);
        }

        if (body.supplierid && body.supplierid !== "null") {
            let metafield = {
                description: "supplier id for corresponding product",
                namespace: "Download",
                key: "supplierid",
                value: body.supplierid,
                valueType: "STRING"
            };
            if (body.suppliermetaid) {
                metafield.id = body.suppliermetaid;
            }
            metafields.push(metafield);
        } else if (body.suppliermetaid) {
            await removeMetafield(client, body.suppliermetaid);
        }

        if (body.hinttext) {
            let metafield = {
                description: "hint text for display of availability",
                namespace: "Additions",
                key: "hinttext",
                value: body.hinttext,
                valueType: "STRING"
            };
            if (body.hinttextid) {
                metafield.id = body.hinttextid;
            }
            metafields.push(metafield);
        } else if (body.hinttextid) {
            await removeMetafield(client, body.hinttextid);
        }

        if (body.hidden === "0" || body.hidden === "1") {
            let metafield = {
                description: "0 indicates normal state, 1 hides it",
                namespace: "Additions",
                key: "hidden",
                value: body.hidden,
                valueType: "STRING"
            };
            if (body.hiddenid) {
                metafield.id = body.hiddenid;
            }
            metafields.push(metafield);
        }

        if (body.bqnumber) {
            let metafield = {
                description: "Bezugsquelle, relevant fuer Abos",
                namespace: "Subscriptions",
                key: "bqnumber",
                value: body.bqnumber,
                valueType: "STRING"
            };
            if (body.bqnumberid) {
                metafield.id = body.bqnumberid;
            }
            metafields.push(metafield);
        } else if (body.bqnumberid) {
            await removeMetafield(client, body.bqnumberid);
        }

        if (body.bqrelation && body.bqrelation !== "null") {
            let metafield = {
                description: "Bezugstyp, relevant fuer Abo Zuordnung",
                namespace: "Subscriptions",
                key: "bqrelation",
                value: body.bqrelation,
                valueType: "STRING"
            };
            if (body.bqrelationid) {
                metafield.id = body.bqrelationid;
            }
            metafields.push(metafield);
        } else if (body.bqrelationid) {
            await removeMetafield(client, body.bqrelationid);
        }

        if (body.project && body.project !== "null") {
            let metafield = {
                description: "Projekt, relevant fuer Abo Zuordnung",
                namespace: "Subscriptions",
                key: "project",
                value: body.project,
                valueType: "STRING"
            };
            if (body.projectid) {
                metafield.id = body.projectid;
            }
            metafields.push(metafield);
        } else if (body.projectid) {
            await removeMetafield(client, body.projectid);
        }

        if (metafields.length) {
            const res = await updateProduct(client, shopifyId, metafields);
        }
        ctx.body = "ok";
    });

    router.post("/product/find/:sku", async (ctx, next) => {
        const {sku} = ctx.params;

        if (!sku) {
            ctx.res.status = 400;
            ctx.body = "sku missing";
            return;
        }

        try {
            const res = await getProductBySku(client, `sku:${sku}`);
            ctx.body = res.data;
        } catch (e) {
            console.log(e);
            ctx.body = {
                empty: true
            };
        }
    });

    router.post("/product/:productId/token/find", async (ctx, next) => {
        const {productId} = ctx.params;

        try {
            const result = await fetch(process.env.TOKEN_API + "/shopify-api/token/download/find", {
                method: "post",
                body: JSON.stringify({
                    product: "gid://shopify/Product/" + productId,
                    referer: "admin"
                }),
                headers: {"Content-Type": "application/json"}
            });
            const response = await result.json();

            ctx.body = {
                data: response.data
            };
        } catch (e) {
            ctx.body = {
                data: []
            }
        }
    });

    router.post("/product/:productId/token/create", async (ctx, next) => {
        const {productId} = ctx.params;

        try {
            const result = await fetch(process.env.TOKEN_API + "/shopify-api/token/download/create", {
                method: "post",
                body: JSON.stringify({
                    product: "gid://shopify/Product/" + productId,
                    referer: "admin"
                }),
                headers: {"Content-Type": "application/json"}
            });
            const response = await result.json();

            ctx.body = {
                data: response.data
            };
        } catch (e) {
            ctx.body = {
                error: e.toString()
            }
        }
    });

    router.post("/product/:productId/token/delete/:token", async (ctx, next) => {
        const {productId, token} = ctx.params;

        try {
            const result = await fetch(process.env.TOKEN_API + "/shopify-api/token/download/delete", {
                method: "post",
                body: JSON.stringify({
                    id: token
                }),
                headers: {"Content-Type": "application/json"}
            });
            const response = await result.json();

            ctx.body = {
                data: response.data
            };
        } catch (e) {
            ctx.body = {
                error: e.toString()
            }
        }
    });

    router.post("/product/:productId", async (ctx, next) => {
        const {productId} = ctx.params;

        if (!productId) {
            ctx.res.status = 400;
            ctx.body = "productId missing";
            return;
        }

        const shopifyId = "gid://shopify/Product/" + productId;

        try {
            console.log("FETCH PRODUCT", shopifyId)
            const res = await getProduct(client, shopifyId);
            res.data.shopUrl = process.env.TOKEN_API + "/" + speakingurl("shop-" + res.data?.product?.title) + "/" + productId + "/";
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

        wakeDyno(process.env.HOST + "/ping?shop=eurotransport.myshopify.com", {
            interval: 29,
            logging: false,
            stopTimes: {
                start: "20:00",
                end: "06:00"
            }
        });
    });
});
