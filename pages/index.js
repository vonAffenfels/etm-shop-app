import {Form, FormLayout, Layout, Card, Page, Spinner, TextField, Button, List, Link} from "@shopify/polaris";
import {useState} from "react";

const Index = () => {
    const [isLoading, setLoading] = React.useState(null);
    const [text, setText] = React.useState("");
    const [result, setResult] = React.useState([]);

    // const result = await this.client.request(gql`${this.queries["getProduct"]}`, {query: ``});
    function onChange(value) {
        setText(value);
    }

    function onClick(e) {
        setLoading(true);

        fetch("/product/find/" + text, {
            method: "post",
        }).then(response => response.json()).then(data => {
            setLoading(false);
            if (data.productVariants && data.productVariants.edges) {
                setResult(data.productVariants.edges);
            } else {
                setResult([]);
            }
        }).catch(err => console.log(err));
    }

    return (
        <Page
            title="Produktpflege"
        >
            <Layout>
                <Layout.Section>
                    <Card sectioned title={"Produkt finden"}>
                        {isLoading ? (
                            <Spinner size="large" />
                        ) : (
                            <Form>
                                <FormLayout>
                                    <TextField label="Artikelnummer" value={text} onChange={onChange.bind(this)} />
                                    <Button onClick={onClick.bind(this)}>Suchen</Button>
                                </FormLayout>
                            </Form>
                        )}
                    </Card>
                    {result && result.length > 0 && (
                        <Card sectioned title={"Suchergebnisse"}>
                            <List>
                                {result.map(entry => {
                                    let id = String(entry.node.product.id).replace("gid://shopify/Product/", "")
                                    let url = new URL(window.location.href);
                                    url.pathname = "/product/upload";
                                    url.searchParams.set("id", id);
                                    console.log("id", id)
                                    console.log("url.href", url.href)
                                    return <List.Item><Link url={url.href}>{entry.node.product.title}</Link></List.Item>
                                })}
                            </List>
                        </Card>
                    )}
                </Layout.Section>
            </Layout>
        </Page>
    )
};

export default Index;
