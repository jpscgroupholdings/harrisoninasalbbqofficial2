import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const MODAL_TYPES = {
    LOGIN : "login",
    SIGNUP : "signup",
    LOGOUT : "logout",
    MAP : "map"
} as const;  // register here the new modal type to open

export type ModalType = (typeof MODAL_TYPES)[keyof typeof MODAL_TYPES]

/**
 * Hook for managing modal state via URL query parameters.
 *
 * This allows modals to be:
 * - shareable via URL
 * - controlled by browser navigation (back/forward)
 * - persisted across refresh
 */

export function useModalQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawModal = searchParams.get("modal");
  const modal = Object.values(MODAL_TYPES).includes(rawModal as ModalType) ? (rawModal as ModalType) : null

  /**
   * Opens a modal by setting the "modal" query parameter.
   *
   * @param modalToOpen - The modal type to open (must be a valid ModalType)
   */
  const openModal = (modalToOpen: ModalType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", modalToOpen);

    router.replace(`${pathname}?${params.toString()}`);
  };


   /**
   * Closes the currently open modal by removing the "modal" query parameter.
   */
  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return { modal, openModal, closeModal };
}