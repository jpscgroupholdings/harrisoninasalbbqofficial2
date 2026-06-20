"use client";

import { useMyAddress } from "@/app/customer/hooks/useMyAddress";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBranch } from "./BranchContext";
import { useModalQuery } from "@/hooks/utils/useModalQuery";
import { OrderFormState } from "@/app/customer/checkout/FormSchema";
import useFormErrors from "@/app/customer/checkout/useFormErrors";
import { NCR_REGION } from "@/lib/psgcAddress";

// ---- Types ----
type CheckoutContextType = {
  session: ReturnType<typeof authClient.useSession>["data"];
  isPending: boolean;
  selectedBranch: ReturnType<typeof useBranch>["selectedBranch"];
  openModal: ReturnType<typeof useModalQuery>["openModal"];
  orderDetails: OrderFormState;
  shouldShowSyncProfileDetails: boolean;
  customerErrors: ReturnType<typeof useFormErrors>["customerErrors"];
  shippingErrors: ReturnType<typeof useFormErrors>["shippingErrors"];
  syncCheckoutDetailsFromProfile: () => void;
  handleStateChange: (
    type: keyof OrderFormState,
    field: string,
    value: string,
  ) => void;
  handleShippingCoordinatesChange: (
    coordinates: OrderFormState["shippingAddress"]["coordinates"],
  ) => void;
  handleNext: () => void;
  validateField: (
    step: "customer" | "shippingAddress",
    field: string,
    value: unknown,
  ) => void;
};

export const CheckoutStep = {
  DETAILS: "/checkout/details",
  SHIPPING: "/checkout/shipping",
} as const;

const CHECKOUT_DRAFT_KEY = "checkout_order_draft";

// Single source for a blank checkout draft so comparisons and resets stay aligned.
const getDefaultOrderDetails = (): OrderFormState => ({
  customer: {
    firstName: "",
    lastName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  },
  shippingAddress: {
    line1: "",
    line2: "",
    city: "",
    cityCode: "",
    province: NCR_REGION.displayName,
    region: NCR_REGION.name,
    regionCode: NCR_REGION.code,
    barangayCode: "",
    subMunicipality: "",
    subMunicipalityCode: "",
    zipCode: "",
    country: "Philippines",
    landmark: "",
    placeName: "",
    coordinates: undefined,
  },
});

// Treat the untouched default as "no draft" so it cannot block profile prefill.
const isUntouchedOrderDetails = (orderDetails: OrderFormState) => {
  const defaultOrderDetails = getDefaultOrderDetails();

  return (
    JSON.stringify(orderDetails.customer) ===
      JSON.stringify(defaultOrderDetails.customer) &&
    JSON.stringify(orderDetails.shippingAddress) ===
      JSON.stringify(defaultOrderDetails.shippingAddress)
  );
};

// Profile sync owns customer identity and shipping data, but not checkout notes.
const isSameProfileSyncedDetails = (
  current: OrderFormState,
  profileSynced: OrderFormState,
) => {
  const currentProfileFields = {
    customer: {
      firstName: current.customer.firstName,
      lastName: current.customer.lastName,
      customerEmail: current.customer.customerEmail,
      customerPhone: current.customer.customerPhone,
    },
    shippingAddress: current.shippingAddress,
  };
  const syncedProfileFields = {
    customer: {
      firstName: profileSynced.customer.firstName,
      lastName: profileSynced.customer.lastName,
      customerEmail: profileSynced.customer.customerEmail,
      customerPhone: profileSynced.customer.customerPhone,
    },
    shippingAddress: profileSynced.shippingAddress,
  };

  return (
    JSON.stringify(currentProfileFields) === JSON.stringify(syncedProfileFields)
  );
};

// Reads only on the browser; server render cannot access sessionStorage safely.
const readCheckoutDraft = (): OrderFormState | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as OrderFormState;
    return isUntouchedOrderDetails(draft) ? null : draft;
  } catch {
    return null;
  }
};

// ---- Context ----
const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined,
);

// ---- Hook ----
export const useCheckout = () => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
};

