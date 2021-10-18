import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";

const VariantItem = ({item}) => {
    console.log("VariantItem", item);
    const {node: {id, image, metafields, price, sku, title}} = item;
    console.log("id, image, metafields, price, sku, title", id, image, metafields, price, sku, title);
    let subSku = "";
    let subPrice = price;

    if (metafields && metafields.edges) {
        metafields.edges.forEach(edge => {
            if (edge.node.key === "realSku") {
                subSku = edge.node.value;
            }
            if (edge.node.key === "subscriberPrice") {
                subPrice = edge.node.value;
            }
        });
    }

    const [loading, setLoading] = useState(false);
    const [priceInput, setPriceInput] = useState(subPrice);
    const [subSkuInput, setSubSkuInput] = useState(subSku);

    function onPriceChange(input) {
        console.log("onPriceChange", input)
        setPriceInput(input);
    }

    function onSubSkuChange(input) {
        setSubSkuInput(input);
    }

    function reset() {
        console.log("reset");
    }

    function save() {
        console.log("save");
    }

    return (
        <ResourceList.Item id={id} media={<img src={image.transformedSrc} alt={sku} />}>
            <div>
                <h3>
                    <TextStyle variation="strong">{title} ({sku})</TextStyle>
                </h3>
                <TextField
                    label="Abonnenten Preis"
                    disabled={loading}
                    value={priceInput}
                    onChange={onPriceChange.bind(this)}
                />
                <TextField
                    label="Original Artikelnummer"
                    disabled={loading}
                    value={subSkuInput}
                    onChange={onSubSkuChange.bind(this)}
                />
            </div>
            <div>
                <ButtonGroup>
                    <Button onClick={reset.bind(this)}>Verwerfen</Button>
                    <Button primary onClick={save.bind(this)}>Speichern</Button>
                </ButtonGroup>
            </div>
        </ResourceList.Item>
    );
};

export default VariantItem;
