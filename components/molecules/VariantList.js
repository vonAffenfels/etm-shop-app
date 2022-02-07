import {ResourceList, TextStyle, ButtonGroup, Button, TextField} from "@shopify/polaris";
import React, {useState, useEffect} from "react";
import VariantItemSmall from "./VariantItemSmall";
import {useRouter} from "next/router";

const VariantList = ({existingProduct}) => {
    const router = useRouter();
    const productId = router.query.id;
    const [variants, setVariants] = useState([]);
    console.log("VariantList", existingProduct)

    // useEffect(() => {
    //     if (existingProduct?.product?.totalVariants) {
    //         fetchVariants(5);
    //     }
    // }, []);

    useEffect(() => {
        if (existingProduct?.product?.totalVariants && (variants.length < existingProduct?.product?.totalVariants)) {
            let lastVariant = null;
            if (variants.length) {
                lastVariant = {
                    ...variants[variants.length - 1]
                };
            }
            fetchVariants(5, lastVariant?.cursor);
        }
    }, [variants, existingProduct?.product?.totalVariants]);

    if (!existingProduct || !existingProduct.product || !existingProduct.product.totalVariants) {
        return null;
    }

    const fetchVariants = async (limit, after) => {
        try {
            console.log("fetchVariants")
            const data = await fetch("/product/variants/", {
                method: "post",
                body: {
                    productId: productId,
                    limit: limit,
                    cursor: after,
                    pkgSize: "small"
                }
            }).then(response => response.json());
            console.log("data", data);
            if (data.length) {
                setVariants([...variants, ...data])
            }
        } catch (e) {
            console.log(e)
        }
    };

    return (
        <div className="Polaris-ResourceList__ResourceListWrapper">
            <div className="Polaris-ResourceList__HeaderOuterWrapper">
                <div>
                    <div style={{paddingBottom: "0px"}}></div>
                    <div>
                        <div className="Polaris-ResourceList__HeaderWrapper">
                            <div className="Polaris-ResourceList__HeaderContentWrapper">
                                <div className="Polaris-ResourceList__HeaderTitleWrapper">{existingProduct.product.totalVariants} Varianten</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ul className="Polaris-ResourceList">
                {variants.map((item) => <VariantItemSmall item={item} />)}
            </ul>
        </div>
    );
};

export default VariantList;