// ---- Provider ----
export const CheckoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session, isPending } = authClient.useSession();
  const { data: myAddress, isPending: isAddressPending } = useMyAddress();
  const { shippingAddress } = myAddress ?? {};

  const router = useRouter();
  const { selectedBranch } = useBranch();
  const { openModal } = useModalQuery();

  const [orderDetails, setOrderDetails] = useState<OrderFormState>(
    getDefaultOrderDetails,
  );
  const hasUserEditedDraft = useRef(false);

  // prevent hydration issue
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const { customerErrors, shippingErrors, validateField } =
    useFormErrors(orderDetails);

  // Any direct input edit means the checkout draft should win over profile data.
  const handleStateChange = (
    type: keyof OrderFormState,
    field: string,
    value: string,
  ) => {
    hasUserEditedDraft.current = true;

    setOrderDetails((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  // Map pin changes are also user edits and should be persisted as draft data.
  const handleShippingCoordinatesChange = (
    coordinates: OrderFormState["shippingAddress"]["coordinates"],
  ) => {
    hasUserEditedDraft.current = true;

    setOrderDetails((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        coordinates,
      },
    }));
  };

  const handleNext = () => {
    router.push(CheckoutStep.SHIPPING);
  };

  // Shared profile mapper. Automatic prefill preserves typed customer fields;
  // manual sync intentionally overwrites them from the latest profile data.
  const applyProfileDetailsToDraft = useCallback(
    (prev: OrderFormState, overwrite: boolean): OrderFormState => {
      if (!session?.user) return prev;

      return {
        ...prev,
        customer: {
          ...prev.customer,
          firstName:
            overwrite || !prev.customer.firstName
              ? session.user.firstName || ""
              : prev.customer.firstName,
          lastName:
            overwrite || !prev.customer.lastName
              ? session.user.lastName || ""
              : prev.customer.lastName,
          customerEmail:
            overwrite || !prev.customer.customerEmail
              ? session.user.email || ""
              : prev.customer.customerEmail,
          customerPhone:
            overwrite || !prev.customer.customerPhone
              ? session.user.phone || ""
              : prev.customer.customerPhone,
        },
        shippingAddress: {
          line1: shippingAddress?.line1 || "",
          line2: shippingAddress?.line2 || "",
          city: shippingAddress?.city || "",
          cityCode: shippingAddress?.cityCode || "",
          province: shippingAddress?.province || NCR_REGION.displayName,
          region: shippingAddress?.region || NCR_REGION.name,
          regionCode: shippingAddress?.regionCode || NCR_REGION.code,
          barangayCode: shippingAddress?.barangayCode || "",
          subMunicipality: shippingAddress?.subMunicipality || "",
          subMunicipalityCode: shippingAddress?.subMunicipalityCode || "",
          zipCode: shippingAddress?.zipCode || "",
          country: "Philippines",
          landmark: shippingAddress?.landmark || "",
          placeName: "",
          coordinates: shippingAddress?.coordinates,
        },
      };
    },
    [session, shippingAddress],
  );

  // Manual override for users who want to replace checkout fields with profile data.
  const syncCheckoutDetailsFromProfile = useCallback(() => {
    if (!session?.user) return;

    hasUserEditedDraft.current = true;

    setOrderDetails((prev) => applyProfileDetailsToDraft(prev, true));
  }, [applyProfileDetailsToDraft, session]);

  const shouldShowSyncProfileDetails = useMemo(() => {
    if (!session?.user || isPending || isAddressPending) return false;
    if (!hasUserEditedDraft.current) return false;

    const profileSyncedDraft = applyProfileDetailsToDraft(orderDetails, true);
    // Show the sync button only when checkout data differs from profile data.
    return !isSameProfileSyncedDetails(orderDetails, profileSyncedDraft);
  }, [
    applyProfileDetailsToDraft,
    isPending,
    isAddressPending,
    orderDetails,
    session,
  ]);

  // Load storage after mount so SSR and the first client render both avoid sessionStorage.
  useEffect(() => {
    const draft = readCheckoutDraft();

    if (draft) {
      setOrderDetails(draft);
      hasUserEditedDraft.current = true;
    }

    setHasLoadedDraft(true);
  }, []);

  // Persist only after storage has loaded; never save the untouched default draft.
  useEffect(() => {
    if (!hasLoadedDraft) return;

    if (!hasUserEditedDraft.current && isUntouchedOrderDetails(orderDetails)) {
      return;
    }

    window.sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify(orderDetails),
    );
  }, [hasLoadedDraft, orderDetails]);

  // First profile prefill: runs only while the customer has not edited the draft.
  useEffect(() => {
    if (!hasLoadedDraft || isPending || isAddressPending) return;
    if (!session?.user || hasUserEditedDraft.current) return;

    setOrderDetails((prev) => applyProfileDetailsToDraft(prev, false));
  }, [
    applyProfileDetailsToDraft,
    hasLoadedDraft,
    isPending,
    isAddressPending,
    session,
  ]);

  if (!hasLoadedDraft) {
    return null;
  }

  return (
    <CheckoutContext.Provider
      value={{
        session,
        isPending,
        selectedBranch,
        openModal,
        orderDetails,
        shouldShowSyncProfileDetails,
        customerErrors,
        shippingErrors,
        syncCheckoutDetailsFromProfile,
        handleStateChange,
        handleShippingCoordinatesChange,
        handleNext,
        validateField,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckoutContext = useCheckout;
