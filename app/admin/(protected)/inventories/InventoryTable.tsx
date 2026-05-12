"use client";

import { InputField } from "@/components/ui/InputField";
import LoadingPage from "@/components/ui/LoadingPage";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranchInventories } from "@/hooks/api/useBranchInventory";
import { useUpdateInventory } from "@/hooks/api/useBranchInventory";
import { useBulkUpdateInventory } from "@/hooks/api/useBranchInventory";
import {
  InventoryItem,
  STOCK_STATUSES,
  StockStatus,
} from "@/types/inventory_types";
import { ChangeEvent, useState } from "react";

const InventoryTable = () => {
  const { data: inventoryData = [], isPending } = useBranchInventories();
  const {
    mutate: updateInventory,
    isPending: isUpdating,
    isError,
    error,
  } = useUpdateInventory();
  const {
    mutate: bulkUpdate,
    isPending: isBulkUpdating,
    isError: isBulkError,
    error: bulkError,
  } = useBulkUpdateInventory();

  const inventoryHeader = [
    "Image",
    "Name",
    "Category",
    "Price",
    "Stock",
    "Incoming Order",
    "Available",
    "Status",
    "Action",
  ];

  // ── Single edit state ─────────────────────────────────────────────────────
  const [isEditStock, setIsEditStock] = useState(false);
  const [inventoryStocks, setInventoryStocks] = useState({
    quantity: 0,
    reorderLevel: 0,
  });
  const [productToEdit, setProductToEdit] = useState<InventoryItem | null>(
    null,
  );

  // ── Bulk edit state ───────────────────────────────────────────────────────
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkValues, setBulkValues] = useState({
    quantity: 0,
    applyReorderLevel: false,
    reorderLevel: 0,
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getStockStatus = (status: StockStatus) => {
    if (status === STOCK_STATUSES.OUT_OF_STOCK)
      return {
        label: "Empty",
        className: "bg-red-50 text-red-700 border border-red-200",
      };
    if (status === STOCK_STATUSES.LOW_STOCK)
      return {
        label: "Low Stock",
        className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      };
    if (status === STOCK_STATUSES.IN_STOCK)
      return {
        label: "In Stock",
        className: "bg-green-50 text-green-700 border border-green-200",
      };
    return {
      label: "Unknown",
      className: "bg-slate-50 text-slate-700 border border-slate-200",
    };
  };

  // ── Single edit handlers ──────────────────────────────────────────────────

  const handleProductToEdit = (product: InventoryItem) => {
    setInventoryStocks({
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
    });
    setProductToEdit(product);
    setIsEditStock(true);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInventoryStocks((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;
    updateInventory(
      { id: productToEdit.id, payload: inventoryStocks },
      { onSuccess: () => setIsEditStock(false) },
    );
  };

  // ── Bulk edit handlers ────────────────────────────────────────────────────

  const enterBulkMode = () => {
    setIsBulkMode(true);
    setSelectedIds(new Set());
  };

  const exitBulkMode = () => {
    setIsBulkMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === inventoryData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inventoryData.map((i) => i.id)));
    }
  };

  const openBulkModal = () => {
    setBulkValues({ quantity: 0, applyReorderLevel: false, reorderLevel: 0 });
    setIsBulkModalOpen(true);
  };

  const handleBulkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setBulkValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleBulkSave = (e: React.FormEvent) => {
    e.preventDefault();

    const items = Array.from(selectedIds).map((id) => ({
      productId: id,
      quantity: bulkValues.quantity,
      ...(bulkValues.applyReorderLevel && {
        reorderLevel: bulkValues.reorderLevel,
      }),
    }));

    bulkUpdate(items, {
      onSuccess: () => {
        setIsBulkModalOpen(false);
        exitBulkMode();
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isPending) return <LoadingPage />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          {isBulkMode
            ? `${selectedIds.size} of ${inventoryData.length} selected`
            : `${inventoryData.length} items`}
        </p>

        <div className="flex items-center gap-2">
          {isBulkMode ? (
            <>
              <button
                type="button"
                onClick={exitBulkMode}
                disabled={isBulkUpdating}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={openBulkModal}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-color-500 hover:bg-brand-color-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save ({selectedIds.size})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterBulkMode}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Edit Bulk
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[70vh]">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {isBulkMode && (
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === inventoryData.length &&
                      inventoryData.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="cursor-pointer accent-brand-color-500"
                  />
                </TableHead>
              )}
              {inventoryHeader
                .filter((h) => !(isBulkMode && h === "Action"))
                .map((item, index) => (
                  <TableHead
                    key={index}
                    className="text-center font-semibold text-slate-700"
                  >
                    {item}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item) => {
              const status = getStockStatus(item.status);
              const isSelected = selectedIds.has(item.id);
              return (
                <TableRow
                  key={item.id}
                  onClick={() => isBulkMode && toggleSelect(item.id)}
                  className={`border-b border-slate-100 transition-colors ${
                    isBulkMode
                      ? isSelected
                        ? "bg-brand-color-50 cursor-pointer"
                        : "hover:bg-slate-50 cursor-pointer"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {isBulkMode && (
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="cursor-pointer accent-brand-color-500"
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-center py-3">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={item.image.url}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {item.category}
                  </TableCell>
                  <TableCell className="text-center text-slate-900 font-medium">
                    ₱{item.price}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Reorder: {item.reorderLevel}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-slate-900">
                      {item.reserved}
                    </span>
                  </TableCell>
                   <TableCell className="text-center">
                    <span className="font-semibold text-slate-900">
                      {item.available}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </TableCell>
                  {!isBulkMode && (
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleProductToEdit(item)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {inventoryData.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          <p>No inventory items found</p>
        </div>
      )}

      {/* Single edit modal */}
      {isEditStock && productToEdit && (
        <Modal
          title={`Update Stock for ${productToEdit.name}`}
          subTitle="Keep your products available"
          onClose={() => !isUpdating && setIsEditStock(false)}
        >
          <form className="space-y-4" onSubmit={handleSave}>
            <InputField
              label="Quantity"
              placeholder="Enter stock/quantity"
              type="number"
              name="quantity"
              value={inventoryStocks.quantity}
              onChange={handleChange}
              required
            />
            <InputField
              label="Reorder Alert Level"
              placeholder="Enter reorder alert"
              type="number"
              name="reorderLevel"
              value={inventoryStocks.reorderLevel}
              onChange={handleChange}
              required
            />
            {isError && (
              <p className="text-sm text-red-600">
                {error?.message ?? "Something went wrong. Please try again."}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditStock(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-color-500 hover:bg-brand-color-600 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isUpdating ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk edit modal */}
      {isBulkModalOpen && (
        <Modal
          title={`Bulk Update Stock`}
          subTitle={`Applying to ${selectedIds.size} selected product${selectedIds.size > 1 ? "s" : ""}`}
          onClose={() => !isBulkUpdating && setIsBulkModalOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleBulkSave}>
            <InputField
              label="Quantity"
              placeholder="Enter quantity for all selected"
              type="number"
              name="quantity"
              value={bulkValues.quantity}
              onChange={handleBulkChange}
              required
            />

            {/* Reorder level toggle */}
            <div className="flex items-center gap-2">
              <input
                id="applyReorderLevel"
                type="checkbox"
                name="applyReorderLevel"
                checked={bulkValues.applyReorderLevel}
                onChange={handleBulkChange}
                className="cursor-pointer accent-brand-color-500"
              />
              <label
                htmlFor="applyReorderLevel"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Apply same reorder level to all
              </label>
            </div>

            {bulkValues.applyReorderLevel && (
              <InputField
                label="Reorder Alert Level"
                placeholder="Enter reorder level for all selected"
                type="number"
                name="reorderLevel"
                value={bulkValues.reorderLevel}
                onChange={handleBulkChange}
                required
              />
            )}

            {isBulkError && (
              <p className="text-sm text-red-600">
                {bulkError?.message ??
                  "Something went wrong. Please try again."}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                disabled={isBulkUpdating}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBulkUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-color-500 hover:bg-brand-color-600 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isBulkUpdating
                  ? "Saving..."
                  : `Update ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InventoryTable;
