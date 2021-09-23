import gql from "graphql-tag";

const getProductBySku = async (client, query) => {
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
};

export default getProductBySku;
