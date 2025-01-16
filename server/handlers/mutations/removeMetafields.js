import gql from "graphql-tag";

const removeMetafields = () => {
    return gql`
        mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
            metafieldsDelete(metafields: $metafields) {
                deletedMetafields {
                    key
                    namespace
                    ownerId
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;
};

export default removeMetafields;
