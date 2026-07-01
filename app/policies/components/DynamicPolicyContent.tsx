import { formatDate, formatDateOnly } from "@/helper/formatDate";
import type { PolicyData } from "@/hooks/api/usePolicies";
import { marked } from "marked";

/** Configure marked for clean HTML output */
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Renders a policy document dynamically from structured data.
 * Each section's content is Markdown that gets converted to HTML
 * and rendered inside a Tailwind prose container.
 */

const DynamicPolicyContent = ({ policy }: { policy: PolicyData }) => {
  const lastUpdated = policy.updatedAt
    ? formatDateOnly(policy.updatedAt)
    : "June 30, 2026";

  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {policy.title}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        <em>Last updated: {lastUpdated}</em>
      </p>

      <p className="text-gray-700 leading-relaxed mb-6">{policy.subtitle}</p>

      {policy.sections.map((section, index) => (
        <div key={index}>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
            {section.heading}
          </h2>

          <div
            className="text-gray-700 leading-relaxed mb-6 prose-heading:text-lg prose-headings:font-semibold prose-heading:text-gray-800 prose-headings:mt-6 prose-headings:mb-3 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 porse-p:leading-relaxed prose-p:mb-4 prose-strong:font-bold"
            dangerouslySetInnerHTML={{
              __html: marked.parse(section.content) as string,
            }}
          />
        </div>
      ))}
    </article>
  );
};

export default DynamicPolicyContent;
