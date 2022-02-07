import {Badge, Button, ButtonGroup, TextField, TextStyle} from "@shopify/polaris";
import React from "react";

const VariantItemSmall = ({item}) => {
    console.log("VariantItemSmall", item);
    const {node: {id, sku, title}} = item;

    return (
        <li className="Polaris-ResourceItem__ListItem">
            <div className="Polaris-ResourceItem__ItemWrapper">
                <div className="Polaris-ResourceItem__Container">
                    <div className="Polaris-ResourceItem__Content">
                        <div>
                            <h3>
                                <TextStyle variation="strong">{title} ({sku})</TextStyle>
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default VariantItemSmall;
