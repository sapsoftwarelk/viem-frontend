import { ClipboardCheck, ArrowLeftRight, AlertTriangle, Clock, CheckCircle, TimerIcon } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Avatar from "@/components/shared/Avatar";

const tasks = [
  {
    id: "GIN-0041",
    title: "Confirm Site Receipt",
    ref: "GIN-0041",
    desc: "Lorry dispatched from warehouse. Confirm all 14 items received at Site 1.",
    meta: "Dispatched today 09:14 · 14 items",
    badge: { label: "Awaiting your action", variant: "amber" as const },
    icon: ClipboardCheck,
    iconBg: "bg-viems-blue-light",
    iconColor: "text-viems-blue",
    actionLabel: "Confirm Receipt",
    actionStyle: "bg-viems-blue text-white hover:bg-viems-blue-mid",
  },
  {
    id: "GRtN-001",
    title: "Raise GRtN — Site return to warehouse",
    ref: "GRtN",
    desc: "Initiate return of unused scaffolding items from Site 1 back to warehouse.",
    meta: "Requested by: Kamala · 6 items",
    badge: { label: "Ready to initiate", variant: "blue" as const },
    icon: ArrowLeftRight,
    iconBg: "bg-viems-green-bg",
    iconColor: "text-viems-green",
    actionLabel: "Raise GRtN",
    actionStyle: "bg-viems-green-bg text-viems-green border border-viems-gray-border hover:bg-green-100",
  },
  {
    id: "DRN-001",
    title: "Report Damage — Concrete mixer #CM-04",
    ref: "DRN",
    desc: "Log a DRN for damaged concrete mixer unit at Site 1.",
    meta: "Reported verbally by crew",
    badge: { label: "Needs logging", variant: "red" as const },
    icon: AlertTriangle,
    iconBg: "bg-viems-red-bg",
    iconColor: "text-viems-red",
    actionLabel: "Raise DRN",
    actionStyle: "bg-viems-red-bg text-viems-red border border-viems-red-border hover:bg-red-100",
  },
  {
    id: "MHL-001",
    title: "Log Machine Hours — Generator #GN-11",
    ref: "MHL",
    desc: "Enter machine hours consumed for Generator GN-11 for this week.",
    meta: "Last logged: 14 May · 42 hrs",
    badge: { label: "Due today", variant: "amber" as const },
    icon: Clock,
    iconBg: "bg-viems-amber-bg",
    iconColor: "text-viems-amber",
    actionLabel: "Log Hours",
    actionStyle: "bg-viems-amber-bg text-viems-amber border border-viems-amber-border hover:bg-yellow-100",
  },
];

export default function UserTaskBoard() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-gray-900">Task Board</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">Your permitted actions · Site 1</p>
      </div>

      {/* Greeting */}
      <div className="bg-white border border-viems-gray-border rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <Avatar initials="AN" color="blue" size="md" />
        <div className="flex-1">
          <p className="text-[14px] font-bold text-gray-900">Good morning, Anil</p>
          <p className="text-[12px] text-gray-600 font-medium mt-0.5">
            You have 4 pending tasks today. Active role: <strong className="text-gray-900">Technical Officer</strong>.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-viems-green-bg text-viems-green text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
            <CheckCircle size={12} /> 2 done today
          </div>
          <div className="flex items-center gap-1.5 bg-viems-amber-bg text-viems-amber text-[11px] font-bold px-2.5 py-1.5 rounded-lg">
            <TimerIcon size={12} /> 4 pending
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div key={task.id} className="bg-white border border-viems-gray-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${task.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={task.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{task.title}</p>
                <p className="text-[12px] text-gray-600 font-medium mt-0.5">{task.desc}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={task.badge.variant}>{task.badge.label}</Badge>
                  <span className="text-[11px] text-gray-500 font-medium">{task.meta}</span>
                </div>
              </div>
              <button className={`${task.actionStyle} text-[13px] font-bold px-4 py-2 rounded-lg transition-colors flex-shrink-0 w-full sm:w-auto text-center`}>
                {task.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
