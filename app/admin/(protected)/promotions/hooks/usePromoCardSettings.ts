import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  buildPromoCardSettingsPayload,
  getDefaultPromoCardSettingsForm,
  getPromoCardSettingsForm,
  hasPromoCardSettingsChanges,
  togglePromoCardRuleDay,
} from "../helpers/promoCardSettingsForm";
import { PROMO_CARDS_QUERY_KEY } from "./usePromoCards";
import type {
  PromoCardSettings,
  PromoCardSettingsForm,
  PromoCardSettingsPayload,
} from "../types/promo-card.type";
import { PromotionDiscountDay } from "@/types/promotions/promotion-constant";

export function usePromoCardSettings(config?: PromoCardSettings) {
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState<PromoCardSettingsForm>(
    () => getDefaultPromoCardSettingsForm(),
  );

  useEffect(() => {
    if (!config) return;
    setSettingsForm(getPromoCardSettingsForm(config));
  }, [config]);

  const saveSettings = useMutation({
    mutationFn: (payload: PromoCardSettingsPayload) =>
      apiClient.patch<{ config: PromoCardSettings }>(
        "/admin/promo-cards",
        payload,
      ),
    onSuccess: async () => {
      toast.success("Promo card settings updated.");
      await queryClient.invalidateQueries({
        queryKey: PROMO_CARDS_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: ["customer", "promo-card", "status"],
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to update promo card settings.");
    },
  });

  const hasSettingsChanges = config
    ? hasPromoCardSettingsChanges(settingsForm, config)
    : false;

  const toggleRuleDay = (ruleIndex: number, day: PromotionDiscountDay) => {
    setSettingsForm((current) =>
      togglePromoCardRuleDay(current, ruleIndex, day),
    );
  };

  const submitSettings = () => {
    saveSettings.mutate(buildPromoCardSettingsPayload(settingsForm));
  };

  return {
    settingsForm,
    setSettingsForm,
    saveSettings,
    hasSettingsChanges,
    toggleRuleDay,
    submitSettings,
  };
}
