import type { ModalType } from "@/hooks/utils/useModalQuery";

export type AuthMode = Extract<ModalType, "login" | "signup">;

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};
