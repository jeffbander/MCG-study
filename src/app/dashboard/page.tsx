"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Plus, FileText, History, Users, Activity } from "lucide-react";

export default function Dashboard() {
  const subjects = useQuery(api.subjects.list);

  const activeSubjects = subjects?.filter((s) => s.status !== "archived") || [];
  const draftCount = activeSubjects.filter((s) => s.status === "draft").length;
  const completeCount = activeSubjects.filter((s) => s.status === "complete").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">MCG Study Dashboard</h1>
              <p className="text-slate-400 mt-1">Protocol SB-ACS-005 - Subject Management</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Patient
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Subjects</p>
                <p className="text-2xl font-bold text-white">{activeSubjects.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Draft</p>
                <p className="text-2xl font-bold text-white">{draftCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Complete</p>
                <p className="text-2xl font-bold text-white">{completeCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <History className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Protocol</p>
                <p className="text-lg font-bold text-white">SB-ACS-005</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject List */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Subjects</h2>
          </div>

          {subjects === undefined ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading subjects...</p>
            </div>
          ) : activeSubjects.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No subjects yet</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add First Patient
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Subject ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Risk Arm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {activeSubjects.map((subject) => (
                    <tr key={subject._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">
                          {subject.siteCode}-{subject.subjectNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            subject.data?.acs_risk?.risk_arm === "High"
                              ? "bg-red-500/20 text-red-400"
                              : subject.data?.acs_risk?.risk_arm === "Medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : subject.data?.acs_risk?.risk_arm === "Low"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {subject.data?.acs_risk?.risk_arm || "Not Set"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            subject.status === "complete"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {subject.status || "draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        v{subject.currentVersion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {new Date(subject.updatedAt).toLocaleDateString()}{" "}
                        {new Date(subject.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/patient/${subject._id}`}
                            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/patient/${subject._id}/history`}
                            className="text-slate-400 hover:text-slate-300 font-medium text-sm"
                          >
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
