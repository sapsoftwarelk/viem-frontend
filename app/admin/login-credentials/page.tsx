"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { ShieldCheck, Search, Users, Key, CheckCircle, Pencil, X } from "lucide-react";

type Role = {
  id: string;
  position_title: string;
  level?: string;
  status?: string;
};

type Employee = {
  id: string;
  fullName: string;
  employeeId: string;
  contact: string;
  roleId?: string;
  status?: string;
  joinDate?: string;
};

type UserRecord = {
  id: string;
  username: string;
  employeeId: string;
  roleId: string;
  isActive: boolean;
};

type CredentialFormData = {
  username: string;
  password: string;
  roleId: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function CredentialsModal({
  open,
  employee,
  roles,
  existingUser,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: Employee | null;
  roles: Role[];
  existingUser?: UserRecord;
  onClose: () => void;
  onSave: (data: CredentialFormData) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsername(existingUser?.username ?? "");
    setPassword("");
    setRoleId(existingUser?.roleId ?? employee?.roleId ?? roles[0]?.id ?? "");
    setError(null);
  }, [open, existingUser, employee, roles]);

  if (!open || !employee) return null;

  const save = async () => {
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({ username: username.trim(), password, roleId });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Unable to save credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-900">{existingUser ? "Update Login Credentials" : "Create Login Credentials"}</p>
            <p className="text-[12px] text-slate-500">{employee.fullName} · {employee.employeeId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.position_title}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-rose-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              {loading ? "Saving..." : existingUser ? "Update Credentials" : "Create Credentials"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginCredentialsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [employeesRes, rolesRes, usersRes] = await Promise.all([
          apiFetch("/employees"),
          apiFetch("/roles"),
          apiFetch("/users"),
        ]);

        setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
        setRoles(Array.isArray(rolesRes) ? rolesRes : []);
        setUsers(Array.isArray(usersRes) ? usersRes : []);
      } catch (err: any) {
        setError(err?.message || "Unable to load credentials data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const userByEmployee = useMemo(() => {
    return users.reduce<Record<string, UserRecord>>((map, user) => {
      map[user.employeeId] = user;
      return map;
    }, {});
  }, [users]);

  const filteredEmployees = employees.filter((employee) => {
    const term = search.toLowerCase();
    const matchesSearch =
      employee.fullName.toLowerCase().includes(term) ||
      employee.employeeId.toLowerCase().includes(term) ||
      employee.contact.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "all" || (employee.status || "active").toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (employee: Employee) => {
    setSelected(employee);
    setIsOpen(true);
  };

  const saveCredentials = async (data: CredentialFormData) => {
    if (!selected) return;

    const existing = userByEmployee[selected.id];
    if (existing) {
      await apiFetch(`/users/${existing.id}`, {
        method: "PUT",
        body: JSON.stringify({ username: data.username, password: data.password, roleId: data.roleId }),
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === existing.id ? { ...user, username: data.username, roleId: data.roleId } : user,
        ),
      );
    } else {
      const created: any = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ username: data.username, password: data.password, employeeId: selected.id, roleId: data.roleId }),
      });
      setUsers((prev) => [...prev, created]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Administration</p>
            <h1 className="text-[26px] font-extrabold text-slate-900 tracking-tight">Login Credentials</h1>
            <p className="text-sm text-slate-500 mt-1">Assign usernames and passwords to selected employees and roles.</p>
          </div>
          <button
            onClick={() => {
              if (employees.length) openModal(employees[0]);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Key size={16} /> Create credentials
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name, EMP ID or contact..."
                  className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500">Employee</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Contact</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Created</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Credentials</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-rose-600">{error}</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const role = roles.find((role) => role.id === employee.roleId);
                  const user = userByEmployee[employee.id];

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{employee.fullName}</div>
                        <div className="text-[12px] text-slate-500">{employee.employeeId}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{role?.position_title || "—"}</td>
                      <td className="px-4 py-4 text-slate-700">{employee.contact || "—"}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(employee.joinDate)}</td>
                      <td className="px-4 py-4">
                        {user ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                            <CheckCircle size={12} /> Has credentials
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
                            <ShieldCheck size={12} /> Not created
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openModal(employee)}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                          <Pencil size={14} /> {user ? "Edit" : "Create"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <CredentialsModal
          open={isOpen}
          employee={selected}
          roles={roles}
          existingUser={selected ? userByEmployee[selected.id] : undefined}
          onClose={() => setIsOpen(false)}
          onSave={saveCredentials}
        />
      </div>
    </div>
  );
}
