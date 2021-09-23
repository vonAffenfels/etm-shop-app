import {Form, FormLayout, Layout, Card, TextContainer, Heading, Page, Badge, Spinner, DatePicker} from "@shopify/polaris";
import FileInput from "../../components/form/FileInput";
import {useState, useEffect} from "react";
import {useRouter} from "next/router";

const Upload = () => {
    const router = useRouter();
    const productId = router.query.id;

    const [files, setFiles] = useState([]);
    const [uploadedState, setUploadedState] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [existingProduct, setExistingProduct] = useState(null);
    const [uploadDate, setUploadDate] = useState(null);
    const [supplier, setSupplier] = useState(null);

    useEffect(() => {
        fetchProduct();
    }, []);

    function fetchProduct() {
        if (typeof window === "undefined") {
            return;
        }

        fetch("/product/" + productId, {
            method: "post",
        }).then(response => response.json()).then(data => {
            setExistingProduct(data);
        }).catch(err => console.log(err));
    }

    let interval = null;
    async function handleSubmit(e) {
        if (!productId) {
            return;
        }

        setLoading(true);

        const formData = new FormData();

        if (files.length) {
            formData.append("file", files[0]);

            if (existingProduct && existingProduct.product) {
                const metafields = existingProduct.product.metafields;

                if (metafields && metafields.edges && metafields.edges.length) {
                    const downloadFields = metafields.edges.map(edge => edge.node).filter(node => node.key === "filename").map(node => node.id);
                    if (downloadFields.length) {
                        formData.append("downloads", downloadFields.join(","))
                    }
                }
            }
        }

        try {
            const data = await fetch("/product/upload/" + productId, {
                method: "post",
                body: formData
            }).then(response => response.text());

            setFiles([]);
            setUploadedState("success");
            setExistingProduct(null);
            fetchProduct();
            setLoading(false);
        } catch (e) {
            console.error(e);
            setUploadedState("error");
            setLoading(false);
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
        setUploadedState(null);
    }

    function onSelect(files) {
        setFiles(files);
        setUploadedState(null);
    }

    function onDateChange(_, __, ___) {
        console.log("onDateChange", _, __, ___)
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
        return downloadFields.map((node, i) => (
            <Card sectioned title={"Vorhandene Dateianhänge"}>
                <TextContainer>
                    <Heading>
                        <a href={"/product/download/" + productId} download>{node.value}</a>
                    </Heading>
                    <p>Hochgeladen am {node.createdAt.substring(0, node.createdAt.indexOf("T"))}</p>
                </TextContainer>
            </Card>
        ));
    }

    function renderTitleMetadata() {
        if (!uploadedState) {
            return null;
        }

        if (uploadedState === "success") {
            return <Badge status="success">hochgeladen</Badge>;
        }
        if (uploadedState === "error") {
            return <Badge status="error">Fehler aufgetreten</Badge>;
        }
    }

    function getTitle() {
        let retVal = "Produktpflege";

        console.log("existingProduct", existingProduct)
        if (existingProduct && existingProduct.product) {
            retVal += " " + existingProduct.product.title;
        }

        return retVal;
    }

    return (
        <Page
            title={getTitle()}
            titleMetadata={renderTitleMetadata()}
            primaryAction={{
                content: "Speichern",
                disabled: !files.length,
                onAction: handleSubmit.bind(this)
            }}
            secondaryActions={[
                {
                    content: "Verwerfen",
                    disabled: !files.length,
                    onAction: reset.bind(this)
                }
            ]}
        >
            <Layout>
                <Layout.Section>
                    {renderExistingProduct()}
                    <Card sectioned title={"Upload Dateianhang"}>
                        {isLoading ? (
                            <Spinner size="large" />
                        ) : (
                            <>
                                <FileInput files={files} onSelect={onSelect.bind(this)} />
                                <DatePicker
                                    day={}
                                    month={}
                                    year={}
                                    onChange={onDateChange.bind(this)}
                                />
                            </>
                        )}
                    </Card>
                    <Card title={"Lieferant/Fremdartikelnummer"}>

                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
};

export default Upload;
