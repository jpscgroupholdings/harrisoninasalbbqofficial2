import { syne } from "@/app/font";
import { InputField } from "@/components/ui/FormComponents/InputField";
import { MODAL_TYPES, useModalQuery } from "@/hooks/utils/useModalQuery";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const GuestOrderLookup = () => {
  const router = useRouter();
  const { openModal: handleOpenModal } = useModalQuery();
  const [referenceNumber, setReferenceNumber] = useState("");
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/orders/guest/${encodeURIComponent(referenceNumber.trim())}`);
  };

  return (
    <div
      className={`${syne.className} min-h-[70vh] bg-linear-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4`}
    >
      <div className="w-full max-w-md">
        {/* Illustration / Icon */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-4 shadow-inner">
            <DynamicIcon
              name="ShoppingBag"
              size={38}
              className="text-slate-500"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Track Your Order
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            You&apos;re not signed in. Enter your order reference number below
            to check your order status, or{" "}
            <button
              onClick={() => handleOpenModal(MODAL_TYPES.LOGIN)}
              className="text-brand-color-500 font-semibold hover:underline cursor-pointer"
            >
              log in
            </button>{" "}
            to see all your orders.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <InputField
              label="Order Reference Number"
              leftIcon={
                <DynamicIcon name="Hash" size={16} className="text-slate-400" />
              }
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. ORDER-20240410XXXX"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              You can find this in your order confirmation email.
            </p>

            <button
              type="submit"
              disabled={!referenceNumber.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-color-500 hover:bg-[#c13500] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md"
            >
              <DynamicIcon name="Search" size={16} />
              Find My Order
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-center gap-1">
            <p className="text-sm text-slate-500">Have an account?</p>
            <button
              onClick={() => handleOpenModal(MODAL_TYPES.LOGIN)}
              className="text-sm flex underline cursor-pointer text-brand-color-500 font-medium hover:text-[#c13500] transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
