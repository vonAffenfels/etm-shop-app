import {Form, FormLayout, Layout, Card, Page, Spinner, TextField, Button} from "@shopify/polaris";
import {useState} from "react";

const Index = () => {
    const [isLoading, setLoading] = React.useState(null);
    const [text, setText] = React.useState("");
    const [result, setResult] = React.useState(null);

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
            setResult(data);
        }).catch(err => console.log(err));
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
                </Layout.Section>
            </Layout>
        </Page>
    )
};

export default Index;
