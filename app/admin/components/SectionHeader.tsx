import { useStaffContext } from "@/contexts/StaffContext";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import React from "react";

type SectionHeaderProps = {
  title: string;
  subTitle?: string;
  breadcrumb?: React.ReactNode;

  // Primary action button
  onClick?: () => void;
  btnTxt?: string;
  permission?: string;
  icon?: string; // lucide icon name, e.g. "Save"

  // Submit-button support (for forms)
  type?: "button" | "submit";
  form?: string; // ties button to a <form id="...">
  isLoading?: boolean;
  loadingTxt?: string;

  // Cancel button support
  showCancel?: boolean;
  onCancel?: () => void;
  cancelTxt?: string;
};

/**
 * SectionHeader component
 *
 * @param {SectionHeaderProps} props - Component props
 * @param {string} props.title - Main title of the section
 * @param {string} [props.subTitle] - Optional subtitle/description
 * @param {React.ReactNode} [props.breadcrumb] - Optional breadcrumb shown above the title
 * @param {() => void} [props.onClick] - Primary button click handler (ignored if type="submit")
 * @param {string} [props.btnTxt] - Primary button label
 * @param {string} [props.permission] - Permission key gating the primary button
 * @param {string} [props.icon] - Lucide icon name shown in the primary button
 * @param {"button"|"submit"} [props.type] - Primary button type, defaults to "button"
 * @param {string} [props.form] - Form id to associate with when type="submit"
 * @param {boolean} [props.isLoading] - Shows a spinner + loadingTxt on the primary button
 * @param {string} [props.loadingTxt] - Label shown while isLoading is true
 * @param {boolean} [props.showCancel] - Whether to show a cancel button
 * @param {() => void} [props.onCancel] - Cancel button click handler
 * @param {string} [props.cancelTxt] - Cancel button label, defaults to "Cancel"
 *
 * @returns JSX.Element
 */
const SectionHeader = ({
  title,
  subTitle,
  breadcrumb,
  onClick,
  btnTxt,
  permission,
  icon,
  type = "button",
  form,
  isLoading,
  loadingTxt,
  showCancel,
  onCancel,
  cancelTxt = "Cancel",
}: SectionHeaderProps) => {
  const admin = useStaffContext();
  const showBtn =
    btnTxt && (type === "submit" || onClick) &&
    (!permission || (admin && canAccess(admin.role, permission)));

  return (
    <div className="flex items-center justify-between">
      <div>
        {breadcrumb && (
          <p className="text-xs text-gray-400 mb-0.5">{breadcrumb}</p>
        )}

        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0 md:mb-2">
          {title}
        </h1>

        {subTitle && (
          <p className="text-sm lg:text-lg text-gray-500">{subTitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            {cancelTxt}
          </button>
        )}

        {showBtn && (
          <button
            type={type}
            form={form}
            onClick={type === "button" ? onClick : undefined}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-color-500 hover:bg-[#c13500] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition shadow-md hover:shadow-lg active:scale-95"
          >
            {isLoading ? (
              <>
                <DynamicIcon name="LoaderCircle" size={15} className="animate-spin" />
                {loadingTxt || "Loading..."}
              </>
            ) : (
              <>
                {icon && <DynamicIcon name={icon} size={15} />}
                {btnTxt}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;