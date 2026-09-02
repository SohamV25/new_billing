import { requireUser } from "@/lib/auth/current-user";
import { ProductsPage } from "@/features/products/products-page";

export const dynamic = "force-dynamic";

export default async function ProductsRoute() {
  await requireUser();
  return <ProductsPage />;
}
