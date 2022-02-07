import {Badge, Button, ButtonGroup, TextField, TextStyle, Collapsible, Spinner} from "@shopify/polaris";
import React, {useState, useEffect, useContext, useCallback} from "react";
import {ProductContext} from "../form/ProductContext";

const VariantItemLazy = ({item}) => {
    console.log("VariantItemSmall", item);
    const {node: {id, sku, title}} = item;
    const {product, supplier, setMissingForeignSkuVariants} = useContext(ProductContext);
    console.log("productContext", product, supplier)

    const [isOpen, setOpen] = useState(false);
    const [detailData, setDetailData] = useState({});

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [missingForeignSku, setMissingForeignSku] = useState(false);

    const [priceInput, setPriceInput] = useState("");
    const [priceInputMetafield, setPriceInputMetafield] = useState(null);

    const [alertInventoryCount, setAlertInventoryCount] = useState(0);
    const [alertInventoryCountMetafield, setAlertInventoryCountMetafield] = useState(null);

    const [subSkuInput, setSubSkuInput] = useState("");
    const [subSkuMetafieldInput, setSubSkuInputMetafield] = useState(null);

    const [foreignSku, setForeignSku] = useState("");
    const [foreignSkuMetafield, setForeignSkuMetafield] = useState("");

    const {image, metafields, price} = detailData;

    useEffect(() => {
        if (metafields && metafields.edges) {
            metafields.edges.forEach(edge => {
                if (edge.node.key === "realSku") {
                    setSubSkuInputMetafield(edge);
                    setSubSkuInput(edge.node.value);
                }
                if (edge.node.key === "subscriberPrice") {
                    setPriceInputMetafield(edge);
                    setPriceInput(edge.node.value);
                }
                if (edge.node.key === "alertInventoryCount") {
                    setAlertInventoryCountMetafield(edge);
                    setAlertInventoryCount(edge.node.value);
                }
                if (edge.node.key === "foreignSku") {
                    setForeignSkuMetafield(edge);
                    setForeignSku(edge.node.value);
                }
            });
        }
    }, []);

    useEffect(() => {
        setExternalSku();
    }, [foreignSku]);

    function onPriceChange(input) {
        setSuccess(null);
        setPriceInput(input);
    }

    function onSubSkuChange(input) {
        setSuccess(null);
        setSubSkuInput(input);
    }

    function onAlertInventoryCountChange(input) {
        setSuccess(null);
        setAlertInventoryCount(input);
    }

    function onForeignSkuChange(input) {
        setSuccess(null);
        setForeignSku(input);
    }

    function save() {
        if (typeof window === "undefined") {
            return;
        }

        let data = {
            subPrice: priceInput,
            subSku: subSkuInput,
            alertInventoryCount: alertInventoryCount,
            foreignSku: foreignSku
        };

        if (priceInputMetafield) {
            data.subPriceId = priceInputMetafield.node.id;
        }

        if (subSkuMetafieldInput) {
            data.subSkuId = subSkuMetafieldInput.node.id;
        }

        if (alertInventoryCountMetafield) {
            data.alertInventoryCountId = alertInventoryCountMetafield.node.id;
        }

        if (foreignSkuMetafield) {
            data.foreignSkuId = foreignSkuMetafield.node.id;
        }

        try {
            fetch("/product/variant/save/" + id.replace("gid://shopify/ProductVariant/", ""), {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then(res => res.json()).then(res => {
                setSuccess(true);
            }).catch(err => {
                setSuccess(false);
            });
        } catch (e) {
            console.log(e);
        }
    }

    const loadDetails = async () => {
        setLoading(true);
        try {
            console.log("fetchVariants")
            let data = await fetch("/product/variants/", {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({variantId: id})
            }).then(response => response.json());
            console.log("data", data);
            if (data) {
                setLoading(false);
                setDetailData(detailData);
            }
        } catch (e) {
            console.log(e)
        }
    };

    function setExternalSku() {
        const supplierId = supplier?.value || "";
        const isNonDigitalSupplier = (supplierId !== "000013") && (supplierId !== "000014");

        if (!foreignSku && isNonDigitalSupplier) {
            setMissingForeignSku(true);
            setMissingForeignSkuVariants(sku, true);
        } else {
            setMissingForeignSku(false);
            setMissingForeignSkuVariants(sku, false);
        }
    }

    function renderSyncState() {
        if (missingForeignSku) {
            return <Badge status="warning">Fremdartikelnummer fehlt</Badge>;
        }

        return null;
    }

    const handleToggle = useCallback(() => {
        setOpen((open) => !open);
    }, []);

    console.log("detailData", detailData)

    return (
        <li className="Polaris-ResourceItem__ListItem">
            <div className="Polaris-ResourceItem__ItemWrapper">
                <div className="Polaris-ResourceItem__Container">
                    <div className="Polaris-ResourceItem__Owned">
                        <div className="Polaris-ResourceItem__Media">
                            {image && <img src={image.transformedSrc} alt={sku} />}
                        </div>
                    </div>

                    <div className="Polaris-ResourceItem__Content">
                        <div>
                            <h3>
                                <TextStyle variation="strong">{title} ({sku})</TextStyle>
                                <div style={{float: "right", marginTop: "-5px"}}>
                                    <Button onClick={handleToggle}>{isOpen ? "Schließen" : "Öffnen"}</Button>
                                </div>
                                {detailData && isOpen && (
                                    <>
                                        <span style={{paddingLeft: "7px"}}></span>
                                        {renderSyncState()}
                                        {success !== null && (
                                            <Badge status={success ? "success" : "error"}>
                                                {success ? "gespeichert" : "Fehler aufgetreten"}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </h3>

                            <Collapsible id="basic" open={isOpen}>
                                {loading ? <Spinner accessibilityLabel="Bitte warten" size="small" /> : (
                                    <>
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
                                        <TextField
                                            label="Benachrichtigen, falls Bestand auf X fällt (0 bzw. Leerlassen zum Deaktivieren):"
                                            disabled={loading}
                                            value={alertInventoryCount}
                                            inputMode="numeric"
                                            type="number"
                                            autoComplete="off"
                                            min={0}
                                            onChange={onAlertInventoryCountChange.bind(this)}
                                        />
                                        <TextField label="Fremdartikelnummer" disabled={loading} value={foreignSku} onChange={onForeignSkuChange}/>
                                    </>
                                )}
                            </Collapsible>
                        </div>
                        {detailData && isOpen && (
                            <div style={{marginTop: "10px"}}>
                                <ButtonGroup>
                                    <Button primary onClick={save.bind(this)}>Speichern</Button>
                                </ButtonGroup>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
};

export default VariantItemLazy;
