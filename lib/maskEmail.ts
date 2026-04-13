export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);
  const masked = "*".repeat(Math.max(name.length - 2, 0));
  return `${visible}${masked}@${domain}`;
}