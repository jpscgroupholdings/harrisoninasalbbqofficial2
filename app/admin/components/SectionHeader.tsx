import { useStaffContext } from "@/contexts/StaffContext";
import { canAccess } from "@/lib/roleBasedAccessCtrl";
import React from "react";

type SectionHeaderProps = {
  title: string;
  subTitle?: string;
  onClick?: () => void;
  btnTxt?: string;
  permission?: string;
};

/**
 * SectionHeader component
 *
 * @param {SectionHeaderProps} props - Component props
 * @param {string} props.title - Main title of the section
 * @param {string} [props.subTitle] - Optional subtitle/description
 * @param {() => void} [props.onClick] - Optional button click handler
 * @param {string} [props.btnTxt] - Optional button label
 *
 * @returns JSX.Element
 */
const SectionHeader = ({
  title,
  subTitle,
  onClick,
  btnTxt,
  permission
}: SectionHeaderProps) => {

  const admin = useStaffContext();
  const showBtn = btnTxt && onClick && (!permission || (admin && canAccess(admin.role, permission)));

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-0 md:mb-2">
          {title}
        </h1>

        {subTitle && (
          <p className="text-sm lg:text-lg text-gray-500">{subTitle}</p>
        )}
      </div>

      {showBtn && (
        <button
          onClick={onClick}
          className="px-6 py-3 bg-brand-color-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {btnTxt}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;