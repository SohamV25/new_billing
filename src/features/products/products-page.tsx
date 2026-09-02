import { PageHeader } from "@/components/page-header";
import { ProductsView } from "@/features/products/products-view";

export function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your product catalogue and stock levels."
      />
      <ProductsView />
    </>
  );
}
