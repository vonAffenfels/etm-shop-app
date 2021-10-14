import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";
import VariantItem from "./VariantItem";

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
            renderItem={(item) => <VariantItem item={item} />}
        />
    );
};

export default VariantList;
