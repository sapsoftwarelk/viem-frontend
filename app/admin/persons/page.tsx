"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Users, Plus, Search, Eye, Pencil, X, Check, Trash2,
  ClipboardList, AlertCircle
} from "lucide-react";

// ── Seed Data ──────────────────────────────────────────────────────────────────

const SEED_TASKS = [
  { id: "t1",  label: "Create / Edit Users",    description: "Add, deactivate and edit person profiles" },
  { id: "t2",  label: "View Asset Prices [PRV]", description: "See purchase price and current asset value" },
  { id: "t3",  label: "Create PO",               description: "Raise a Purchase Order for supplier" },
  { id: "t4",  label: "Raise GRN",               description: "Create a Goods Received Note" },
  { id: "t5",  label: "Raise SRN",               description: "Send goods back to supplier" },
  { id: "t6",  label: "Create / Approve GIN",    description: "Create and finalise a Goods Issue Note" },
  { id: "t7",  label: "Confirm Lorry Loading",   description: "Driver confirms items physically loaded" },
  { id: "t8",  label: "Confirm Site Receipt",    description: "Site person confirms items received" },
  { id: "t9",  label: "Raise GRtN",              description: "Initiate return of goods to warehouse" },
  { id: "t10", label: "Raise GRN-I",             description: "Warehouse receives returned goods" },
  { id: "t11", label: "Raise DRN",               description: "Report damage to any item" },
  { id: "t12", label: "Create RWO",              description: "Send item to repair center" },
  { id: "t13", label: "Update RWO Status",       description: "Log repair progress and completion" },
  { id: "t14", label: "Raise SWO / THN / EXN",  description: "Write off, report theft, or expire batch" },
  { id: "t15", label: "Log MHL",                 description: "Enter machine hours consumed for a tool" },
  { id: "t16", label: "Run PAR Audit",           description: "Conduct a physical stock count" },
];

const SEED_POSITIONS = [
  { id: "pos1", title: "Chief Executive Officer", shortCode: "CEO", color: "violet", taskIds: ["t2","t16"] },
  { id: "pos2", title: "Main Administrator",       shortCode: "ADM", color: "blue",   taskIds: SEED_TASKS.map(t => t.id) },
  { id: "pos3", title: "Inventory Manager",        shortCode: "INV", color: "emerald",taskIds: ["t3","t4","t5","t6","t10","t11","t12","t13","t15","t16","t9"] },
  { id: "pos4", title: "Technical Officer",        shortCode: "TO",  color: "amber",  taskIds: ["t8","t9","t11","t15"] },
  { id: "pos5", title: "Driver",                   shortCode: "DRV", color: "slate",  taskIds: ["t7"] },
  { id: "pos6", title: "Repair Technician",        shortCode: "RPR", color: "rose",   taskIds: ["t13"] },
  { id: "pos7", title: "Site Manager",             shortCode: "SM",  color: "teal",   taskIds: ["t8","t9","t11","t15"] },
];

