const MAYA_PUBLIC_KEY = process.env.MAYA_PUBLIC_KEY;

if (!MAYA_PUBLIC_KEY) {
  throw new Error("MAYA_PUBLIC_KEY is not defined in environment variables!");
}

export function getAuthHeader() {
  const encoded = Buffer.from(`${MAYA_PUBLIC_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}