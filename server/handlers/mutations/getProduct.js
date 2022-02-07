import gql from "graphql-tag";

const getProduct = () => {
    return gql`
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
                totalVariants
                variants(first: 25) {
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

export default getProduct;
