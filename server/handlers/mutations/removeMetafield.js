import gql from "graphql-tag";

const removeMetafield = async (client, id) => {
    try {
        const res = await client.query({
            query: gql`
                mutation metafieldDelete($input: MetafieldDeleteInput!) {
                    metafieldDelete(input: $input) {
                        deletedId
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `,
            variables: {
                input: {
                    id: id
                }
            }
        });

        if (res.data.metafieldDelete && res.data.metafieldDelete.userErrors && res.data.metafieldDelete.userErrors.length) {
            throw new Error(JSON.stringify(res.data.metafieldDelete.userErrors))
        }

        return res;
    } catch (e) {
        console.error("removeMetafield");
        console.error(e);
    }
};

export default removeMetafield;
