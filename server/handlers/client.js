import {ApolloClient, InMemoryCache} from "@apollo/client";

export const createClient = (shop, key, password) => {
    return new ApolloClient({
        uri: `https://${key}:${password}@${shop}/admin/api/2019-10/graphql.json`,
        cache: new InMemoryCache(),
        headers: {
            "X-Shopify-Access-Token": password,
        },
        defaultOptions: {
            query: {
                fetchPolicy: "no-cache"
            },
            watchQuery: {
                fetchPolicy: "no-cache"
            }
        }
    });
};
