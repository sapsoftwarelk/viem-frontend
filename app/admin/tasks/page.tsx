
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";

/* ✅ Simple Construction Site Tasks */
const INITIAL_TASKS = [
  {
    id: 1,
    title: "Deliver Cement Bags to Site A",
    priority: "High",
    description:
      "Send 50 cement bags from the warehouse to Construction Site A before 10 AM.",
    status: "active",
  },
  {
    id: 2,
    title: "Receive Steel Rod Delivery",
    priority: "Medium",
    description:
      "Check and unload steel rods delivered by the supplier and update stock records.",
    status: "active",
  },
  {
    id: 3,
    title: "Transfer Power Tools to Main Site",
    priority: "High",
    description:
      "Move drilling machines and cutting tools to the main construction area.",
    status: "active",
  },
  {
    id: 4,
    title: "Check Damaged Materials",
    priority: "Low",
    description:
      "Inspect damaged bricks and broken tiles and separate unusable items.",
    status: "inactive",
  },
  {
    id: 5,
    title: "Deliver Safety Equipment",
    priority: "Critical",
    description:
      "Send helmets, gloves, and safety vests to workers at Site B immediately.",
    status: "active",
  },
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["active", "inactive"];

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-rose-100 text-rose-700",
};

function Badge({ text, className }: any) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      {text}
    </span>
  );
}

function Modal({ open, children, onClose }: any) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

function TaskForm({ initial, onSubmit, onCancel, title }: any) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      priority: "Medium",
      status: "active",
      description: "",
    }
  );

  const set = (k: string, v: string) =>
    setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-5 border-b">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>

        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Task Title
          </label>

          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Enter task title..."
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Priority
            </label>

            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "active" ? "Active" : "Inactive"}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            Description
          </label>

          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Enter task description..."
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t">
        <button
          onClick={onCancel}
          className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold"
        >
          Cancel
        </button>

        <button
          onClick={() => onSubmit(form)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-bold"
        >
          Save Task
        </button>
      </div>
    </div>
  );
}

export default function TaskCRUD() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [modal, setModal] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [nextId, setNextId] = useState(6);

  useEffect(() => {
    const load = async () => {
      try {
        const remote = await apiFetch('/tasks');
        if (Array.isArray(remote)) setTasks(remote.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority || 'Medium', description: t.description || '', status: t.status || 'active' })));
      } catch (err) {
        console.warn('Load tasks failed, using local seed', err);
      }
    };
    load();
  }, []);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const createTask = async (data: any) => {
    try {
      const created = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }).catch(() => null);
      if (created) setTasks((prev) => [{ id: created.id, title: created.title, priority: created.priority || 'Medium', description: created.description || '', status: created.status || 'active' }, ...prev]);
      else { setTasks((prev) => [...prev, { ...data, id: nextId }]); setNextId((n) => n + 1); }
    } catch (err) {
      console.error('Create task failed', err);
    }
    setModal(null);
  };

  const updateTask = async (data: any) => {
    try {
      if (!selected) return;
      const updated = await apiFetch(`/tasks/${selected.id}`, { method: 'PUT', body: JSON.stringify(data) }).catch(() => null);
      if (updated) setTasks((prev) => prev.map((t) => (t.id === selected.id ? { ...t, ...data } : t)));
      else setTasks((prev) => prev.map((t) => (t.id === selected.id ? { ...t, ...data } : t)));
    } catch (err) {
      console.error('Update task failed', err);
    }
    setModal(null);
  };

  const deleteTask = async () => {
    try {
      if (!selected) return;
      await apiFetch(`/tasks/${selected.id}`, { method: 'DELETE' }).catch(() => null);
      setTasks((prev) => prev.filter((t) => t.id !== selected.id));
    } catch (err) {
      console.error('Delete task failed', err);
    }
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="flex gap-3 px-5 py-4 border-b bg-slate-50">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm"
            />

            <button
              onClick={() => {
                setSelected(null);
                setModal("create");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold"
            >
              + Add Task
            </button>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 text-xs uppercase text-slate-400">
                  Task
                </th>

                <th className="px-5 py-3 text-xs uppercase text-slate-400">
                  Priority
                </th>

                <th className="px-5 py-3 text-xs uppercase text-slate-400">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((task) => (
                <tr key={task.id} className="border-b hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {task.title}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {task.description}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <Badge
                      text={task.priority}
                      className={PRIORITY_STYLES[task.priority]}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <Badge
                      text={task.status === 'active' ? '● Active' : '● Inactive'}
                      className={STATUS_STYLES[task.status]}
                    />
                  </td>

                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelected(task);
                        setModal("edit");
                      }}
                      className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const newStatus = task.status === 'active' ? 'inactive' : 'active';
                          await apiFetch(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ ...task, status: newStatus }) }).catch(() => null);
                          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
                        } catch (err) {
                          console.error('Toggle status failed', err);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-100 ${task.status === 'active' ? 'text-rose-600' : 'text-emerald-600'}`}
                    >
                      {task.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE */}
      <Modal open={modal === "create"} onClose={() => setModal(null)}>
        <TaskForm
          title="Create Task"
          onSubmit={createTask}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* EDIT */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)}>
        {selected && (
          <TaskForm
            title="Edit Task"
            initial={selected}
            onSubmit={updateTask}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

