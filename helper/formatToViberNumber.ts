export const formatToViberNumber = (phone?: string) => {
  if (!phone) return "";

  // remove spaces, dashes, etc.
  let cleaned = phone.replace(/\D/g, "");

  // convert PH local format (0XXXXXXXXXX → 63XXXXXXXXXX)
  if (cleaned.startsWith("0")) {
    cleaned = "63" + cleaned.slice(1);
  }

  return encodeURIComponent("+" + cleaned);
};