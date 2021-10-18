import {createClient} from "./client";
import getProduct from "./mutations/getProduct";
import getProductBySku from "./mutations/getProductBySku";
import updateProduct from "./mutations/updateProduct";
import updateProductVariant from "./mutations/updateProductVariant";
import removeMetafield from "./mutations/removeMetafield";

export {createClient, getProduct, getProductBySku, updateProduct, updateProductVariant, removeMetafield};
