import React from "react";

type VisibilityProps = {
    title: string,
    subTitle: string,
    children: React.ReactNode
}

const VisibilityToggles = ({ title, subTitle, children } : VisibilityProps) => {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{subTitle}</p>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default VisibilityToggles;
