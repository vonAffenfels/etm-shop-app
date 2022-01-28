import {createClient} from "./client";
import getProduct from "./mutations/getProduct";
import getProductBySku from "./mutations/getProductBySku";
import updateProduct from "./mutations/updateProduct";
import updateProductVariant from "./mutations/updateProductVariant";
import removeMetafield from "./mutations/removeMetafield";
import fetch from "node-fetch";

async function request(query, variables) {
    console.log("REQUEST:::");
    console.log(query);
    console.log(variables)
    const res = await fetch(process.env.TOKEN_API + "/shopify-api/graph-ql/", {
        method: "post",
        body: JSON.stringify({
            query: query,
            variables: variables
        }),
        headers: {
            "Content-Type": "application/json",
            "x-ape-rock-super-secret": process.env.TOKEN_API_SECRET
        }
    });
    console.log("res", res)
    console.log(res)

    return res.json();
}

export {request, createClient, getProduct, getProductBySku, updateProduct, updateProductVariant, removeMetafield};
