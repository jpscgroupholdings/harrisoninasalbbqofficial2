import React, { useState } from "react";
import { Product } from "@/types/adminType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { PencilLine, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteProduct } from "@/hooks/api/useProducts";
import Image from "next/image";

interface ProductTableProps {
  products: Product[];
  onEdit: (item: Product) => void;
}

export default function ProductTable({ products, onEdit }: ProductTableProps) {
  const productHeaders = [
    "Image",
    "Product",
    "Type",
    "Category",
    "Price",
    "Pax",
    "Actions",
  ];

  const deleteMutation = useDeleteProduct();

  const handleDeleteItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted successfully!");
      return;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {productHeaders.map((head, index) => (
                <TableHead
                  key={index}
                  className="font-semibold uppercase tracking-wider text-center"
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow
                  key={product._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* IMAGE */}
                  <TableCell className="px-6 py-4 flex items-center justify-center">
                    <div className="relative w-18 h-18">
                      <Image
                        width={200}
                        height={200}
                        src={product?.image?.url || "/images/harrison_logo.png"}
                        alt={product.name}
                        className="w-18 h-18 object-cover rounded-md"
                      />

                      <div className="absolute top-0 left-0 flex flex-col gap-1">
                        {product.isPopular && (
                          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md">
                            🔥 Popular
                          </span>
                        )}
                        {product.isSignature && (
                          <span className="bg-brand-color-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md">
                            ✦ Signature
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* NAME + INCLUDED ITEMS */}
                  <TableCell className="px-6 py-4">
                    <p className="font-semibold text-slate-800">
                      {product.name}
                    </p>

                    {product.productType !== "solo" &&
                      product.includedItems?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {product.includedItems.length} items included
                        </p>
                      )}
                  </TableCell>

                  {/* TYPE */}
                  <TableCell className="px-6 py-4 text-center">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 uppercase">
                      {product.productType || "No Product Type"} 
                    </span>
                  </TableCell>

                  {/* CATEGORY */}
                  <TableCell className="px-6 py-4">
                    <p className="flex flex-col">
                      <span className=" capitalize text-slate-900 font-bold">
                        {product.category?.name}
                      </span>
                      <span className="text-sm text-slate-600">
                        {product.subcategory?.name ?? "No Subcategory"}
                      </span>
                    </p>
                  </TableCell>

                  {/* PRICE */}
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">
                      {product.price !== null
                        ? `₱${product.price.toFixed(2)}`
                        : "Varies"}
                    </span>
                  </TableCell>

                  {/* PAX */}
                  <TableCell className="px-6 py-4 text-center">
                    <span className="text-sm text-slate-600">
                      {product.paxCount ? `${product.paxCount} pax` : "-"}
                    </span>
                  </TableCell>

                  {/* STOCK */}
                  {/* <TableCell className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        product.stock === 0
                          ? "text-red-600"
                          : product.stock < 20
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </TableCell> */}

                  {/* ACTIONS */}
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-emerald-600 hover:bg-blue-50 rounded-lg"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={productHeaders.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">
                      No Products Found
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      There are currently no products available.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
