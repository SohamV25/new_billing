"use client";

import { useState } from "react";
import { Shield, Plus, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  useRoles,
  useCreateRole,
  useDeleteRole,
  useSetRolePermissions,
} from "./hooks";
import { PERMISSIONS } from "@/config/rbac";
import type {
  RoleCreatePayload,
  RolePermissionsPayload,
} from "@/lib/validations/settings";

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

function RoleCard({
  role,
  onDelete,
  onSetPermissions,
}: {
  role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: string[];
    userCount: number;
  };
  onDelete: (id: string) => void;
  onSetPermissions: (id: string) => void;
}) {
  return (
    <div className="border-outline-variant bg-surface-container-low rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-body-md text-on-surface font-medium">
              {role.name}
            </h3>
            {role.isSystem ? (
              <Badge variant="outline" className="text-muted-foreground">
                System
              </Badge>
            ) : null}
          </div>
          {role.description ? (
            <p className="text-muted-foreground text-sm">{role.description}</p>
          ) : null}
          <p className="text-mono-sm text-muted-foreground">
            {role.userCount} user{role.userCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!role.isSystem ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="max-md:size-10"
                onClick={() => onSetPermissions(role.id)}
                aria-label={`Set permissions for ${role.name}`}
              >
                <Key />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="max-md:size-10"
                onClick={() => onDelete(role.id)}
                aria-label={`Delete ${role.name}`}
              >
                <Trash2 />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {role.permissions.map((perm) => (
          <Badge
            key={perm}
            variant="secondary"
            className="text-muted-foreground"
          >
            {perm}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function RolesView() {
  const { data: rolesData, isLoading } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const setPermissions = useSetRolePermissions();

  const [createOpen, setCreateOpen] = useState(false);
  const [permissionsRoleId, setPermissionsRoleId] = useState<string | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const roles = rolesData?.items ?? [];

  function handleCreate(input: RoleCreatePayload) {
    createRole.mutate(input, {
      onSuccess: () => setCreateOpen(false),
    });
  }

  function handleDelete(id: string) {
    deleteRole.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  }

  function handleSetPermissions(id: string) {
    setPermissionsRoleId(id);
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-on-surface font-medium">Roles</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus />
              Create role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create role</DialogTitle>
              <DialogDescription>
                Create a new custom role with specific permissions.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const permissionNames = formData.getAll(
                  "permission"
                ) as string[];
                handleCreate({
                  name: formData.get("name") as string,
                  description: (formData.get("description") as string) || null,
                  permissionNames,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="rc-name">Name</Label>
                <Input id="rc-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc-description">Description</Label>
                <Input id="rc-description" name="description" />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-1 text-sm"
                    >
                      <Checkbox name="permission" value={perm} />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createRole.isPending}>
                  {createRole.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onDelete={setDeleteConfirmId}
            onSetPermissions={handleSetPermissions}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
        title="Delete role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
      />

      {permissionsRoleId ? (
        <PermissionsDialog
          roleId={permissionsRoleId}
          onClose={() => setPermissionsRoleId(null)}
        />
      ) : null}
    </div>
  );
}

function PermissionsDialog({
  roleId,
  onClose,
}: {
  roleId: string;
  onClose: () => void;
}) {
  const { data: rolesData } = useRoles();
  const setPermissions = useSetRolePermissions();

  const role = rolesData?.items.find((r) => r.id === roleId);
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);

  function toggle(perm: string) {
    setSelected((current) =>
      current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm]
    );
  }

  function handleSave() {
    setPermissions.mutate(
      { id: roleId, input: { permissionNames: selected } },
      {
        onSuccess: () => onClose(),
      }
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set permissions</DialogTitle>
          <DialogDescription>
            Manage permissions for {role?.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-1 text-sm">
              <Checkbox
                checked={selected.includes(perm)}
                onCheckedChange={() => toggle(perm)}
              />
              {perm}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={setPermissions.isPending}>
            {setPermissions.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
