"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  MANILA_CITY_CODE,
  NCR_REGION,
  fetchManilaSubMunicipalities,
  fetchNcrCities,
  fetchSubMunicipalityBarangays,
  findBarangayByName,
  findCityByName,
  findManilaSubMunicipalityByName,
  type PsgcAddressSelection,
  type PsgcOption,
} from "@/lib/psgcAddress";
import { SelectField } from "../ui/FormComponents/SelectField";
import { InputField } from "../ui/FormComponents/InputField";

type PsgcAddressFieldsProps = {
  value: PsgcAddressSelection;
  errors?: Partial<Record<"city" | "province" | "line2", string>>;
  onFieldChange: (field: keyof PsgcAddressSelection, value: string) => void;
  onFieldBlur?: (field: "city" | "province" | "line2", value: string) => void;
};

// Saved profile data and map reverse-geocoding may only have the city name.
// Prefer the stored PSGC code when present, then fall back to name matching.
const useSelectedCity = (
  cities: PsgcOption[] | undefined,
  value: PsgcAddressSelection,
) =>
  useMemo(() => {
    if (!cities?.length) return undefined;

    const cityByCode = cities.find((city) => city.code === value.cityCode);
    const cityByName = findCityByName(cities, value.city);

    // A new map pin updates the city name first. If the old PSGC code points to
    // a different city, trust the detected name and let the sync effect rewrite
    // the code afterward.
    if (cityByName && cityByCode?.code !== cityByName.code) {
      return cityByName;
    }

    return cityByCode ?? cityByName;
  }, [cities, value.city, value.cityCode]);

