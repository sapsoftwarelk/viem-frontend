"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { Plus, X } from "lucide-react";

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function NewSubCategoryForm({ categories, onSubmit, onCancel }: { categories: any[]; onSubmit: (form: any) => void; onCancel: () => void; }) {
  const [form, setForm] = useState({ name: "", code: "", categoryId: categories[0]?.id || "" });

  useEffect(() => {
    if (!form.categoryId && categories[0]) {
      setForm((f) => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories]);

  const setField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.code.trim() || !form.categoryId) {
      return;
    }
    onSubmit({
      name: form.name.trim(),
      slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      code: form.code.trim().toUpperCase(),
      categoryId: Number(form.categoryId),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Add new subcategory</h2>
          <p className="text-sm text-slate-500 mt-1">Create a new subcategory for tools, reusable items, or consumables.</p>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category</label>
          <select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)} className={inputCls}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Subcategory Name</label>
          <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Cutting Machines" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Code</label>
          <input value={form.code} onChange={(e) => setField("code", e.target.value)} className={inputCls} placeholder="CUT" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
          Create Subcategory
        </button>
      </div>
    </div>
  );
}

export default function SubCategoryAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cats, subs] = await Promise.all([apiFetch("/categories"), apiFetch("/sub-categories")]);
        setCategories(Array.isArray(cats) ? cats : []);
        setSubCategories(Array.isArray(subs) ? subs : []);
      } catch (err: any) {
        setError(err?.message || "Unable to load categories and subcategories.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (payload: any) => {
    setError("");
    try {
      setLoading(true);
      const created = await apiFetch("/sub-categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubCategories((prev) => [...prev, created]);
      setShowModal(false);
    } catch (err: any) {
      setError(err?.message || "Unable to create subcategory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin / Inventory</p>
            <h1 className="text-[26px] font-extrabold text-slate-900">Subcategory management</h1>
            <p className="text-sm text-slate-500 mt-1">Add or review subcategories used by tools, reusable items and consumables.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus size={16} /> New Subcategory
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Categories</p>
            <p className="text-3xl font-bold text-slate-900">{categories.length}</p>
            <p className="text-sm text-slate-500 mt-1">Parent categories available</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Subcategories</p>
            <p className="text-3xl font-bold text-slate-900">{subCategories.length}</p>
            <p className="text-sm text-slate-500 mt-1">Subcategory entries loaded</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Status</p>
            <p className="text-3xl font-bold text-slate-900">{loading ? "Loading…" : "Ready"}</p>
            <p className="text-sm text-slate-500 mt-1">Create a new subcategory to make it available in inventory forms.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Slug</th>
              </tr>
            </thead>
            <tbody>
              {subCategories.map((sub) => (
                <tr key={sub.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-4 font-semibold text-slate-800">{sub.code}</td>
                  <td className="px-4 py-4 text-slate-700">{sub.name}</td>
                  <td className="px-4 py-4 text-slate-500">{sub.category?.name || sub.category?.slug || "Unknown"}</td>
                  <td className="px-4 py-4 text-slate-500">{sub.slug}</td>
                </tr>
              ))}
              {subCategories.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No subcategories available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <NewSubCategoryForm categories={categories} onSubmit={handleCreate} onCancel={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
