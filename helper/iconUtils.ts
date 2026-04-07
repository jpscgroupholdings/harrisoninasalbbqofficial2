import * as LucideIcons from "lucide-react";
import { type LucideIcon } from "lucide-react";

/**
 * Get a Lucide icon component by name
 * 
 * @param iconName - The name of the Lucide icon (e.g., "Phone", "Mail", "User")
 * @returns The Lucide icon component, or Ellipsis if not found
 * 
 * @example
 * ```tsx
 * const Icon = getLucideIcon("Phone");
 * return <Icon className="w-6 h-6" />;
 * ```
 * 
 * @example
 * ```tsx
 * // With data mapping
 * const steps = [
 *   { title: "Contact", icon: "Phone" },
 *   { title: "Apply", icon: "FileText" }
 * ];
 * 
 * steps.map(step => {
 *   const Icon = getLucideIcon(step.icon);
 *   return <Icon className="w-5 h-5" />;
 * });
 * ```
 */
export function getLucideIcon(iconName: string | undefined): LucideIcon {
  if (!iconName) {
    return LucideIcons.Ellipsis;
  }

  const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
  
  if (Icon) {
    return Icon as LucideIcon;
  }
  
  return LucideIcons.Ellipsis; // fallback icon
}

/**
 * Validates if an icon name exists in Lucide icons
 * 
 * @param iconName - The name of the icon to validate
 * @returns true if the icon exists, false otherwise
 * 
 * @example
 * ```tsx
 * if (isValidLucideIcon("Phone")) {
 *   // Icon exists
 * }
 * ```
 */
export function isValidLucideIcon(iconName: string): boolean {
  return iconName in LucideIcons && typeof LucideIcons[iconName as keyof typeof LucideIcons] === 'function';
}

/**
 * Get multiple icons by their names
 * 
 * @param iconNames - Array of icon names
 * @returns Array of Lucide icon components
 * 
 * @example
 * ```tsx
 * const [PhoneIcon, MailIcon] = getLucideIcons(["Phone", "Mail"]);
 * ```
 */
export function getLucideIcons(iconNames: string[]): LucideIcon[] {
  return iconNames.map(name => getLucideIcon(name));
}