const SEED_PERSONS = [
  { id: "p1", empId: "EMP-0001", name: "Anil Perera",        email: "anil@venus.lk",    phone: "+94 77 123 4567", joinDate: "2019-03-15", positionId: "pos1", status: "active" },
  { id: "p2", empId: "EMP-0002", name: "Kamala Wijesinghe",  email: "kamala@venus.lk",  phone: "+94 77 234 5678", joinDate: "2020-07-01", positionId: "pos3", status: "active" },
  { id: "p3", empId: "EMP-0003", name: "Ruwantha Bandara",   email: "ruwan@venus.lk",   phone: "+94 76 345 6789", joinDate: "2021-01-10", positionId: "pos4", status: "active" },
  { id: "p4", empId: "EMP-0004", name: "Nalini Fernando",    email: "nalini@venus.lk",  phone: "+94 71 456 7890", joinDate: "2022-04-20", positionId: "pos4", status: "active" },
  { id: "p5", empId: "EMP-0005", name: "Suresh Mendis",      email: "suresh@venus.lk",  phone: "+94 70 567 8901", joinDate: "2022-09-05", positionId: "pos6", status: "active" },
  { id: "p6", empId: "EMP-0006", name: "Dilani Rathnayake",  email: "dilani@venus.lk",  phone: "+94 77 678 9012", joinDate: "2023-02-14", positionId: "pos5", status: "inactive" },
  { id: "p7", empId: "EMP-0007", name: "Thilak Samaraweera", email: "thilak@venus.lk",  phone: "+94 75 789 0123", joinDate: "2023-06-01", positionId: "pos7", status: "active" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const COLOR_AVATAR = {
  blue:"bg-blue-600", emerald:"bg-emerald-600", amber:"bg-amber-500",
  violet:"bg-violet-600", rose:"bg-rose-600", slate:"bg-slate-500",
  teal:"bg-teal-600", orange:"bg-orange-500",
};
const COLOR_BADGE = {
  blue:"bg-blue-50 text-blue-700 border-blue-200",
  emerald:"bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:"bg-amber-50 text-amber-700 border-amber-200",
  violet:"bg-violet-50 text-violet-700 border-violet-200",
  rose:"bg-rose-50 text-rose-700 border-rose-200",
  slate:"bg-slate-100 text-slate-600 border-slate-200",
  teal:"bg-teal-50 text-teal-700 border-teal-200",
  orange:"bg-orange-50 text-orange-700 border-orange-200",
};

function uid() { return Math.random().toString(36).slice(2,9); }
function initials(name) { return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }

function PosBadge({ pos, size="sm" }) {
  if (!pos) return null;
  return (
    <span className={`inline-flex items-center border rounded-full font-semibold
      ${size==="xs"?"px-2 py-0.5 text-[10px]":"px-2.5 py-1 text-[11px]"}
      ${COLOR_BADGE[pos.color]||COLOR_BADGE.slate}`}>
      {pos.shortCode}
    </span>
  );
}

// ── Modal Wrapper ──────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width="max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} overflow-hidden`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────

function ConfirmDelete({ open, onClose, onConfirm, name }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete">
      <div className="p-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0"/>
          <p className="text-[13px] text-rose-700">Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600">Delete</button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSONS CRUD
// ══════════════════════════════════════════════════════════════════════════════

function PersonForm({ initial, onSubmit, onCancel, positions }) {
  const [form, setForm] = useState(initial || {
    name:"", empId:"", email:"", phone:"", joinDate:"", positionId: positions[0]?.id||"", status:"active"
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.name.trim() && form.empId.trim() && form.positionId;

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Full Name *</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="John Doe"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">EMP ID *</label>
          <input value={form.empId} onChange={e=>set("empId",e.target.value)} placeholder="EMP-0008"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Status</label>
          <select value={form.status} onChange={e=>set("status",e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Job Position *</label>
          <select value={form.positionId} onChange={e=>set("positionId",e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
            {positions.map(p => <option key={p.id} value={p.id}>{p.title} ({p.shortCode})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Email</label>
          <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@company.lk" type="email"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Phone</label>
          <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+94 77 000 0000"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Join Date</label>
          <input value={form.joinDate} onChange={e=>set("joinDate",e.target.value)} type="date"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={()=>valid&&onSubmit(form)} disabled={!valid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold ${valid?"bg-blue-600 hover:bg-blue-700":"bg-blue-300 cursor-not-allowed"}`}>
          {initial ? "Save Changes" : "Create Person"}
        </button>
      </div>
    </div>
  );
}

function PersonDetailDrawer({ person, onClose, onEdit, positions, tasks }) {
  const pos = positions.find(p => p.id===person.positionId);
  const assignedTasks = tasks.filter(t => pos?.taskIds?.includes(t.id));
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className={`h-1.5 w-full ${COLOR_AVATAR[pos?.color||"slate"]}`}/>
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0 ${COLOR_AVATAR[pos?.color||"slate"]}`}>
            {initials(person.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-slate-800">{person.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{person.empId}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {pos && <PosBadge pos={pos} size="xs"/>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                ${person.status==="active"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-rose-50 text-rose-600 border-rose-200"}`}>
                {person.status==="active"?"● Active":"● Inactive"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
        </div>
        <div className="p-5 flex-1 space-y-5">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact & Employment</p>
            <div className="space-y-2 text-[12px]">
              {[["Email", person.email], ["Phone", person.phone], ["Joined", formatDate(person.joinDate)]].map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-700">{v||"—"}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Task Permissions — {assignedTasks.length} tasks
            </p>
            {assignedTasks.length === 0
              ? <p className="text-[12px] text-slate-400 italic">No tasks assigned to this position</p>
              : <div className="flex flex-wrap gap-1.5">
                  {tasks.map(t => (
                    <span key={t.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium
                      ${assignedTasks.find(x=>x.id===t.id)
                        ?"bg-emerald-50 text-emerald-700 border-emerald-200"
                        :"bg-slate-50 text-slate-300 border-slate-100 line-through"}`}>
                      {assignedTasks.find(x=>x.id===t.id) ? <Check size={8}/> : <X size={8}/>}
                      {t.label}
                    </span>
                  ))}
                </div>
            }
          </section>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700">
            <Pencil size={13}/> Edit Person
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonsTab({ persons, setPersons, positions, tasks, createPerson, updatePerson, deletePerson }) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);
  const [drawer, setDrawer] = useState(null);

  const filtered = persons.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.empId.toLowerCase().includes(search.toLowerCase());
    const mp = filterPos==="all" || p.positionId===filterPos;
    const mst = filterStatus==="all" || p.status===filterStatus;
    return ms && mp && mst;
  });

  const create = async (data) => {
    if (createPerson) {
      await createPerson(data);
    } else {
      setPersons(prev => [...prev, { id:"p"+uid(), ...data }]);
    }
    setModal(null);
  };
  const update = async (data) => {
    if (updatePerson && target) {
      await updatePerson(target.id, data);
    } else {
      setPersons(prev => prev.map(p => p.id===target.id ? {...p,...data } : p));
    }
    setModal(null); setDrawer(null);
  };
  const remove = async () => {
    if (deletePerson && target) {
      await deletePerson(target.id);
    } else {
      setPersons(prev => prev.filter(p => p.id!==target.id));
    }
    setModal(null);
  };

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label:"Total",     value: persons.length,                                color:"blue" },
          { label:"Active",    value: persons.filter(p=>p.status==="active").length,  color:"emerald" },
          { label:"Inactive",  value: persons.filter(p=>p.status==="inactive").length,color:"rose" },
          { label:"Positions", value: positions.length,                              color:"violet" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className={`text-[24px] font-extrabold leading-none
              ${c.color==="blue"?"text-blue-600":c.color==="emerald"?"text-emerald-600":c.color==="rose"?"text-rose-500":"text-violet-600"}`}>
              {c.value}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or EMP-ID…"
            className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"/>
        </div>
        <select value={filterPos} onChange={e=>setFilterPos(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Positions</option>
          {positions.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={()=>{ setTarget(null); setModal("create"); }}
          className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[13px] font-semibold">
          <Plus size={14}/> Add Person
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Person</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0
              ? <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-[13px]">No persons match</td></tr>
              : filtered.map(person => {
                  const pos = positions.find(p=>p.id===person.positionId);
                  return (
                    <tr key={person.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={()=>setDrawer(person)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${COLOR_AVATAR[pos?.color||"slate"]}`}>
                            {initials(person.name)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-700">{person.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{person.empId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {pos ? <PosBadge pos={pos} size="xs"/> : <span className="text-[11px] text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-[12px] text-slate-500">{person.email||"—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                          ${person.status==="active"?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-rose-50 text-rose-600 border-rose-200"}`}>
                          {person.status==="active"?"● Active":"● Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5" onClick={e=>e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button onClick={()=>setDrawer(person)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="View">
                            <Eye size={13}/>
                          </button>
                          <button onClick={()=>{ setTarget(person); setModal("edit"); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Edit">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={()=>{ setTarget(person); setModal("delete"); }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {drawer && (
        <PersonDetailDrawer
          person={drawer}
          positions={positions}
          tasks={tasks}
          onClose={()=>setDrawer(null)}
          onEdit={()=>{ setTarget(drawer); setDrawer(null); setModal("edit"); }}
        />
      )}

      <Modal open={modal==="create"} onClose={()=>setModal(null)} title="Add Person">
        <PersonForm onSubmit={create} onCancel={()=>setModal(null)} positions={positions}/>
      </Modal>
      <Modal open={modal==="edit"} onClose={()=>setModal(null)} title="Edit Person">
        {target && <PersonForm initial={target} onSubmit={update} onCancel={()=>setModal(null)} positions={positions}/>}
      </Modal>
      <ConfirmDelete open={modal==="delete"} onClose={()=>setModal(null)} onConfirm={remove} name={target?.name}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [tasks] = useState(SEED_TASKS);
  const [positions, setPositions] = useState(SEED_POSITIONS);
  const [persons, setPersons] = useState(SEED_PERSONS);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, pers] = await Promise.all([
          apiFetch("/roles").catch(() => SEED_POSITIONS),
          apiFetch("/employees").catch(() => SEED_PERSONS),
        ]);

        if (Array.isArray(p)) {
          setPositions(
            p.map((r) => ({ id: r.id, title: r.position_title || r.name || "", shortCode: (r.position_title || "").split(" ")[0] || r.id, color: "slate", taskIds: [] }))
          );
        }

        if (Array.isArray(pers)) {
          setPersons(
            pers.map((e) => ({ id: e.id, empId: e.employeeId, name: e.fullName || e.name, email: e.contact || "", phone: e.contact || "", joinDate: e.joinDate ? e.joinDate.split("T")[0] : "", positionId: e.roleId || e.positionId || "", status: e.status?.toLowerCase() === "inactive" ? "inactive" : "active" }))
          );
        }
      } catch (err) {
        console.warn("Persons load failed:", err);
      }
    };
    load();
  }, []);

  const create = async (data) => {
    try {
      const payload = {
        fullName: data.name,
        employeeId: data.empId,
        contact: data.email || data.phone || "",
        department: "",
        joinDate: data.joinDate || undefined,
        roleId: data.positionId || undefined,
        status: data.status || "active",
      };
      const created = await apiFetch("/employees", { method: "POST", body: JSON.stringify(payload) }).catch(() => null);
      if (created) setPersons((prev) => [{ id: created.id, empId: created.employeeId, name: created.fullName, email: created.contact, phone: created.contact, joinDate: created.joinDate ? created.joinDate.split("T")[0] : "", positionId: created.roleId || "", status: created.status?.toLowerCase() || "active" }, ...prev]);
    } catch (err) {
      console.error("Create person failed:", err);
    }
  };
  const update = async (id, data) => {
    try {
      const payload = {
        fullName: data.name,
        employeeId: data.empId,
        contact: data.email || data.phone || "",
        joinDate: data.joinDate || undefined,
        roleId: data.positionId || undefined,
        status: data.status || "active",
      };
      const updated = await apiFetch(`/employees/${id}`, { method: "PUT", body: JSON.stringify(payload) }).catch(() => null);
      if (updated) setPersons((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    } catch (err) {
      console.error("Update person failed:", err);
    }
  };

  const remove = async (id) => {
    try {
      await apiFetch(`/employees/${id}`, { method: "DELETE" }).catch(() => null);
      setPersons((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete person failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Persons</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage people and their task permissions</p>
        </div>
        <PersonsTab
          persons={persons}
          setPersons={setPersons}
          positions={positions}
          tasks={tasks}
          // wire CRUD handlers
          createPerson={create}
          updatePerson={update}
          deletePerson={remove}
        />
      </div>
    </div>
  );
}