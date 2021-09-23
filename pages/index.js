import {Form, FormLayout, Layout, Card, Page, Spinner, TextField, Button, List, Link} from "@shopify/polaris";
import {useState} from "react";

const Index = () => {
    const [isLoading, setLoading] = React.useState(null);
    const [text, setText] = React.useState("");
    const [result, setResult] = React.useState([]);

    // const result = await this.client.request(gql`${this.queries["getProduct"]}`, {query: ``});
    function onChange(value) {
        console.log("onChange", value);
        setText(value);
    }

    function onClick(e) {
        setLoading(true);

        fetch("/product/find/" + text, {
            method: "post",
        }).then(response => response.json()).then(data => {
            setLoading(false);
            console.log(data)
            if (data.productVariants && data.productVariants.edges) {
                setResult(data.productVariants.edges);
            } else {
                setResult([]);
            }
        }).catch(err => console.log(err));
    }

    function onSelected(_, __) {
        console.log("onSelected", _, __)
    }

    return (
        <Page
            title="Download Content für Produkte"
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
                                    const id = String(entry.node.product.id).replace("gid://shopify/Product/", "")

                                    return <List.Item><Link url={"/product/upload/?id=" + id}>{entry.node.product.title}</Link></List.Item>
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
