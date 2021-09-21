import gql from "graphql-tag";

const updateProduct = async (client, id, fileName) => {
    const res = await client.query({
        query: gql`
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product {
                        id
                        title
                        descriptionHtml
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
                    userErrors {
                        field
                        message
                    }
                }
            }
        `,
        variables: {
            input: {
                id: id,
                metafields: [
                    {
                        description: "filename of the associated download attachment",
                        namespace: "Download",
                        key: "filename",
                        value: fileName,
                        valueType: "STRING"
                    }
                ]
            }
        }
    });

    if (res.data.productUpdate && res.data.productUpdate.userErrors && res.data.productUpdate.userErrors.length) {
        throw new Error(JSON.stringify(res.data.productUpdate.userErrors))
    }

    return res;
};

export default updateProduct;
