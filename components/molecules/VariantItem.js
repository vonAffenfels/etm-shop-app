import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";

const VariantItem = ({item}) => {
    console.log("VariantItem", item);
    const {node: {id, image, metafields, price, sku, title}} = item;
    console.log("id, image, metafields, price, sku, title", id, image, metafields, price, sku, title);

    const [loading, setLoading] = useState(false);
    const [priceInput, setPriceInput] = useState("");
    const [subSkuInput, setSubSkuInput] = useState("");

    function onPriceChange(input) {
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
            <div style={{display: "inline-block", width: "50%"}}>
                <h3>
                    <TextStyle variation="strong">{sku}</TextStyle>
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
            <div style={{display: "inline-block", width: "50%"}}>
                <ButtonGroup connectedTop={true}>
                    <Button onClick={reset.bind(this)}>Verwerfen</Button>
                    <Button primary onClick={save.bind(this)}>Speichern</Button>
                </ButtonGroup>
            </div>
        </ResourceList.Item>
    );
};

export default VariantItem;
