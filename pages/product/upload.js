import {Form, FormLayout, Layout, Card, TextContainer, Heading, Page, Badge} from "@shopify/polaris";
import FileInput from "../../components/form/FileInput";
import {useState, useEffect} from "react";
import {useRouter} from "next/router";

const Upload = () => {
    const router = useRouter();
    console.log(router.query)
    const productId = router.query.id;

    const [files, setFiles] = useState([]);
    const [uploaded, setUploaded] = useState(false);
    const [existingProduct, setExistingProduct] = useState(null);

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
            console.log("data", data)
            setExistingProduct(data);
        }).catch(err => console.log(err));
    }

    async function handleSubmit(e) {
        if (!files.length || !productId) {
            return;
        }

        const formData = new FormData();
        formData.append("file", files[0]);

        try {
            const data = await fetch("/product/upload/" + productId, {
                method: "post",
                body: formData
            }).then(response => response.text());

            setFiles([]);
            setUploaded(true);
            setExistingProduct(null);
            fetchProduct();
        } catch (e) {
            console.error(e);
        }
    }

    function reset() {
        setFiles([]);
        setUploaded(false);
    }

    function onSelect(files) {
        setFiles(files);
        setUploaded(false);
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

        return downloadFields.map((node, i) => (
            <Card sectioned title={"Vorhandene Dateianhänge"}>
                <TextContainer>
                    <Heading>{node.value}</Heading>
                    <p>Hochgeladen am {node.createdAt.substring(0, node.createdAt.indexOf("T") - 1)}</p>
                </TextContainer>
            </Card>
        ));
    }

    return (
        <Page
            title="Download Content für Produkte"
            titleMetadata={uploaded ? <Badge status="success">hochgeladen</Badge> : null}
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
                        <Form onSubmit={handleSubmit.bind(this)}>
                            <FormLayout>
                                <FileInput files={files} onSelect={onSelect.bind(this)} />
                            </FormLayout>
                        </Form>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
};

export default Upload;
