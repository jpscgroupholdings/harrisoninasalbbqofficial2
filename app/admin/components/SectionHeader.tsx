import React from "react";

const SectionHeader = ({
  title,
  subTitle,
  onClick,
  btnTxt
}: {
  title: string;
  subTitle: string;
  onClick?: () => void;
  btnTxt?: string
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-500">{subTitle}</p>
      </div>
      <button
        onClick={onClick}
        className="px-6 py-3 bg-brand-color-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
      >
       {btnTxt}
      </button>
    </div>
  );
};

export default SectionHeader;
