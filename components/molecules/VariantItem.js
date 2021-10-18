import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect, useCallback} from "react";

const VariantItem = ({item}) => {
    console.log("VariantItem", item);
    const {node: {id, image, metafields, price, sku, title}} = item;
    console.log("id, image, metafields, price, sku, title", id, image, metafields, price, sku, title);
    let subSku = "";
    let subSkuMetafield;
    let subPrice = "";
    let subPriceMetafield;

    const [loading, setLoading] = useState(false);
    const [priceInput, setPriceInput] = useState(subPrice);
    const [subSkuInput, setSubSkuInput] = useState(subSku);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (metafields && metafields.edges) {
            metafields.edges.forEach(edge => {
                if (edge.node.key === "realSku") {
                    subSku = edge.node.value;
                    subSkuMetafield = edge;
                    setSubSkuInput(subSku);
                }
                if (edge.node.key === "subscriberPrice") {
                    subPrice = edge.node.value;
                    subPriceMetafield = edge;
                    setPriceInput(subPrice);
                }
            });
        }
    }, []);

    function onPriceChange(input) {
        console.log("onPriceChange", input)
        setPriceInput(input);
    }

    function onSubSkuChange(input) {
        setSubSkuInput(input);
    }

    function reset() {
        console.log("reset");
        setPriceInput(subPrice);
        setSubSkuInput(subSku);
    }

    function save() {
        if (typeof window === "undefined") {
            return;
        }

        let data = {
            subPrice: priceInput,
            subSku: subSkuInput
        };

        if (subPriceMetafield) {
            data.subPriceId = subPriceMetafield.node.id;
        }

        if (subSkuMetafield) {
            data.subSkuId = subSkuMetafield.node.id;
        }

        console.log("data", data)

        try {
            fetch("/product/variant/save/" + id.replace("gid://shopify/ProductVariant/", ""), {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then(res => res.json()).then(res => {
                console.log("save", res);
            });
        } catch (e) {
            console.log(e);
        }
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
            <div style={{marginTop: "10px"}}>
                <ButtonGroup>
                    <Button onClick={reset.bind(this)}>Verwerfen</Button>
                    <Button primary onClick={save.bind(this)}>Speichern</Button>
                </ButtonGroup>
            </div>
        </ResourceList.Item>
    );
};

export default VariantItem;
