import gql from "graphql-tag";

const getProductBySku = async (client, query) => {
    try {
        const res = await client.query({
            query: gql`
                query($query:String!) {
                    productVariants(query:$query, first: 15) {
                        edges {
                            node {
                                product {
                                    id
                                    title
                                    vendor
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                query: query
            }
        });

        return res;
    } catch (e) {
        console.error("getProductBySku");
        console.error(e);
    }
};

export function getProductBySkuQueryString() {
    return gql`
        query($query:String!) {
            productVariants(query:$query, first: 15) {
                edges {
                    node {
                        product {
                            id
                            title
                            vendor
                        }
                    }
                }
            }
        }
    `;
}

export default getProductBySku;
