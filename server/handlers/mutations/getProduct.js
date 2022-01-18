import gql from "graphql-tag";

const getProduct = async (client, id) => {
    try {
        const res = await client.query({
            query: gql`
                query($id:ID!) {
                    product(id:$id) {
                        title
                        description
                        metafields(first: 10) {
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
                        variants(first: 25) {
                            edges {
                                node {
                                    id
                                    price
                                    sku
                                    title
                                    image {
                                        transformedSrc(maxHeight: 50, maxWidth: 50, preferredContentType: WEBP)
                                    }
                                    metafields(first: 4) {
                                        edges {
                                            node {
                                                id
                                                key
                                                namespace
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            variables: {
                id: id
            }
        });

        return res;
    } catch (e) {
        console.error("getProduct");
        console.error(e);
    }
};

export default getProduct;
