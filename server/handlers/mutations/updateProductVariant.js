import gql from "graphql-tag";

const updateProductVariant = async (client, id, metafields) => {
    return gql`
        mutation productVariantUpdate($input: ProductVariantInput!) {
            productVariantUpdate(input: $input) {
                productVariant {
                    id
                    metafields(first: 3) {
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
    `;

    // try {
    //     const res = await client.query({
    //         query: gql`
    //             mutation productVariantUpdate($input: ProductVariantInput!) {
    //                 productVariantUpdate(input: $input) {
    //                     productVariant {
    //                         id
    //                         metafields(first: 3) {
    //                             edges {
    //                                 node {
    //                                     id
    //                                     key
    //                                     namespace
    //                                     createdAt
    //                                     description
    //                                     value
    //                                 }
    //                             }
    //                         }
    //                     }
    //                     userErrors {
    //                         field
    //                         message
    //                     }
    //                 }
    //             }
    //         `,
    //         variables: {
    //             input: {
    //                 id: id,
    //                 metafields: metafields
    //             }
    //         }
    //     });
    //
    //     if (res.data.productVariantUpdate && res.data.productVariantUpdate.userErrors && res.data.productVariantUpdate.userErrors.length) {
    //         throw new Error(JSON.stringify(res.data.productVariantUpdate.userErrors))
    //     }
    //
    //     return res;
    // } catch (e) {
    //     console.error("updateProductVariant");
    //     if (e.graphQLErrors) {
    //         console.error(JSON.stringify(e.graphQLErrors, null, 3));
    //     } else {
    //         console.error(e);
    //     }
    // }
};

export default updateProductVariant;
