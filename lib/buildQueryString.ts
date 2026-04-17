export function buildQueryString(params?: Record<string, any>) : string {
    if(!params) return "";

    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== ""){
            query.set(key, String(val))
        }
    });

    const qs = query.toString();
    return qs ? `?${qs}` : "";
}