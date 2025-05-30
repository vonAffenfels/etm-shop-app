import {
    Frame,
    Layout,
    Card,
    TextContainer,
    Heading,
    Page,
    Badge,
    Spinner,
    Button,
    DescriptionList,
    ResourceList,
    ResourceItem,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import FileInput from "../../components/form/FileInput";

const supplierOptions = [
    {
        value: "000001",
        short: "CON",
        label: "Conrad GmbH",
    },
    {
        value: "000002",
        short: "FLI",
        label: "Fliegl Fahrzeugbau GmbH",
    },
    {
        value: "000003",
        short: "GAS",
        label: "MOGI-JG",
    },
    {
        value: "000004",
        short: "GMT",
        label: "nicht vergeben (ehem. GMTS)",
    },
    {
        value: "000005",
        short: "JOA",
        label: "JOAL-Der Spanien Shop",
    },
    {
        value: "000006",
        short: "JUM",
        label: "Jumbo-Fischer GmbH&Co. KG",
    },
    {
        value: "000007",
        short: "KOO",
        label: "KooKoo GmbH",
    },
    {
        value: "000008",
        short: "MOB",
        label: "Motorbuch Versand",
    },
    {
        value: "000009",
        short: "NZG",
        label: "NZG Modelle GmbH",
    },
    {
        value: "000010",
        short: "SCF",
        label: "Schilderfeuerwehr",
    },
    {
        value: "000011",
        short: "WIV",
        label: "Wieland Verlag GmbH",
    },
    {
        value: "000012",
        short: "STD",
        label: "Hörtkorn",
    },
    {
        value: "000013",
        short: "MOP",
        label: "Motorpresse",
    },
    {
        value: "000014",
        short: "ETM",
        label: "ETM Verlag",
    },
    {
        value: "000015",
        short: "WSI",
        label: "Vertriebsbüro Deutschland WSI Models B.V.",
    },
    {
        value: "000016",
        short: "HER",
        label: "Herpa",
    },
    {
        value: "000017",
        short: "THO",
        label: "Thomin",
    },
    {
        value: "000018",
        short: "KOS",
        label: "Modelissimo Kosmann oHG",
    },
    {
        value: "000019",
        short: "LEC",
        label: "Lechtoys",
    },
    {
        value: "000020",
        short: "SPE",
        label: "Speedbird",
    },
    {
        value: "000021",
        short: "MOPC",
        label: "Motorpresse (Kalender + DBL)",
    },
    {
        value: "000022",
        short: "RAC",
        label: "racefoxx (LTP Litschka GmbH & Co. KG)",
    },
];

const subscriptionRelationOptions = [
    { value: "01", label: "Print" },
    { value: "15", label: "Kombi" },
    { value: "20", label: "Digital" },
    { value: "50", label: "firmenauto Basis-Flat" },
    { value: "51", label: "Flatrate" },
];

const subscriptionProjects = [
    { value: "00004453", label: "lastauto omnibus PLUS" },
    { value: "00006035", label: "trans aktuell" },
    { value: "00080318", label: "FIRMENAUTO" },
    { value: "00084844", label: "WERKSTATT aktuell" },
    { value: "00091180", label: "FERNFAHRER" },
    { value: "00098031", label: "firmenauto Flatrate" },
    { value: "00099118", label: "eurotransport Flatrate" },
];

const zenitItems = [
    {
        apiName: "delivery-code",
        description: "Bestandsstatus",
        values: ["F1: lieferbar", "B1: vergriffen"],
        dependency:
            "Für inaktive Produkte immer B1. Bei aktiven Produkte B1, wenn der Bestand leer ist und nicht weiterverkauft werden soll. Ansonsten F1.",
    },
    {
        apiName: "article-status",
        description: "Artikelstatus",
        values: ["1: aktiv", "2: inaktiv"],
        dependency:
            "Für alle nicht-aktiven Produkte (Entwurf, archiviert) wird eine 2 übertragen, ansonsten 1.",
    },
];

const Upload = () => {
    const router = useRouter();
    const productId = router.query.id;

    const [touched, setTouched] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadedState, setUploadedState] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [existingProduct, setExistingProduct] = useState(null);
    const [tokens, setTokens] = useState([]);

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
        })
            .then((response) => response.json())
            .then((data) => {
                setExistingProduct(data);
            })
            .catch((err) => console.log(err));
    }

    function fetchTokens() {
        if (typeof window === "undefined") {
            return;
        }

        fetch("/product/" + productId + "/token/find", {
            method: "post",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.data) {
                    setTokens(data.data);
                }
            })
            .catch((err) => console.log(err));
    }

    function createDownloadToken() {
        fetch("/product/" + productId + "/token/create", {
            method: "post",
        })
            .then((response) => response.json())
            .then((data) => {
                fetchTokens();
            })
            .catch((err) => console.log(err));
    }

    function deleteDownloadToken(id) {
        fetch("/product/" + productId + "/token/delete/" + id, {
            method: "post",
        })
            .then((response) => response.json())
            .then((data) => {
                fetchTokens();
            })
            .catch((err) => console.log(err));
    }

    function deleteDownloadAttachment(id) {
        fetch("/metafield/remove/" + id.replace("gid://shopify/Metafield/", ""), {
            method: "post",
            data: JSON.stringify({
                ownerId: productId,
                key: "filename",
                namespace: "Download",
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                fetchProduct();
                fetchTokens();
            })
            .catch((err) => console.log(err));
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
            metafields.edges
                .map((edge) => edge.node)
                .forEach((node) => {
                    mappedFields[node.key] = node.id;
                });
        }

        if (files.length) {
            formData.append("file", files[0]);
            if (mappedFields["filename"]) {
                formData.append("downloads", String(mappedFields["filename"]));
            }
        }

        try {
            console.log("FORMDATA", Object.fromEntries(formData));
            const data = await fetch("/product/upload/" + productId, {
                method: "post",
                body: formData,
            }).then((response) => response.text());
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

    function renderExistingProduct() {
        if (!existingProduct || !existingProduct.product) {
            return null;
        }

        const metafields = existingProduct.product.metafields;

        if (!metafields || !metafields.edges || !metafields.edges.length) {
            return null;
        }

        const downloadFields = metafields.edges
            .map((edge) => edge.node)
            .filter((node) => node.key === "filename");
        return (
            <>
                {downloadFields.map((node, i) => (
                    <Card sectioned title={"Vorhandene Dateianhänge"}>
                        <TextContainer>
                            <Heading>
                                <a
                                    href={"/product/download/" + productId}
                                    download
                                    style={{ marginRight: "10px" }}
                                >
                                    {node.value}
                                </a>
                                <Button
                                    plain
                                    destructive
                                    onClick={deleteDownloadAttachment.bind(
                                        this,
                                        node.id
                                    )}
                                >
                                    Löschen
                                </Button>
                            </Heading>
                            <p>
                                Hochgeladen am{" "}
                                {node.createdAt.substring(
                                    0,
                                    node.createdAt.indexOf("T")
                                )}
                            </p>
                            {tokens.length > 0 && (
                                <>
                                    {tokens.map((token, i) => (
                                        <>
                                            <p key={"token_" + i}>
                                                <span
                                                    style={{
                                                        marginRight: "10px",
                                                    }}
                                                >
                                                    {"https://www.eurotransport.de/shopify-api/token/download/" +
                                                        token._id}
                                                </span>
                                                <Button
                                                    plain
                                                    destructive
                                                    onClick={deleteDownloadToken.bind(
                                                        this,
                                                        token._id
                                                    )}
                                                >
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
            return (
                <a target="_blank" href={existingProduct.shopUrl}>
                    {retVal}
                </a>
            );
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
                    onAction: handleSubmit.bind(this),
                }}
                secondaryActions={[
                    {
                        content: "Verwerfen",
                        disabled: !touched,
                        onAction: reset.bind(this),
                    },
                ]}
            >
                <Layout>
                    <Layout.Section>
                        {renderExistingProduct()}
                        <Card sectioned title={"Upload Dateianhang"}>
                            {isLoading ? (
                                <Spinner size="large" />
                            ) : (
                                <FileInput
                                    files={files}
                                    onSelect={onSelect.bind(this)}
                                />
                            )}
                        </Card>
                        <Card
                            sectioned
                            title={
                                "Übersicht: Bedeutung Abkürzungen und Nummern"
                            }
                        >
                            <TextContainer>Lieferantennummer</TextContainer>
                            <DescriptionList
                                items={supplierOptions.map((v) => {
                                    return {
                                        term: v.value,
                                        description: v.short + " - " + v.label,
                                    };
                                })}
                            />
                            <hr
                                style={{
                                    marginTop: "20px",
                                    marginBottom: "25px",
                                    border: "1px solid black",
                                }}
                            />
                            <TextContainer>Bezugstyp</TextContainer>
                            <DescriptionList
                                items={subscriptionRelationOptions.map((v) => {
                                    return {
                                        term: v.value,
                                        description: v.label,
                                    };
                                })}
                            />
                            <hr
                                style={{
                                    marginTop: "20px",
                                    marginBottom: "25px",
                                    border: "1px solid black",
                                }}
                            />
                            <TextContainer>MPN / Projekt</TextContainer>
                            <DescriptionList
                                items={subscriptionProjects.map((v) => {
                                    return {
                                        term: v.value,
                                        description: v.label,
                                    };
                                })}
                            />
                        </Card>
                        <Card sectioned title={"Übersicht: Zenit-Sync Felder"}>
                            <ResourceList
                                items={zenitItems}
                                renderItem={(item, i) => {
                                    const {
                                        apiName,
                                        description,
                                        values,
                                        dependency,
                                    } = item;

                                    return (
                                        <ResourceItem id={"zenit-field-" + i}>
                                            <TextContainer>
                                                <p style={{ fontWeight: 700 }}>
                                                    {apiName}
                                                </p>
                                            </TextContainer>
                                            <TextContainer>
                                                {description}
                                            </TextContainer>
                                            <TextContainer>
                                                {values.join(", ")}
                                            </TextContainer>
                                            <TextContainer>
                                                {dependency}
                                            </TextContainer>
                                        </ResourceItem>
                                    );
                                }}
                            />
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        </Frame>
    );
};

export default Upload;
