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
                variantsCount {
                    count
                }
            }
        }
    `;
};

export default getProduct;
