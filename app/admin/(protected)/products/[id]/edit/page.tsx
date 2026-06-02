import { Product as ProductModel } from "@/models/Product";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import ProductFormPage from "../../ProductPage";
import { connectDB } from "@/lib/mongodb";

const EditProductPage = async ( context : {params: Promise<{id: string}>}) => {
  
  await connectDB();
  const { id } = await context.params;

  if (!isValidObjectId(id)) return notFound();

  const product = await ProductModel.findById(id).populate({
    path: "includedItems.product",
    select: "name price",
  });

  if (!product) return notFound();

  const serialized = JSON.parse(JSON.stringify(product));

  return <ProductFormPage editProduct={serialized} />;
};

export default EditProductPage;
