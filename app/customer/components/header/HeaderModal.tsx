import AuthModal from "../AuthModal";
import LogoutModal from "@/components/ui/LogoutModal";
import Modal from "@/components/ui/Modal";
import MapPage from "@/app/customer/map/page";
import { MODAL_TYPES } from "@/hooks/utils/useModalQuery";
import { syne } from "@/app/font";

interface Props {
  modalType: string | null;
  isLoggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const HeaderModals = ({ modalType, isLoggingOut, onClose, onLogout }: Props) => (
  <>
    <AuthModal
      isOpen={modalType === MODAL_TYPES.LOGIN || modalType === MODAL_TYPES.SIGNUP}
      onClose={onClose}
      initialMode={modalType as any}
    />

    {modalType === MODAL_TYPES.LOGOUT && (
      <LogoutModal onConfirm={onLogout} onClose={onClose} isLoading={isLoggingOut} />
    )}

    {modalType === MODAL_TYPES.MAP && (
      <Modal
        onClose={onClose}
        title="Select Harrison's Branch"
        subTitle="Explore the map to find the nearest branch"
        className={syne.className}
      >
        <MapPage />
      </Modal>
    )}
  </>
);