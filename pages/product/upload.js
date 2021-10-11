import {Layout, Card, TextContainer, TextStyle, TextField, Heading, Page, Badge, Spinner, DatePicker, Select, Button, Checkbox} from "@shopify/polaris";
import FileInput from "../../components/form/FileInput";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "next/router";

const supplierOptions = [
    {
        value: null,
        label: "Bitte wählen"
    },
    {
        "value": "000001",
        "short": "CON",
        "label": "Conrad GmbH"
    },
    {
        "value": "000002",
        "short": "FLI",
        "label": "Fliegl Fahrzeugbau GmbH"
    },
    {
        "value": "000003",
        "short": "GAS",
        "label": "MOGI-JG"
    },
    {
        "value": "000004",
        "short": "GMT",
        "label": "GMTS Brinkmeier GmbH"
    },
    {
        "value": "000005",
        "short": "JOA",
        "label": "JOAL-Der Spanien Shop"
    },
    {
        "value": "000006",
        "short": "JUM",
        "label": "Jumbo-Fischer GmbH&Co. KG"
    },
    {
        "value": "000007",
        "short": "KOO",
        "label": "KooKoo GmbH"
    },
    {
        "value": "000008",
        "short": "MOB",
        "label": "Motorbuch Versand"
    },
    {
        "value": "000009",
        "short": "NZG",
        "label": "NZG Modelle GmbH"
    },
    {
        "value": "000010",
        "short": "SCF",
        "label": "Schilderfeuerwehr"
    },
    {
        "value": "000011",
        "short": "WIV",
        "label": "Wieland Verlag GmbH"
    },
    {
        "value": "000012",
        "short": "STD",
        "label": "StarDistribution"
    },
    {
        "value": "000013",
        "short": "MOP",
        "label": "Motorpresse"
    },
    {
        "value": "000014",
        "short": "ETM",
        "label": "ETM Verlag"
    },
    {
        "value": "000015",
        "short": "WSI",
        "label": "Vertriebsbüro Deutschland WSI Models B.V."
    },
    {
        "value": "000016",
        "short": "HER",
        "label": "Herpa"
    },
    {
        "value": "000017",
        "short": "THO",
        "label": "Thomin"
    }
];
const subscriptionRelationOptions = [
    {value: null, label: "Bitte wählen"},
    {value: "01", label: "Print"},
    {value: "15", label: "Kombi"},
    {value: "20", label: "Digital"},
    {value: "50", label: "firmenauto Basis-Flat"},
    {value: "51", label: "Flatrate"},
]

