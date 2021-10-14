import {ResourceList} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";

const VariantList = ({existingProduct}) => {
    console.log("VariantList", existingProduct);

    if (!existingProduct || !existingProduct.product) {
        return null;
    }

    const variants = existingProduct.product.variants;

    if (!variants || !variants.edges || !variants.edges.length) {
        return null;
    }

    return (
        <ResourceList
            showHeader
            resourceName={{singular: "Variante", plural: "Varianten"}}
            items={variants.edges}
            renderItem={(item) => {
                const {node: {id, image, metafields, price, sku, title}} = item;
                console.log("id, image, metafields, price, sku, title", id, image, metafields, price, sku, title);
                const media = <img src={image.transformedSrc} alt={title} />;

                return (
                    <ResourceList.Item id={id} media={media}>
                        <h3>
                            <TextStyle variation="strong">{title}</TextStyle>
                        </h3>
                    </ResourceList.Item>
                )
            }}
        />
    );
};

export default VariantList;
