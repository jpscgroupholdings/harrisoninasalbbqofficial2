"use client";

import React, { useEffect, useState } from "react";
import SectionHeader from "../../components/SectionHeader";
import { POLICY_SLUGS, PolicyData } from "@/data/policyData";
import {
  useAdminPolicies,
  useSeedPolicies,
  useUpdatePolicy,
} from "@/hooks/api/admin/useAdminPolicies";
import { formatDateOnly } from "@/helper/formatDate";
import { InputField, TextareaField } from "@/components/ui/FormComponents";
import type { PolicySection } from "@/hooks/api/usePolicies";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import LoadingPage from "@/components/ui/LoadingPage";

/** Human-readable labels for each policy slug */
const SLUG_LABELS: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  "terms-of-use": "Terms of Use",
  "refund-policy": "Refund Policy",
  "delivery-policy": "Delivery Policy",
};

interface PolicyFormState {
  title: string;
  subtitle: string;
  sections: PolicySection[];
}

const PoliciesPage = () => {
  {
    /** hooks to get the policies from the api */
  }
  const { data: response, isLoading } = useAdminPolicies();
  const policies = response?.data ?? [];
  const seeded = response?.seeded ?? false;

  // state to check which legal policies is active
  const [activeSlug, setActiveSlug] = useState(POLICY_SLUGS[0]);

  // mutation
  const updatePolicy = useUpdatePolicy(activeSlug);
  const seedPolicies = useSeedPolicies();

  const [formStates, setFormStates] = useState<Record<string, PolicyFormState>>(
    () =>
      POLICY_SLUGS.reduce(
        (acc, slug) => ({
          ...acc,
          [slug]: { title: "", subtitle: "", sections: [] },
        }),
        {} as Record<string, PolicyFormState>,
      ),
  );

  // change data of form based on active slug
  const activeForm = formStates[activeSlug];
  const activePolicy = policies.find((p) => p.slug === activeSlug);

  const lastUpdated = activePolicy?.updatedAt
    ? formatDateOnly(activePolicy?.updatedAt)
    : null;

  /** Sync from state from fetched policies */
  useEffect(() => {
    if (policies.length > 0) {
      const newStates: Record<string, PolicyFormState> = {};
      for (const policy of policies) {
        newStates[policy.slug] = {
          title: policy.title,
          subtitle: policy.subtitle,
          sections: policy.sections.map((s) => ({
            heading: s.heading,
            content: s.content,
          })),
        };
      }

      // Fill missing slugs with empty defaults
      for (const slug of POLICY_SLUGS) {
        if (!newStates[slug]) {
          newStates[slug] = { title: "", subtitle: "", sections: [] };
        }
      }
      setFormStates(newStates);
    }
  }, [policies]);

  /** Check if form has changes compared to the saved policy */
  const hasChanges = (() => {
    if (!activePolicy) {
      return (
        activeForm.title !== "" ||
        activeForm.subtitle !== "" ||
        activeForm.sections.length > 0
      );
    }
    return (
      JSON.stringify({
        title: activeForm.title,
        subtitle: activeForm.subtitle,
        sections: activeForm.sections,
      }) !==
      JSON.stringify({
        title: activePolicy.title,
        subtitle: activePolicy.subtitle,
        sections: activePolicy.sections,
      })
    );
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeForm.title ||
      !activeForm.subtitle ||
      activeForm.sections.length === 0
    )
      return;
    updatePolicy.mutate({
      title: activeForm.title,
      subtitle: activeForm.subtitle,
      sections: activeForm.sections,
    });
  };

  // reset changes
  const handleReset = () => {
    if (activePolicy) {
      setFormStates((prev) => ({
        ...prev,
        [activeSlug]: {
          title: activePolicy.title,
          subtitle: activePolicy.subtitle,
          sections: activePolicy.sections.map((s) => ({
            heading: s.heading,
            content: s.content,
          })),
        },
      }));
    } else {
      setFormStates((prev) => ({
        ...prev,
        [activeSlug]: { title: "", subtitle: "", sections: [] },
      }));
    }
  };

  // sync the static data to db
  const handleSeed = () => {
    seedPolicies.mutate();
  };

  /** Update a top-level field in the active form */
  const setField = (field: "title" | "subtitle", value: string) => {
    setFormStates((prev) => ({
      ...prev,
      [activeSlug]: { ...prev[activeSlug], [field]: value },
    }));
  };

  /** Update a section field */
  const setSectionField = (
    sectionIndex: number,
    field: "heading" | "content",
    value: string,
  ) => {
    setFormStates((prev) => {
      const sections = [...prev[activeSlug].sections];
      sections[sectionIndex] = { ...sections[sectionIndex], [field]: value };
      return { ...prev, [activeSlug]: { ...prev[activeSlug], sections } };
    });
  };

  /** Add a new empty section */
  const addSection = () => {
    setFormStates((prev) => ({
      ...prev,
      [activeSlug]: {
        ...prev[activeSlug],
        sections: [...prev[activeSlug].sections, { heading: "", content: "" }],
      },
    }));
  };

  {
    /** Remove a section by index */
  }
  const removeSection = (sectionIndex: number) => {
    setFormStates((prev) => {
      const sections = prev[activeSlug].sections.filter(
        (_, i) => i !== sectionIndex,
      );

      return {
        ...prev,
        [activeSlug]: { ...prev[activeSlug], sections },
      };
    });
  };

  // Move a secetion up or down
  const moveSection = (sectionIndex: number, direction: "up" | "down") => {
    setFormStates((prev) => {
      const sections = [...prev[activeSlug].sections];
      const newIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;

      if (newIndex < 0 || newIndex >= sections.length) return prev;
      [sections[sectionIndex], sections[newIndex]] = [
        sections[newIndex],
        sections[sectionIndex],
      ];

      return {
        ...prev,
        [activeSlug]: { ...prev[activeSlug], sections },
      };
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <SectionHeader
          title="Legal Policies"
          subTitle="View and update your legal policy documents"
        />
        <LoadingPage />
      </section>
    );
  }

  return (
    <section className="max-w-full">
      <section className="space-y-6 max-w-7xl mx-auto">
        <SectionHeader
          title="Legal Policies"
          subTitle="View and update your legal policy documents"
          btnTxt={!seeded ? "Seed Policies to Database" : undefined}
          onClick={!seeded ? handleSeed : undefined}
          permission="legal.update"
        />

        {/** Policy selector tabs */}
        <div className="border border-gray-200 rounded-xl shadow">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {POLICY_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => setActiveSlug(slug)}
                className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeSlug === slug
                    ? "border-b-2 border-brand-color-500 text-brand-color-500 bg-brand-color-500/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {SLUG_LABELS[slug]}
              </button>
            ))}
          </div>

          {/* Metadata bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-sm text-gray-500">
            <span>
              Source:{" "}
              <strong className={seeded ? "text-green-600" : "text-amber-600"}>
                {seeded ? "Database (live)" : "Static Preview (not seeded yet)"}
              </strong>
            </span>
            {lastUpdated && (
              <span>
                Last updated:{" "}
                <strong className="text-gray-700">{lastUpdated}</strong>
              </span>
            )}
            {activePolicy?.lastUpdatedBy?.name && (
              <span>
                By:{" "}
                <strong className="text-gray-700">
                  {activePolicy.lastUpdatedBy.name}
                </strong>
              </span>
            )}
          </div>

          {!seeded && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-700">
              <strong>Note:</strong> Policies are currently showing from static
              fallback data. Click "Seed Policies to Database" above to create
              database records, then you can edit them dynamically.
            </div>
          )}

          {/** Edit form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6`">
            <InputField
              label="Policy Title"
              id="policy-title"
              type="text"
              value={activeForm.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
            <TextareaField
              label="Intro Paragraph (Subtitle)"
              id="policy-subtitle"
              value={activeForm.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              rows={3}
              required
            />

            {/** Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Total ections ({activeForm.sections.length})</h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-4 py-2 text-sm font-semibold text-brand-color-500 border border-brand-color-500 rounded-lg hover:bg-brand-color-500/10 transition-colors flex items-center gap-1"
                >
                  <DynamicIcon name="Plus" size={16} />
                  Add Section
                </button>
              </div>

              {activeForm.sections.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No sections yet. Click "Add Section" to start building the
                  policy content.
                </p>
              )}

              {activeForm.sections.map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Section {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {/** move up the section */}
                      <button
                        type="button"
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <DynamicIcon name="ChevronUp" size={16} />
                      </button>
                      {/**move down the section */}
                      <button
                        type="button"
                        onClick={() => moveSection(index, "down")}
                        disabled={index === activeForm.sections.length - 1}
                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <DynamicIcon name="ChevronDown" size={16} />
                      </button>
                      {/** remove the section */}
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                        title="Remove section"
                      >
                        <DynamicIcon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                  {/** Input fields for new sections */}
                  <InputField
                    label="Section Heading"
                    id={`section-heading-${index}`}
                    type="text"
                    value={section.heading}
                    onChange={(e) =>
                      setSectionField(index, "heading", e.target.value)
                    }
                    required
                  />

                  <TextareaField
                    label="Section Content (Markdown)"
                    subLabel="Use Markdown syntax: **bold**, *italic*, - for bullet lists,
                      ### for subheadings"
                    id={`section-content-${index}`}
                    value={section.content}
                    onChange={(e) =>
                      setSectionField(index, "content", e.target.value)
                    }
                    rows={8}
                    required
                  />
                </div>
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges}
                className={`px-8 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-100 transition-colors ${
                  !hasChanges && "opacity-40 pointer-events-none"
                }`}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={
                  updatePolicy.isPending ||
                  !hasChanges ||
                  activeForm.sections.length === 0
                }
                className={`flex-1 px-8 py-3 rounded-xl bg-brand-color-500 text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none ${
                  !hasChanges && "cursor-not-allowed"
                }`}
              >
                {updatePolicy.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </section>
  );
};

export default PoliciesPage;
