"use client";

import { useState } from "react";
import {
  Database, Download, Calendar, Clock, AlertCircle,
  CheckCircle, Settings as SettingsIcon, Bell, Globe,
  Shield, RefreshCw, Trash2, HardDrive, Server
} from "lucide-react";
import Badge from "@/components/shared/Badge";

// Hardcoded database connection (replace with real env later)
const DB_CONNECTION_STRING = "postgresql://veims_admin:secure_password@localhost:5432/veims_db";

export default function SettingsPage() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [lastBackup, setLastBackup] = useState("2026-05-20 14:30:22");

  const handleManualBackup = async () => {
    setBackupLoading(true);
    setBackupSuccess(false);
    setBackupError("");
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBackupSuccess(true);
      setLastBackup(new Date().toLocaleString());
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch {
      setBackupError("Backup failed. Please check database connection.");
      setTimeout(() => setBackupError(""), 3000);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    alert("Latest backup would be downloaded. (Simulated)");
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Settings</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">System configuration, database backup, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sidebar */}
        <div className="space-y-3">
          <div className="data-card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-viems-gray-border bg-viems-gray-bg">
              <h3 className="text-[13px] font-bold text-gray-800">Settings</h3>
            </div>
            <div className="p-2">
              {[
                { icon: SettingsIcon, label: "General", active: true },
                { icon: Database, label: "Database Backup", active: false },
               
              ].map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    item.active
                      ? "bg-viems-blue-light text-viems-blue font-semibold"
                      : "text-gray-600 hover:bg-viems-gray-bg"
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* General Settings */}
          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2"><SettingsIcon size={16} /> General Settings</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-medium">Site Name</p><p className="text-[11px] text-gray-500">Venus Enterprises</p></div>
                <button className="btn text-[11px] py-1">Edit</button>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-medium">Timezone</p><p className="text-[11px] text-gray-500">Asia/Colombo (GMT+5:30)</p></div>
                <button className="btn text-[11px] py-1">Change</button>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-medium">Date Format</p><p className="text-[11px] text-gray-500">DD/MM/YYYY</p></div>
                <button className="btn text-[11px] py-1">Change</button>
              </div>
            </div>
          </div>

          {/* Database Backup */}
          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2"><Database size={16} /> Database Backup</h2>
              <Badge variant="blue">Production</Badge>
            </div>
            <div className="p-4 space-y-4">
              {/* Connection info */}
              <div className="bg-viems-gray-bg rounded-lg p-3 border border-viems-gray-border">
                <div className="flex items-center gap-2 mb-1">
                  <Server size={12} className="text-gray-500" />
                  <span className="text-[11px] font-bold text-gray-600 uppercase">Connection String</span>
                </div>
                <code className="text-[11px] text-gray-700 break-all bg-white/80 p-1.5 rounded block font-mono">
                  {DB_CONNECTION_STRING}
                </code>
                <p className="text-[10px] text-gray-400 mt-1.5">Hardcoded for demo – store in .env in production</p>
              </div>

              {/* Backup controls */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleManualBackup}
                    disabled={backupLoading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                    {backupLoading ? "Creating backup..." : "Manual Backup Now"}
                  </button>
                  <button
                    onClick={handleDownloadBackup}
                    className="btn flex items-center gap-2"
                  >
                    <Download size={14} /> Download Latest
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-500">Last backup: <span className="font-medium text-gray-700">{lastBackup}</span></p>
                </div>
              </div>

              {/* Messages */}
              {backupSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 text-[12px]">
                  <CheckCircle size={14} /> Backup completed successfully!
                </div>
              )}
              {backupError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-[12px]">
                  <AlertCircle size={14} /> {backupError}
                </div>
              )}

              {/* Scheduled backup */}
              <div className="border-t border-viems-gray-border pt-3 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-[13px] font-medium">Automatic Backup Schedule</span>
                  </div>
                  <Badge variant="green">Daily at 02:00</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={10} /> Retention: 30 days</span>
                  <span className="flex items-center gap-1"><HardDrive size={10} /> Location: /backups/</span>
                </div>
                <button className="btn text-[11px] mt-2 py-1">Edit schedule</button>
              </div>
            </div>
          </div>

       
        </div>
      </div>
    </div>
  );
}