const Upload = () => {
    const router = useRouter();
    const productId = router.query.id;

    const [touched, setTouched] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadedState, setUploadedState] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [existingProduct, setExistingProduct] = useState(null);
    const [{month, year}, setDate] = useState({month: new Date().getMonth(), year: new Date().getUTCFullYear()});
    const [uploadDate, setUploadDate] = useState(null);
    const [supplier, setSupplier] = useState({value: null, label: "", short: ""});
    const [tokens, setTokens] = useState([]);
    const [hintText, setHintText] = useState("");
    const [hidden, setHidden] = useState(false);
    const [bqNumber, setBqNumber] = useState("");
    const [relation, setRelation] = useState({value: null, label: ""});
    const handleMonthChange = useCallback((month, year) => setDate({month, year}), []);

    useEffect(() => {
        fetchProduct();
        fetchTokens();
    }, []);

    function fetchProduct() {
        if (typeof window === "undefined") {
            return;
        }

        fetch("/product/" + productId, {
            method: "post",
        }).then(response => response.json()).then(data => {
            setExistingProduct(data);
            getInitialFormValues(data);
        }).catch(err => console.log(err));
    }

    function fetchTokens() {
        if (typeof window === "undefined") {
            return;
        }

        fetch("/product/" + productId + "/token/find", {
            method: "post",
        }).then(response => response.json()).then(data => {
            if (data.data) {
                setTokens(data.data);
            }
        }).catch(err => console.log(err));
    }

    function createDownloadToken() {
        fetch("/product/" + productId + "/token/create", {
            method: "post",
        }).then(response => response.json()).then(data => {
            fetchTokens();
        }).catch(err => console.log(err));
    }

    function deleteDownloadToken(id) {
        fetch("/product/" + productId + "/token/delete/" + id, {
            method: "post",
        }).then(response => response.json()).then(data => {
            fetchTokens();
        }).catch(err => console.log(err));
    }

    function deleteDownloadAttachment(id) {
        fetch("/metafield/remove/" + id.replace("gid://shopify/Metafield/", ""), {
            method: "post",
        }).then(response => response.json()).then(data => {
            fetchProduct();
            fetchTokens();
        }).catch(err => console.log(err));
    }

    function onBqNumberChange(input) {
        setBqNumber(input);
        setTouched(true);
    }

    function onRelationChange(relationInput) {
        let newRelation = null;

        if (relationInput === "Bitte wählen") {
            setRelation({value: null, label: ""});
            return;
        }

        subscriptionRelationOptions.forEach((relationOption) => {
            if (relationOption.value === relationInput) {
                newRelation = relationOption;
            }
        });
        setRelation(newRelation);
        setTouched(true);
    }

    function onHiddenChange(checked) {
        setHidden(checked);
        setTouched(true);
    }

    function onHintChange(value) {
        setHintText(value);
        setTouched(true);
    }

    let interval = null;
    async function handleSubmit(e) {
        if (!productId || !existingProduct || !existingProduct.product) {
            return;
        }

        setLoading(true);

        let formData = new FormData();
        let metafields = existingProduct.product.metafields;
        let mappedFields = {};

        if (metafields && metafields.edges && metafields.edges.length) {
            metafields.edges.map(edge => edge.node).forEach(node => {
                mappedFields[node.key] = node.id;
            });
        }

        console.log("mappedFields", mappedFields)

        if (files.length) {
            formData.append("file", files[0]);
            if (mappedFields["filename"]) {
                formData.append("downloads", String(mappedFields["filename"]));
            }
        }

        if (hintText) {
            formData.append("hinttext", hintText);
            if (mappedFields["hinttext"]) {
                formData.append("hinttextid", String(mappedFields["hinttext"]));
            }
        }

        if (uploadDate && uploadDate.start) {
            formData.append("downloaddate", uploadDate.start);
            if (mappedFields["downloaddate"]) {
                formData.append("downloaddateid", String(mappedFields["downloaddate"]));
            }
        }

        if (supplier && supplier.value) {
            formData.append("supplierid", supplier.value);
            if (mappedFields["supplierid"]) {
                formData.append("suppliermetaid", String(mappedFields["supplierid"]));
            }
        }

        formData.append("hidden", hidden ? "1" : "0");
        if (mappedFields["hidden"]) {
            formData.append("hiddenid", String(mappedFields["hidden"]));
        }

        if (bqNumber) {
            formData.append("bqnumber", supplier.value);
            if (mappedFields["bqnumberid"]) {
                formData.append("bqnumberid", String(mappedFields["bqnumber"]));
            }
        }

        if (relation && relation.value) {
            formData.append("bqrelation", supplier.relation);
            if (mappedFields["bqrelationid"]) {
                formData.append("bqrelationid", String(mappedFields["bqrelation"]));
            }
        }

        try {
            console.log("FORMDATA:::");
            console.log(Object.fromEntries(formData));
            const data = await fetch("/product/upload/" + productId, {
                method: "post",
                body: formData
            }).then(response => response.text());

            setFiles([]);
            setUploadedState("success");
            setExistingProduct(null);
            fetchProduct();
            setLoading(false);
            setTouched(false);
        } catch (e) {
            console.error(e);
            setUploadedState("error");
            setLoading(false);
            setTouched(false);
        }

        if (interval) {
            clearInterval(interval);
        }
        interval = setTimeout(() => {
            setUploadedState(null);
            interval = null;
        }, 10000);
    }

    function getInitialFormValues(data) {
        if (!data.product) {
            return;
        }

        let metafields = data.product.metafields;
        let mappedFields = {};

        if (metafields && metafields.edges && metafields.edges.length) {
            metafields.edges.map(edge => edge.node).forEach(node => {
                mappedFields[node.key] = node.value;
            });
        }

        if (mappedFields["downloaddate"]) {
            setUploadDate({
                start: new Date(mappedFields["downloaddate"]),
                end: new Date(mappedFields["downloaddate"])
            });
        } else {
            setUploadDate(null);
        }

        if (mappedFields["supplierid"]) {
            supplierOptions.forEach((supplierOption) => {
                if (supplierOption.value === mappedFields["supplierid"]) {
                    setSupplier(supplierOption);
                }
            });
        } else {
            setSupplier({value: null, label: "", short: ""});
        }

        if (mappedFields["hinttext"]) {
            setHintText(mappedFields["hinttext"]);
        } else {
            setHintText("");
        }

        if (mappedFields["hidden"]) {
            setHidden(mappedFields["hidden"] == "1" ? true : false);
        } else {
            setHidden(false);
        }
    }

    function reset() {
        setFiles([]);
        fetchProduct();
        setUploadedState(null);
        setTouched(false);
    }

    function onSelect(files) {
        setFiles(files);
        setUploadedState(null);
        setTouched(true);
    }

    function onDateChange(date) {
        setUploadDate(date);
        setTouched(true);
    }

    function handleSupplierChange(supplierInput) {
        let newSupplier = null;

        if (supplierInput === "Bitte wählen") {
            setSupplier({value: null, label: "", short: ""});
            return;
        }

        supplierOptions.forEach((supplierOption) => {
            if (supplierOption.value === supplierInput) {
                newSupplier = supplierOption;
            }
        });
        setSupplier(newSupplier);
        setTouched(true);
    }

    function renderExistingProduct() {
        if (!existingProduct || !existingProduct.product) {
            return null;
        }

        const metafields = existingProduct.product.metafields;

        if (!metafields || !metafields.edges || !metafields.edges.length) {
            return null;
        }

        const downloadFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "filename");
        // https://etm-shop-app.herokuapp.com
        return (
            <>
                {downloadFields.map((node, i) => (
                    <Card sectioned title={"Vorhandene Dateianhänge"}>
                        <TextContainer>
                            <Heading>
                                <a href={"/product/download/" + productId} download style={{marginRight: "10px"}}>{node.value}</a>
                                <Button plain destructive onClick={deleteDownloadAttachment.bind(this, node.id)}>
                                    Löschen
                                </Button>
                            </Heading>
                            <p>Hochgeladen am {node.createdAt.substring(0, node.createdAt.indexOf("T"))}</p>
                            {tokens.length > 0 && (
                                <>
                                    {tokens.map((token, i) => (
                                        <>
                                            <p key={"token_" + i}>
                                                <span style={{marginRight: "10px"}}>
                                                    {"https://www.eurotransport.de/shopify-api/token/download/" + token._id}
                                                </span>
                                                <Button plain destructive onClick={deleteDownloadToken.bind(this, token._id)}>
                                                    Löschen
                                                </Button>
                                            </p>
                                        </>
                                    ))}
                                </>
                            )}
                            <Button primary onClick={createDownloadToken}>
                                Link erzeugen
                            </Button>
                        </TextContainer>
                    </Card>
                ))}
            </>
        );
    }

    function renderTitleMetadata() {
        if (!uploadedState) {
            return null;
        }

        if (uploadedState === "success") {
            return <Badge status="success">gespeichert</Badge>;
        }
        if (uploadedState === "error") {
            return <Badge status="error">Fehler aufgetreten</Badge>;
        }
    }

    function getTitle() {
        let retVal = "Produktpflege";

        if (existingProduct && existingProduct.product) {
            retVal += ": " + existingProduct.product.title;
        }

        return retVal;
    }

    console.log(existingProduct)
    return (
        <Page
            title={getTitle()}
            titleMetadata={renderTitleMetadata()}
            primaryAction={{
                content: "Speichern",
                disabled: !touched,
                onAction: handleSubmit.bind(this)
            }}
            secondaryActions={[
                {
                    content: "Verwerfen",
                    disabled: !touched,
                    onAction: reset.bind(this)
                }
            ]}
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned title={"Sichtbarkeit"}>
                        <Checkbox
                            label="Produkt verstecken"
                            checked={hidden}
                            disabled={isLoading}
                            onChange={onHiddenChange.bind(this)}
                        />
                        <TextContainer>
                            {existingProduct && (
                                <p>
                                    <br/>
                                    <TextStyle variation="subdued"><a target="_blank" href={existingProduct.shopUrl}>Detailseite öffnen</a></TextStyle>
                                </p>
                            )}
                        </TextContainer>
                    </Card>
                    <Card sectioned title={"Hinweistext Verfügbarkeit"}>
                        <TextField disabled={isLoading} value={hintText} onChange={onHintChange.bind(this)} />
                    </Card>
                    <Card sectioned title={"Abonnement"}>
                        <TextField label={"Bezugsquelle"} disabled={isLoading} value={bqNumber} onChange={onBqNumberChange} />
                        <p>
                            <br/>
                            <Select
                                options={subscriptionRelationOptions}
                                label={"Bezugstyp"}
                                disabled={isLoading}
                                value={relation.value}
                                onChange={onRelationChange.bind(this)}
                            />
                            <TextContainer>
                                {relation.value && (
                                    <p>
                                        <br/>
                                        <TextStyle variation="subdued">{relation.value} {relation.label}</TextStyle>
                                    </p>
                                )}
                            </TextContainer>
                        </p>
                    </Card>
                    {renderExistingProduct()}
                    <Card sectioned title={"Upload Dateianhang"}>
                        {isLoading ? (
                            <Spinner size="large" />
                        ) : (
                            <FileInput files={files} onSelect={onSelect.bind(this)} />
                        )}
                    </Card>
                    <Card sectioned title={"Freigabedatum Download (Abonnenten werden 2 Tage früher freigeschalten)"}>
                        <DatePicker
                            allowRange={false}
                            month={month}
                            year={year}
                            onMonthChange={handleMonthChange.bind(this)}
                            onChange={onDateChange.bind(this)}
                            selected={uploadDate}
                            disabled={isLoading}
                        />
                    </Card>
                    <Card sectioned title={"Lieferant/Fremdartikelnummer"}>
                        <Select
                            label="Lieferantennummer"
                            options={supplierOptions}
                            onChange={handleSupplierChange.bind(this)}
                            value={supplier.value}
                            disabled={isLoading}
                        />
                        <TextContainer>
                            {supplier.value && (
                                <p>
                                    <br/>
                                    <TextStyle variation="subdued">{supplier.value} {supplier.label} ({supplier.short})</TextStyle>
                                </p>
                            )}
                        </TextContainer>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
};

export default Upload;
