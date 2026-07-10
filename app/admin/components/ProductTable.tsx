import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useDeleteProduct } from "@/hooks/api/useProducts";
import PermissionGuard from "@/lib/PermissionGuard";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Product } from "@/types/products";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppImage } from "@/components/AppImage";

interface ProductTableProps {
  products: Product[];
  onEdit?: (item: Product) => void;
}

export default function ProductTable({ products, onEdit }: ProductTableProps) {
  const router = useRouter();

  const productHeaders = [
    "Image",
    "Product",
    "Type",
    "Category",
    "Price",
    "Pax",
    "Actions",
  ];

  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );

  const deleteMutation = useDeleteProduct();

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      setDeletingProductId(id);
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeletingProductId(null);
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
                      <div className="w-18 h-18 object-cover rounded-md">
                        <AppImage
                          src={
                            product?.image?.url || "/images/harrison_logo.png"
                          }
                          alt={product.name}
                          loading="lazy"
                        />
                      </div>

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
                      product.modifierGroups?.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {product.modifierGroups.length} groups ·{" "}
                          {product.modifierGroups.reduce(
                            (sum, g) => sum + (g.items?.length ?? 0),
                            0,
                          )}{" "}
                          items
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

                  {/* ACTIONS */}
                  <TableCell className="px-6 py-4">
                    {deleteMutation.isPending &&
                    deletingProductId === product._id ? (
                      <div className="flex items-center justify-center">
                        <DynamicIcon
                          name="Loader2"
                          size={16}
                          className="animate-spin text-gray-400"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <PermissionGuard
                          permission="products.update"
                          fallback={
                            <span className="text-xs text-gray-400">
                              No access on buttons
                            </span>
                          }
                        >
                          <button
                            onClick={() =>
                              router.push(`/products/${product._id}/edit`)
                            }
                            disabled={deletingProductId === product._id}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <DynamicIcon name="PencilLine" size={16} />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="products.delete">
                          <button
                            onClick={() => handleDeleteItem(product._id)}
                            disabled={deletingProductId === product._id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <DynamicIcon name="Trash2" size={16} />
                          </button>
                        </PermissionGuard>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={productHeaders.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DynamicIcon
                      name="Search"
                      size={48}
                      className="text-slate-300 mb-4"
                    />
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
