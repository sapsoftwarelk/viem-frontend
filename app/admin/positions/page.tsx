"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";

const INITIAL_POSITIONS = [
  {
    id: 1,
    title: "Technical Officer (TO)",
    level: "Mid",
    status: "Active",
    description:
      "Oversees technical operations and system infrastructure.",
  },
  {
    id: 2,
    title: "Driver",
    level: "Entry",
    status: "Active",
    description:
      "Responsible for transportation and logistics support.",
  },
  {
    id: 3,
    title: "CEO",
    level: "Executive",
    status: "Active",
    description:
      "Chief Executive Officer, leads overall company strategy.",
  },
];

const LEVELS = [
  "Entry",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Executive",
];

const STATUSES = ["Active", "Inactive", "Draft"];

const LEVEL_STYLES: Record<string, string> = {
  Entry: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Mid: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  Senior: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  Lead: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Manager: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  Executive: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-50 text-green-700 ring-1 ring-green-200",
  Inactive: "bg-red-50 text-red-700 ring-1 ring-red-200",
  Draft: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
};

const STATUS_DOT: Record<string, string> = {
  Active: "bg-green-500",
  Inactive: "bg-red-400",
  Draft: "bg-yellow-400",
};

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

const selectCls =
  "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer";

function PositionForm({
  initial,
  onSubmit,
  onCancel,
  title,
}: {
  initial?: any;
  onSubmit: (form: any) => void;
  onCancel: () => void;
  title: string;
}) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      level: "Mid",
      status: "Active",
      description: "",
    }
  );

  const set = (k: string, v: string) =>
    setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">
          {title}
        </h2>

        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
            Position Title
          </label>

          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Technical Officer"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Level
            </label>

            <select
              className={selectCls}
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Status
            </label>

            <select
              className={selectCls}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
            Description
          </label>

          <textarea
            rows={3}
            className={inputCls}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (!form.title.trim()) return;
            onSubmit(form);
          }}
          className="flex-[2] px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
        >
          Save Position
        </button>
      </div>
    </div>
  );
}

export default function JobPositionCRUD() {
  const [positions, setPositions] = useState(INITIAL_POSITIONS);

  useEffect(() => {
    const load = async () => {
      try {
        const roles = await apiFetch('/roles');
        if (Array.isArray(roles)) {
          setPositions(roles.map((r: any) => ({ id: r.id, title: r.position_title || r.name || '', level: r.level || 'Mid', status: r.status || 'Active', description: r.description || '' })));
        }
      } catch (err) {
        console.warn('Load positions failed, using local data', err);
      }
    };
    load();
  }, []);

  const [modal, setModal] = useState<
    "create" | "edit" | "delete" | null
  >(null);

  const [selected, setSelected] = useState<any>(null);

  const [search, setSearch] = useState("");

  const [filterStatus, setFilterStatus] =
    useState("All");

  const [nextId, setNextId] = useState(4);

  const filtered = positions.filter(
    (p) =>
      (filterStatus === "All" ||
        p.status === filterStatus) &&
      p.title
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const handleCreate = async (form: any) => {
    try {
      const payload = { position_title: form.title, level: form.level, status: form.status, description: form.description };
      const created = await apiFetch('/roles', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null);
      if (created) setPositions((prev) => [{ id: created.id, title: created.position_title, level: created.level || 'Mid', status: created.status || 'Active', description: created.description || '' }, ...prev]);
    } catch (err) {
      console.error('Create position failed', err);
    }
    setModal(null);
  };

  const handleEdit = async (form: any) => {
    try {
      if (!selected) return;
      const payload = { position_title: form.title, level: form.level, status: form.status, description: form.description };
      const updated = await apiFetch(`/roles/${selected.id}`, { method: 'PUT', body: JSON.stringify(payload) }).catch(() => null);
      if (updated) setPositions((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...form } : p)));
    } catch (err) {
      console.error('Edit position failed', err);
    }
    setModal(null);
  };

  const handleDelete = async () => {
    try {
      if (!selected) return;
      await apiFetch(`/roles/${selected.id}`, { method: 'DELETE' }).catch(() => null);
      setPositions((prev) => prev.filter((p) => p.id !== selected.id));
    } catch (err) {
      console.error('Delete position failed', err);
    }
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search positions..."
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value)
              }
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="All">
                All Statuses
              </option>

              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl"
            >
              + New Position
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">
                    Title
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">
                    Level
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase">
                    Status
                  </th>

                  <th className="px-5 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No positions found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {p.title}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          label={p.level}
                          className={
                            LEVEL_STYLES[p.level]
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status]}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`}
                          />

                          {p.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setSelected(p);
                              setModal("edit");
                            }}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-white"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => {
                              setSelected(p);
                              setModal("delete");
                            }}
                            className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-white"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
      >
        <PositionForm
          title="Create Position"
          onSubmit={handleCreate}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
      >
        {selected && (
          <PositionForm
            title="Edit Position"
            initial={selected}
            onSubmit={handleEdit}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
      >
        {selected && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Delete Position
            </h2>

            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {selected.title}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}