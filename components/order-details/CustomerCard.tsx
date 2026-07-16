import { DynamicIcon } from "../ui/DynamicIcon";

interface CustomerCardProps {
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

/** Customer info card */
export const CustomerCard = ({ customerDetails }: CustomerCardProps) => {
  const { firstName, lastName, email, phone } = customerDetails;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Customer's Name";
    
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
          <DynamicIcon name="UserIcon" size={14} className="text-gray-400" />
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Customer
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">{fullName}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <DynamicIcon
            name="MailIcon"
            size={12}
            className="text-gray-300 shrink-0"
          />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <DynamicIcon
            name="PhoneIcon"
            size={12}
            className="text-gray-300 shrink-0"
          />
          <span>{phone}</span>
        </div>
      </div>
    </div>
  );
};
