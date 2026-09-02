"use client";

import { History, Warehouse } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MovementsView } from "@/features/inventory/movements-view";
import { StockView } from "@/features/inventory/stock-view";

export function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Track current stock levels, low-stock items, and stock movement history."
      />
      <Tabs defaultValue="stock">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="stock">
            <Warehouse />
            Stock levels
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History />
            Movement history
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <StockView />
        </TabsContent>
        <TabsContent value="movements">
          <MovementsView />
        </TabsContent>
      </Tabs>
    </>
  );
}
