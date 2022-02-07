import gql from "graphql-tag";

const getVariants = () => {
    return gql`
        query($id:ID!, $limit: Int!, $cursor: String) {
            product(id:$id) {
                variants(first: $limit, after: $cursor) {
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
    `;
};

export const getVariantsSmall = () => {
    return gql`
        query($id:ID!, $limit: Int!, $cursor: String) {
            product(id:$id) {
                variants(first: $limit, after: $cursor) {
                    edges {
                        node {
                            id
                            sku
                            title
                        }
                    }
                }
            }
        }
    `;
};

export default getVariants;
