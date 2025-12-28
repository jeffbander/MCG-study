'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function VersionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const patient = useQuery(api.subjects.get, { id: patientId as Id<'subjects'> });
  const versions = useQuery(api.versions.getHistory, { subjectId: patientId as Id<'subjects'> });
  const rollbackMutation = useMutation(api.subjects.rollback);

  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleRollback = async (targetVersion: number) => {
    if (!confirm(`Are you sure you want to rollback to version ${targetVersion}? This will create a new version with the old data.`)) {
      return;
    }

    setIsRollingBack(true);
    setRollbackTarget(targetVersion);
    setError('');
    setSuccessMessage('');

    try {
      const newVersion = await rollbackMutation({
        subjectId: patientId as Id<'subjects'>,
        targetVersion,
      });
      setSuccessMessage(`Successfully rolled back to version ${targetVersion}. New version: ${newVersion}`);
      setTimeout(() => {
        router.push(`/patient/${patientId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback');
    } finally {
      setIsRollingBack(false);
      setRollbackTarget(null);
    }
  };

  if (patient === undefined || versions === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading version history...</p>
        </div>
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-200 text-lg mb-4">Patient not found</p>
          <Link href="/dashboard" className="text-amber-400 hover:text-amber-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/patient/${patientId}`}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Version History
                </h1>
                <p className="text-sm text-slate-400">
                  {patient.siteCode}-{patient.subjectNumber} | Current: v{patient.currentVersion}
                </p>
              </div>
            </div>
            <Link
              href={`/patient/${patientId}`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Edit Patient
            </Link>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      {successMessage && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-emerald-200">
            <strong>Success:</strong> {successMessage}
          </div>
        </div>
      )}

      {/* Version Timeline */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">
            {versions.length} Version{versions.length !== 1 ? 's' : ''} Recorded
          </h2>

          {versions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No version history available</p>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => {
                const isCurrentVersion = version.version === patient.currentVersion;
                const isRollbackVersion = version.version === rollbackTarget;

                return (
                  <div
                    key={version._id}
                    className={`relative pl-8 pb-8 ${index !== versions.length - 1 ? 'border-l-2 border-slate-700' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                        isCurrentVersion
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                          : 'bg-slate-600'
                      }`}
                    />

                    {/* Version card */}
                    <div
                      className={`bg-slate-900/50 rounded-xl border p-4 ml-4 ${
                        isCurrentVersion
                          ? 'border-emerald-500/50'
                          : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-semibold text-slate-100">
                              Version {version.version}
                            </span>
                            {isCurrentVersion && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(version.createdAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {version.createdBy.substring(0, 8)}...
                            </span>
                          </div>

                          {version.changeNote && (
                            <p className="text-sm text-slate-300 bg-slate-800 px-3 py-2 rounded-lg">
                              {version.changeNote}
                            </p>
                          )}

                          {version.changedSections && version.changedSections.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {version.changedSections.map((section) => (
                                <span
                                  key={section}
                                  className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                                >
                                  {section}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {!isCurrentVersion && (
                          <button
                            onClick={() => handleRollback(version.version)}
                            disabled={isRollingBack}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isRollbackVersion ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Rolling back...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Rollback
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <h3 className="font-medium text-slate-200 mb-2">About Version History</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Each save creates a new version with a complete snapshot of the data</li>
            <li>• Rolling back restores the data from a previous version and creates a new version</li>
            <li>• Version history is permanent and cannot be deleted</li>
            <li>• Use this feature to undo accidental changes or compare historical data</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
