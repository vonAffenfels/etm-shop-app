import gql from "graphql-tag";

// const updateProduct = async (client, id, metafields) => {
//     try {
//         const res = await client.query({
//             query: gql`
//                 mutation productUpdate($input: ProductInput!) {
//                     productUpdate(input: $input) {
//                         product {
//                             id
//                             title
//                             descriptionHtml
//                             metafields(first: 10) {
//                                 edges {
//                                     node {
//                                         id
//                                         key
//                                         namespace
//                                         createdAt
//                                         description
//                                         value
//                                     }
//                                 }
//                             }
//                         }
//                         userErrors {
//                             field
//                             message
//                         }
//                     }
//                 }
//             `,
//             variables: {
//                 input: {
//                     id: id,
//                     metafields: metafields
//                 }
//             }
//         });
//
//         if (res.data.productUpdate && res.data.productUpdate.userErrors && res.data.productUpdate.userErrors.length) {
//             throw new Error(JSON.stringify(res.data.productUpdate.userErrors))
//         }
//
//         return res;
//     } catch (e) {
//         console.error("updateProduct");
//         console.error(e);
//     }
// };

const updateProduct = () => {
    return gql`
        mutation productUpdate($input: ProductInput!) {
            productUpdate(input: $input) {
                product {
                    id
                    title
                    descriptionHtml
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
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;
}

export default updateProduct;
