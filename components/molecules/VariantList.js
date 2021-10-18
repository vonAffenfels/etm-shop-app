import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";
import VariantItem from "./VariantItem";

const VariantList = ({existingProduct}) => {
    console.log("VariantList")
    if (!existingProduct || !existingProduct.product) {
        return null;
    }

    const variants = existingProduct.product.variants;

    if (!variants || !variants.edges || !variants.edges.length) {
        return null;
    }

    const [updating, setUpdating] = useState(false);

    function update() {
        setUpdating(true);
        setUpdating(false);
        // setTimeout(() => {
        //     setUpdating(false);
        // }, 500);
    }

    return (
        <ResourceList
            showHeader
            resourceName={{singular: "Variante", plural: "Varianten"}}
            items={variants.edges}
            renderItem={(item) => <VariantItem item={item} update={update.bind(this)} />}
        />
    );
};

export default VariantList;
