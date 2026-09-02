import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";

type StockStatusBadgeProps = {
  quantity: number;
  lowStockAt: number;
  unit?: string | null;
};

export function StockStatusBadge({
  quantity,
  lowStockAt,
  unit,
}: StockStatusBadgeProps) {
  if (quantity <= 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }

  if (quantity <= lowStockAt) {
    return (
      <Badge variant="outline" className="text-tertiary">
        Low · {formatNumber(quantity)}
      </Badge>
    );
  }

  return (
    <span className="font-geist text-mono-sm text-foreground">
      {formatNumber(quantity)}
      {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
    </span>
  );
}
