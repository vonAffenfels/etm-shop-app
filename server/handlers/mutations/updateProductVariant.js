import gql from "graphql-tag";

const updateProductVariant = async (client, id, metafields) => {
    const res = await client.query({
        query: gql`
            mutation productVariantUpdate($input: ProductVariantInput!) {
                productVariantUpdate(input: $input) {
                    productVariant {
                        id
                        metafields(first: 2) {
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
                metafields: metafields
            }
        }
    });

    if (res.data.productVariantUpdate && res.data.productVariantUpdate.userErrors && res.data.productVariantUpdate.userErrors.length) {
        throw new Error(JSON.stringify(res.data.productVariantUpdate.userErrors))
    }

    return res;
};

export default updateProductVariant;
