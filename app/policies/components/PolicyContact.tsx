import { useSettings } from "@/hooks/api/useSettings";
import React from "react";

const PolicyContact = () => {
  const { data: contact } = useSettings();

  return (
    <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 mb-6">
      <p className="text-gray-700">
        <strong>Email:</strong> {contact?.contact.email ?? "info@foodlab.com"}
      </p>
      <p className="text-gray-700 mt-1">
        <strong>Address:</strong>{" "}
        {contact?.address ??
          "Century Spire, Century City, Kalayaan Ave, Makati, Metro Manila, Philippines"}
      </p>
    </div>
  );
};

export default PolicyContact;