export function PsgcAddressFields({
  value,
  errors,
  onFieldChange,
  onFieldBlur,
}: PsgcAddressFieldsProps) {
  // NCR is the only supported service region, so the first selectable parent is
  // the NCR city/municipality list.
  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["psgc", "ncr-cities"],
    queryFn: fetchNcrCities,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedCity = useSelectedCity(cities, value);
  const isManila = selectedCity?.code === MANILA_CITY_CODE;

  // Manila has too many barangays for a flat selector. PSGC sub-municipalities
  // provide the extra parent level used for Tondo, Binondo, Ermita, etc.
  const { data: manilaAreas = [], isLoading: isLoadingManilaAreas } = useQuery({
    queryKey: ["psgc", "manila-sub-municipalities"],
    queryFn: fetchManilaSubMunicipalities,
    enabled: isManila,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedSubMunicipality = useMemo(() => {
    if (!isManila) return undefined;

    // Map data often gives area text instead of PSGC codes, so match against
    // the detected sub-municipality or barangay text before asking the user.
    return (
      manilaAreas.find((area) => area.code === value.subMunicipalityCode) ??
      findManilaSubMunicipalityByName(
        manilaAreas,
        value.subMunicipality || value.line2,
      )
    );
  }, [
    isManila,
    manilaAreas,
    value.line2,
    value.subMunicipality,
    value.subMunicipalityCode,
  ]);

  // Non-Manila cities load barangays directly from the city. Manila waits for
  // the area selection first so the barangay dropdown stays manageable.
  const { data: barangays = [], isLoading: isLoadingBarangays } = useQuery({
    queryKey: [
      "psgc",
      "barangays",
      selectedCity?.code,
      selectedSubMunicipality?.code ?? "",
    ],
    queryFn: () =>
      fetchSubMunicipalityBarangays(
        selectedCity?.code ?? "",
        selectedSubMunicipality?.code,
      ),
    enabled:
      Boolean(selectedCity?.code) &&
      (!isManila || Boolean(selectedSubMunicipality?.code)),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const selectedBarangay = useMemo(
    () =>
      // Keep manually saved PSGC codes stable, but still support older/free-text
      // addresses and map-prefilled barangay names.
      barangays.find((barangay) => barangay.code === value.barangayCode) ??
      findBarangayByName(barangays, value.line2),
    [barangays, value.barangayCode, value.line2],
  );

  useEffect(() => {
    // Lock region/province to NCR even when the existing address was saved
    // before PSGC fields existed.
    if (!value.province) {
      onFieldChange("province", NCR_REGION.displayName);
    }
    if (!value.region) {
      onFieldChange("region", NCR_REGION.name);
    }
    if (!value.regionCode) {
      onFieldChange("regionCode", NCR_REGION.code);
    }
  }, [onFieldChange, value.province, value.region, value.regionCode]);

  useEffect(() => {
    if (!selectedCity) return;

    const cityChangedFromDetectedLocation =
      Boolean(value.cityCode) && value.cityCode !== selectedCity.code;

    // Once a saved or detected city matches PSGC, normalize both the display
    // name and code so future loads no longer depend on text matching.
    if (value.city !== selectedCity.name) {
      onFieldChange("city", selectedCity.name);
    }
    if (value.cityCode !== selectedCity.code) {
      onFieldChange("cityCode", selectedCity.code);
    }
    if (value.province !== NCR_REGION.displayName) {
      onFieldChange("province", NCR_REGION.displayName);
    }

    // When a map pin moves to another city, old child codes are no longer valid.
    // Keep line2 text from the pin so barangay matching can still try to align.
    if (cityChangedFromDetectedLocation) {
      onFieldChange("subMunicipalityCode", "");
      onFieldChange("barangayCode", "");

      if (selectedCity.code !== MANILA_CITY_CODE) {
        onFieldChange("subMunicipality", "");
      }
    }
  }, [onFieldChange, selectedCity, value.city, value.cityCode, value.province]);

  useEffect(() => {
    if (!selectedSubMunicipality) return;

    // Store Manila area metadata separately from barangay. This preserves the
    // city -> area -> barangay hierarchy without changing line2's meaning.
    if (value.subMunicipality !== selectedSubMunicipality.name) {
      onFieldChange("subMunicipality", selectedSubMunicipality.name);
    }
    if (value.subMunicipalityCode !== selectedSubMunicipality.code) {
      onFieldChange("subMunicipalityCode", selectedSubMunicipality.code);
    }
  }, [
    onFieldChange,
    selectedSubMunicipality,
    value.subMunicipality,
    value.subMunicipalityCode,
  ]);

  useEffect(() => {
    if (!selectedBarangay) return;

    // Barangay remains the line2 display value used by checkout/payment, while
    // barangayCode keeps the PSGC identity for reliable future matching.
    if (value.line2 !== selectedBarangay.name) {
      onFieldChange("line2", selectedBarangay.name);
    }
    if (value.barangayCode !== selectedBarangay.code) {
      onFieldChange("barangayCode", selectedBarangay.code);
    }
  }, [onFieldChange, selectedBarangay, value.barangayCode, value.line2]);

  const handleCityChange = (cityCode: string) => {
    const city = cities.find((option) => option.code === cityCode);

    // Changing city invalidates every child selection. Reset Manila area and
    // barangay so stale combinations cannot be saved.
    onFieldChange("cityCode", city?.code ?? "");
    onFieldChange("city", city?.name ?? "");
    onFieldChange("province", NCR_REGION.displayName);
    onFieldChange("region", NCR_REGION.name);
    onFieldChange("regionCode", NCR_REGION.code);
    onFieldChange("subMunicipality", "");
    onFieldChange("subMunicipalityCode", "");
    onFieldChange("line2", "");
    onFieldChange("barangayCode", "");
  };

  const handleSubMunicipalityChange = (subMunicipalityCode: string) => {
    const subMunicipality = manilaAreas.find(
      (option) => option.code === subMunicipalityCode,
    );

    // Changing Manila area invalidates the barangay list, but keeps the selected
    // city and locked NCR region intact.
    onFieldChange("subMunicipalityCode", subMunicipality?.code ?? "");
    onFieldChange("subMunicipality", subMunicipality?.name ?? "");
    onFieldChange("line2", "");
    onFieldChange("barangayCode", "");
  };

  const handleBarangayChange = (barangayCode: string) => {
    const barangay = barangays.find((option) => option.code === barangayCode);

    // Blur validation expects the display value, not the PSGC code.
    onFieldChange("barangayCode", barangay?.code ?? "");
    onFieldChange("line2", barangay?.name ?? "");
    onFieldBlur?.("line2", barangay?.name ?? "");
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <SelectField
          label="Region"
          options={[{ value: NCR_REGION.code, label: NCR_REGION.displayName }]}
          disabled
          leftIcon={<DynamicIcon name="Map" size={15} />}
          className="text-sm"
          required
        />

        <p className="text-xs text-gray-500">
          Delivery is currently limited to NCR addresses.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <SelectField
          label="City / Municipality"
          value={selectedCity?.code ?? ""}
          onChange={(event) => {
            handleCityChange(event.target.value);
            const city = cities.find(
              (option) => option.code === event.target.value,
            );
            onFieldBlur?.("city", city?.name ?? "");
          }}
          options={[
            { value: "", label: "Select City", disabled: true },
            ...cities.map((city) => ({
              value: city.code,
              label: city.name,
            })),
          ]}
          disabled={isLoadingCities}
          leftIcon={<DynamicIcon name="Building2" size={15} />}
          errors={errors?.city}
          className="text-sm"
          required
        />

        {value.city !== selectedCity?.name && (
          <p className="text-xs text-amber-600">
            Detected "{value.city}". Choose the closest city if this is not
            exact.
          </p>
        )}
      </div>

      {isManila && (
        <SelectField
          label="Manila Area"
          value={selectedSubMunicipality?.code ?? ""}
          onChange={(event) => handleSubMunicipalityChange(event.target.value)}
          disabled={isLoadingManilaAreas}
          options={[
            {
              value: "",
              label: `${isLoadingManilaAreas ? "Loading Manila areas..." : "Select Area"}`,
              disabled: true,
            },
            ...manilaAreas.map((area) => ({
              value: area.code,
              label: area.name,
            })),
          ]}
          className="text-sm"
          required
        />
      )}

      <div className="flex flex-col gap-2">
        <SelectField
          label="Barangay"
          value={selectedBarangay?.code ?? ""}
          onChange={(event) => handleBarangayChange(event.target.value)}
          onBlur={() => onFieldBlur?.("line2", value.line2)}
          disabled={
            isLoadingBarangays ||
            !selectedCity ||
            (isManila && !selectedSubMunicipality)
          }
          options={[
            {
              value: "",
              label: `${
                isLoadingBarangays
                  ? "Loading barangays..."
                  : isManila && !selectedSubMunicipality
                    ? "Select Manila area first"
                    : "Select barangay"
              }`,
              disabled: true,
            },
            ...barangays.map((brgy) => ({
              value: brgy.code,
              label: brgy.name,
            })),
          ]}
          errors={errors?.line2}
          className="text-sm"
          required
        />

        {value.line2 && !selectedBarangay && (
          <p className="text-xs text-amber-600">
            Detected "{value.line2}". Choose the closest barangay if this is not
            exact.
          </p>
        )}
      </div>

      <InputField
        label="Province"
        value={NCR_REGION.displayName}
        required
        disabled
        leftIcon={<DynamicIcon name="MapPinned" size={15} />}
        error={errors?.province}
        className="text-sm"
      />
    </>
  );
}
