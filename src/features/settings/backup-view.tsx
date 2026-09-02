"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useExportBackup, useImportBackup } from "./hooks";

export function BackupView() {
  const exportMutation = useExportBackup();
  const importMutation = useImportBackup();

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [typedConfirm, setTypedConfirm] = useState("");

  async function handleExport() {
    try {
      await exportMutation.mutateAsync();
      toast.success("Backup exported");
    } catch {
      // error handled by hook
    }
  }

  function handleImport() {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const snapshot = JSON.parse(event.target?.result as string);
        importMutation.mutate(snapshot, {
          onSuccess: () => {
            setImportOpen(false);
            setImportFile(null);
            setTypedConfirm("");
          },
        });
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(importFile);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className="h-10 w-full sm:h-9 sm:w-auto"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          <Download />
          {exportMutation.isPending ? "Exporting…" : "Export backup"}
        </Button>
      </div>

      <div className="border-outline-variant bg-surface-container-low rounded-xl border p-4">
        <h4 className="text-body-md text-on-surface font-medium">
          Restore from backup
        </h4>
        <p className="text-muted-foreground mt-1 text-sm">
          Importing a backup will replace all existing data. The database must
          be empty before restoring. This action is destructive and cannot be
          undone.
        </p>
        <Button
          variant="destructive"
          className="mt-3"
          onClick={() => setImportOpen(true)}
        >
          <Upload />
          Import backup
        </Button>
      </div>

      <ConfirmDialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) {
            setImportFile(null);
            setTypedConfirm("");
          }
        }}
        title="Restore from backup"
        description={
          "This will destructively replace all existing data with the backup contents. The database must be empty before restoring. Type RESTORE to confirm."
        }
        confirmLabel="Restore"
        destructive
        onConfirm={() => {
          if (typedConfirm === "RESTORE" && importFile) {
            handleImport();
          }
        }}
      />

      <Button
        variant="ghost"
        className="mt-2"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files?.[0]) {
              setImportFile(target.files[0]);
            }
          };
          input.click();
        }}
      >
        <Upload />
        Choose backup file
      </Button>
    </div>
  );
}
