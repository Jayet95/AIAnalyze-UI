import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/features/aianalyze/dashboard";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AIAnalyze — Your PC’s Health" },
      {
        name: "description",
        content:
          "A clear, local check-up for your Windows PC. Review health checks, live temperatures, game sessions and system details.",
      },
      { property: "og:title", content: "AIAnalyze — Your PC’s Health" },
      {
        property: "og:description",
        content:
          "Your local PC health assistant: understand problems, review game performance and know what to do next.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <Dashboard />;
}
