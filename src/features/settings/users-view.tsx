"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { SearchInput } from "@/components/search-input";
import { TableSkeleton } from "@/components/table-skeleton";
import { TablePagination } from "@/components/table-pagination";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useUsers, useCreateUser, useAssignRole } from "./hooks";
import { ROLES } from "@/config/rbac";
import type { UserCreatePayload } from "@/lib/validations/settings";

export function UsersView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading } = useUsers({
    search: debouncedSearch,
    page,
    pageSize: 10,
  });

  const createUser = useCreateUser();
  const assignRole = useAssignRole();

  const [createOpen, setCreateOpen] = useState(false);

  const users = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  };

  function handleCreate(input: UserCreatePayload) {
    createUser.mutate(input, {
      onSuccess: () => setCreateOpen(false),
    });
  }

  function handleAssignRole(userId: string, roleId: string) {
    assignRole.mutate(
      { userId, input: { roleId } },
      {
        onSuccess: () => {
          toast.success("Role updated");
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-on-surface font-medium">Users</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus />
              Create user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>
                Create a new user account and optionally assign a role.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                handleCreate({
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  password: formData.get("password") as string,
                  roleId: (formData.get("roleId") as string) || undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="cu-name">Name</Label>
                <Input id="cu-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-email">Email</Label>
                <Input id="cu-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-password">Password</Label>
                <Input
                  id="cu-password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-role">Role</Label>
                <Select name="roleId">
                  <SelectTrigger id="cu-role">
                    <SelectValue placeholder="No role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No role</SelectItem>
                    {Object.values(ROLES).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search users…"
      />

      {isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : users.length === 0 ? (
        <div className="border-outline-variant text-on-surface-variant rounded-2xl border py-10 text-center text-sm">
          No users found.
        </div>
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Email</DataTableHead>
              <DataTableHead>Role</DataTableHead>
              <DataTableHead>Created</DataTableHead>
              <DataTableHead className="text-right">Assign role</DataTableHead>
            </tr>
          </DataTableHeader>
          <tbody>
            {users.map((user) => (
              <DataTableRow key={user.id}>
                <DataTableCell
                  variant="title"
                  className="text-on-surface font-medium"
                >
                  {user.name}
                </DataTableCell>
                <DataTableCell
                  label="Email"
                  className="text-on-surface-variant break-all"
                >
                  {user.email}
                </DataTableCell>
                <DataTableCell label="Role" className="text-on-surface-variant">
                  {user.roleName ?? "—"}
                </DataTableCell>
                <DataTableCell
                  label="Created"
                  className="text-on-surface-variant whitespace-nowrap"
                >
                  {new Date(user.createdAt).toLocaleDateString()}
                </DataTableCell>
                <DataTableCell label="Assign role" className="md:text-right">
                  <Select
                    onValueChange={(roleId) =>
                      handleAssignRole(user.id, roleId)
                    }
                    value={user.roleId ?? ""}
                  >
                    <SelectTrigger
                      className="h-9 w-32 max-md:h-10"
                      aria-label={`Assign role to ${user.name}`}
                    >
                      <SelectValue placeholder="Assign role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ROLES).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableCell>
              </DataTableRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
