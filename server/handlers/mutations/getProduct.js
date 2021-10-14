import gql from "graphql-tag";

const getProduct = async (client, id) => {
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
                                metafields(first: 2) {
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
        `,
        variables: {
            id: id
        }
    });

    return res;
};

export default getProduct;
