import React, { useState } from "react";
import { Product } from "@/types/adminType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
    "Description",
    "Category",
    "Price",
    "Stock",
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

          <TableBody className="divide-y divide-gray-100">
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow
                  key={product._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="px-6 py-4 flex items-center justify-center">
                    <div className="relative w-18 h-18">
                      <Image
                        width={200}
                        height={200}
                        src={product?.image?.url || "/images/harrison_logo.png"}
                        alt={product.name}
                        className="w-18 h-18"
                      />
                      {/* Badges overlaid on image */}
                      <div className="absolute top-0 left-0 flex flex-col gap-1">
                        {product.isPopular && (
                          <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md leading-tight">
                            🔥 Popular
                          </span>
                        )}
                        {product.isSignature && (
                          <span className="bg-[#ef4501] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md leading-tight">
                            ✦ Signature
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="font-semibold text-gray-800">
                      {product.name}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-gray-500 mt-1">
                      {product.description.substring(0, 50) + "..."}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {product.category?.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">
                      ₱{product.price.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
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
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-emerald-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    <Search size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">
                      No Products Found
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
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
