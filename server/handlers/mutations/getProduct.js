import gql from "graphql-tag";

const getProduct = async (client, id) => {
    const res = await client.query({
        query: gql`
            query($id:ID!) {
                product(id:$id) {
                    title
                    description
                    metafields(first: 3, namespace: "Download") {
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
            id: id
        }
    });

    return res;
};

export default getProduct;
