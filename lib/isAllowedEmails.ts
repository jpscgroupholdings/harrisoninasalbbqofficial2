
/** Only gmail.com addresses are accepted for customer login. */
export const GMAIL_DOMAIN = "gmail.com";

export function isGmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return domain === GMAIL_DOMAIN;
}


/** Admin accounts must use one of these approved email domains. */
export const ADMIN_EMAIL_DOMAINS = ["jpfoodlab.com", "jptechnologyph.ph"];

export function isAllowedAdminDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return ADMIN_EMAIL_DOMAINS.includes(domain);
}