import { Construction } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = toTitleCase(slug[slug.length - 1]);

  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title={`${title} is coming soon`}
        description="This module is planned and will be implemented in a future sprint."
      />
    </>
  );
}
