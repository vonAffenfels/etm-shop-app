import {
    Frame,
    Layout,
    Card,
    Stack,
    TextContainer,
    TextStyle,
    TextField,
    Heading,
    Page,
    Badge,
    Spinner,
    DatePicker,
    Select,
    Button,
    Checkbox
} from "@shopify/polaris";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "next/router";
import FileInput from "../../components/form/FileInput";
import VariantList from "../../components/molecules/VariantList";
import {ProductContext} from "../../components/form/ProductContext";

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
];
const subscriptionProjects = [
    {value: null, label: "Bitte wählen"},
    {value: "00004453", label: "lastauto omnibus PLUS"},
    {value: "00006035", label: "trans aktuell"},
    {value: "00080318", label: "FIRMENAUTO"},
    {value: "00084844", label: "WERKSTATT aktuell"},
    {value: "00091180", label: "FERNFAHRER"},
    {value: "00098031", label: "firmenauto Flatrate"},
    {value: "00099118", label: "eurotransport Flatrate"},
];

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
    const [hiddenZenit, setHiddenZenit] = useState(false);
    const [bqNumber, setBqNumber] = useState("");
    const [relation, setRelation] = useState({value: null, label: ""});
    const [project, setProject] = useState({value: null, label: ""});
    const [missingForeignSkuVariants, setMissingForeignSkuVariants] = useState([]);
    const handleMonthChange = useCallback((month, year) => setDate({month, year}), []);

    function _setMissingForeignSkuVariants(sku, isMissing) {
        if (isMissing) {
            if (missingForeignSkuVariants.indexOf(sku) === -1) {
                setMissingForeignSkuVariants([...missingForeignSkuVariants, sku]);
            }
        } else if (missingForeignSkuVariants.indexOf(sku) !== -1) {
            setMissingForeignSkuVariants([...missingForeignSkuVariants.filter(v => v != sku)])
        }
    }

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
        if (relationInput === "Bitte wählen") {
            setRelation({value: null, label: ""});
            return;
        }

        subscriptionRelationOptions.forEach((relationOption) => {
            if (relationOption.value === relationInput) {
                setRelation(relationOption);
                setTouched(true);
            }
        });
    }

    function onProjectChange(projectInput) {
        if (projectInput === "Bitte wählen") {
            setProject({value: null, label: ""});
            return;
        }

        subscriptionProjects.forEach((projectOption) => {
            if (projectOption.value === projectInput) {
                setProject(projectOption);
                setTouched(true);
            }
        });
    }

    function onHiddenChange(checked) {
        setHidden(checked);
        setTouched(true);
    }

    function onHiddenZenitChange(checked) {
        setHiddenZenit(checked);
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

        if (files.length) {
            formData.append("file", files[0]);
            if (mappedFields["filename"]) {
                formData.append("downloads", String(mappedFields["filename"]));
            }
        }

        formData.append("hinttext", hintText);
        if (mappedFields["hinttext"]) {
            formData.append("hinttextid", String(mappedFields["hinttext"]));
        }

        if (uploadDate) {
            formData.append("downloaddate", uploadDate.start);
            if (mappedFields["downloaddate"]) {
                formData.append("downloaddateid", String(mappedFields["downloaddate"]));
            }
        }

        formData.append("supplierid", supplier.value);
        if (mappedFields["supplierid"]) {
            formData.append("suppliermetaid", String(mappedFields["supplierid"]));
        }

        formData.append("hidden", hidden ? "1" : "0");
        if (mappedFields["hidden"]) {
            formData.append("hiddenid", String(mappedFields["hidden"]));
        }

        formData.append("hiddenzenit", hiddenZenit ? "1" : "0");
        if (mappedFields["hiddenZenit"]) {
            formData.append("hiddenzenitid", String(mappedFields["hiddenZenit"]));
        }

        formData.append("bqnumber", bqNumber);
        if (mappedFields["bqnumber"]) {
            formData.append("bqnumberid", String(mappedFields["bqnumber"]));
        }

        formData.append("bqrelation", relation.value);
        if (mappedFields["bqrelation"]) {
            formData.append("bqrelationid", String(mappedFields["bqrelation"]));
        }

        formData.append("project", project.value);
        if (mappedFields["project"]) {
            formData.append("projectid", String(mappedFields["project"]));
        }

        try {
            console.log("FORMDATA", Object.fromEntries(formData));
            const data = await fetch("/product/upload/" + productId, {
                method: "post",
                body: formData
            }).then(response => response.text());
            console.log("data", data);

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

        let supplierId = mappedFields["supplierid"];
        if (supplierId) {
            while (String(supplierId).length < 6) {
                supplierId = "0" + supplierId;
            }
            supplierOptions.forEach((supplierOption) => {
                if (supplierOption.value === supplierId) {
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

        if (mappedFields["hiddenZenit"]) {
            setHiddenZenit(mappedFields["hiddenZenit"] == "1" ? true : false);
        } else {
            setHiddenZenit(false);
        }

        if (mappedFields["bqnumber"]) {
            setBqNumber(mappedFields["bqnumber"]);
        } else {
            setBqNumber("");
        }

        if (mappedFields["bqrelation"]) {
            subscriptionRelationOptions.forEach((relationOption) => {
                if (relationOption.value === mappedFields["bqrelation"]) {
                    setRelation(relationOption);
                }
            });
        } else {
            setRelation({value: null, label: ""});
        }

        if (mappedFields["project"]) {
            subscriptionProjects.forEach((projectOption) => {
                if (projectOption.value === mappedFields["project"]) {
                    setProject(projectOption);
                }
            });
        } else {
            setProject({value: null, label: ""});
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
                                <a href={"/product/download/" + productId} download
                                   style={{marginRight: "10px"}}>{node.value}</a>
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
                                                <Button plain destructive
                                                        onClick={deleteDownloadToken.bind(this, token._id)}>
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

    function renderSupplierNote() {
        // const missingFields = [];
        // if (!supplier || !supplier.value) {
        //     missingFields.push("Lieferantennummer");
        // }
        //
        // if (missingFields.length) {
        //     return (
        //         <>
        //             <Stack>
        //                 <Badge status="warning">Lieferantennummer fehlt</Badge>
        //                 <TextContainer>
        //                     <p>
        //                         <TextStyle variation="subdued">Das Produkt kann nicht mit Zenit synchronisiert werden.</TextStyle>
        //                     </p>
        //                 </TextContainer>
        //             </Stack>
        //             {(missingForeignSkuVariants.length > 0) && (
        //                 <>
        //                     <br/>
        //                     <Stack>
        //                         <Badge status="warning">{missingForeignSkuVariants.join(", ")}</Badge>
        //                         <TextContainer>
        //                             <p>
        //                                 <TextStyle variation="subdued">Fremdartikelnummer fehlt. Variante kann nicht mit Zenit synchronisiert werden.</TextStyle>
        //                             </p>
        //                         </TextContainer>
        //                     </Stack>
        //                 </>
        //             )}
        //         </>
        //     );
        // }

        return null;
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

    return (
        <Frame>
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
                subtitle={renderSupplierNote()}
            >
                <Layout>
                    <Layout.Section>
                        <Card sectioned title={"Sichtbarkeit"}>
                            {/*<Checkbox*/}
                            {/*    label="Bei Kauf nicht an Zenit übertragen"*/}
                            {/*    checked={hiddenZenit}*/}
                            {/*    disabled={isLoading}*/}
                            {/*    onChange={onHiddenZenitChange.bind(this)}*/}
                            {/*/>*/}
                            {/*<br/>*/}
                            {/*<Checkbox*/}
                            {/*    label="Produkt verstecken"*/}
                            {/*    checked={hidden}*/}
                            {/*    disabled={isLoading}*/}
                            {/*    onChange={onHiddenChange.bind(this)}*/}
                            {/*/>*/}
                            <TextContainer>
                                {existingProduct && (
                                    <p>
                                        <br/>
                                        <TextStyle variation="subdued"><a target="_blank" href={existingProduct.shopUrl}>Detailseite
                                            öffnen</a></TextStyle>
                                    </p>
                                )}
                            </TextContainer>
                        </Card>
                        {/*<Card sectioned title={"Hinweistext Verfügbarkeit"}>*/}
                        {/*    <TextField disabled={isLoading} value={hintText} onChange={onHintChange.bind(this)}/>*/}
                        {/*</Card>*/}
                        {/*<Card sectioned title={"Abonnement/Hefte"}>*/}
                        {/*    <TextField label={"Bezugsquelle"} disabled={isLoading} value={bqNumber}*/}
                        {/*               onChange={onBqNumberChange}/>*/}
                        {/*    <p>*/}
                        {/*        <br/>*/}
                        {/*        <Select*/}
                        {/*            options={subscriptionRelationOptions}*/}
                        {/*            label={"Bezugstyp"}*/}
                        {/*            disabled={isLoading}*/}
                        {/*            value={relation.value}*/}
                        {/*            onChange={onRelationChange.bind(this)}*/}
                        {/*        />*/}
                        {/*        <TextContainer>*/}
                        {/*            {relation.value && (*/}
                        {/*                <p>*/}
                        {/*                    <br/>*/}
                        {/*                    <TextStyle variation="subdued">entspricht {relation.value}</TextStyle>*/}
                        {/*                </p>*/}
                        {/*            )}*/}
                        {/*        </TextContainer>*/}
                        {/*    </p>*/}
                        {/*    <p>*/}
                        {/*        <br/>*/}
                        {/*        <Select*/}
                        {/*            options={subscriptionProjects}*/}
                        {/*            label={"MPN / Projekt"}*/}
                        {/*            disabled={isLoading}*/}
                        {/*            value={project.value}*/}
                        {/*            onChange={onProjectChange.bind(this)}*/}
                        {/*        />*/}
                        {/*        <TextContainer>*/}
                        {/*            {project.value && (*/}
                        {/*                <p>*/}
                        {/*                    <br/>*/}
                        {/*                    <TextStyle variation="subdued">entspricht {project.value}</TextStyle>*/}
                        {/*                </p>*/}
                        {/*            )}*/}
                        {/*        </TextContainer>*/}
                        {/*    </p>*/}
                        {/*</Card>*/}
                        {/*<Card sectioned title={"Lieferant/Fremdartikelnummer"}>*/}
                        {/*    <Select*/}
                        {/*        label="Lieferantennummer"*/}
                        {/*        options={supplierOptions}*/}
                        {/*        onChange={handleSupplierChange.bind(this)}*/}
                        {/*        value={supplier.value}*/}
                        {/*        disabled={isLoading}*/}
                        {/*    />*/}
                        {/*    <p>*/}
                        {/*        <br/>*/}
                        {/*        <TextContainer>*/}
                        {/*            {supplier.value && (*/}
                        {/*                <p>*/}
                        {/*                    <br/>*/}
                        {/*                    <TextStyle*/}
                        {/*                        variation="subdued">{supplier.value} {supplier.label} ({supplier.short})</TextStyle>*/}
                        {/*                </p>*/}
                        {/*            )}*/}
                        {/*        </TextContainer>*/}
                        {/*    </p>*/}
                        {/*</Card>*/}
                        {/*<Card sectioned title={"Varianten"}>*/}
                        {/*    <ProductContext.Provider value={{*/}
                        {/*        product: existingProduct?.product,*/}
                        {/*        supplier: supplier,*/}
                        {/*        setMissingForeignSkuVariants: _setMissingForeignSkuVariants*/}
                        {/*    }}>*/}
                        {/*        <VariantList existingProduct={existingProduct}/>*/}
                        {/*    </ProductContext.Provider>*/}
                        {/*</Card>*/}
                        {/*{renderExistingProduct()}*/}
                        <Card sectioned title={"Upload Dateianhang"}>
                            {isLoading ? (
                                <Spinner size="large"/>
                            ) : (
                                <FileInput files={files} onSelect={onSelect.bind(this)}/>
                            )}
                        </Card>
                        {/*<Card sectioned title={"Freigabedatum Download (Abonnenten werden 2 Tage früher freigeschalten)"}>*/}
                        {/*    <DatePicker*/}
                        {/*        allowRange={false}*/}
                        {/*        month={month}*/}
                        {/*        year={year}*/}
                        {/*        onMonthChange={handleMonthChange.bind(this)}*/}
                        {/*        onChange={onDateChange.bind(this)}*/}
                        {/*        selected={uploadDate}*/}
                        {/*        disabled={isLoading}*/}
                        {/*    />*/}
                        {/*</Card>*/}
                    </Layout.Section>
                </Layout>
            </Page>
        </Frame>
    )
};

export default Upload;
