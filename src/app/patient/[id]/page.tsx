'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Clipboard,
  Sparkles,
  Eye,
  Edit3,
  Save,
  LayoutDashboard,
  History,
  ArrowLeft,
} from 'lucide-react';

// Types
interface SubjectData {
  subject_info: { site_code: string; subject_number: string };
  prescreening_consent: Record<string, unknown>;
  demographics: Record<string, unknown>;
  measurements: Record<string, unknown>;
  inclusion_criteria: Record<string, unknown>;
  exclusion_criteria: Record<string, unknown>;
  medical_history: Record<string, unknown>;
  medical_conditions: Record<string, unknown>;
  arrhythmia_history: Record<string, unknown>;
  acs_risk: Record<string, unknown>;
  troponin_log: { results: Array<Record<string, unknown>>; ai_notes?: string };
  ecg_log: { results: Array<Record<string, unknown>>; ai_notes?: string };
  medications_log: { medications: Array<Record<string, unknown>>; ai_notes?: string };
  catheterization: Record<string, unknown>;
  followup_30day: Record<string, unknown>;
}

const createEmptySubject = (): SubjectData => ({
  subject_info: { site_code: '', subject_number: '' },
  prescreening_consent: { icf_signed: null, consent_date: '', consent_time: '', ai_notes: '' },
  demographics: { date_of_birth: '', gender: null, ethnicity: null, race: null, ai_notes: '' },
  measurements: {
    height_inches: null,
    weight_lbs: null,
    chest_circumference_cm: null,
    systolic_bp: null,
    diastolic_bp: null,
    pulse_bpm: null,
    temperature_f: null,
    o2_saturation: null,
    measurement_date: '',
    measurement_time: '',
    ai_notes: '',
  },
  inclusion_criteria: {
    age_18_or_older: null,
    scheduled_for_angiography: null,
    able_to_comply: null,
    written_consent: null,
    female_negative_pregnancy: null,
    ai_notes: '',
  },
  exclusion_criteria: {
    present_stemi: null,
    pregnant_or_lactating: null,
    active_afib: null,
    thoracic_implants: null,
    external_devices: null,
    inability_supine: null,
    poor_followup_access: null,
    other_exclusion: null,
    other_exclusion_specify: '',
    ai_notes: '',
  },
  medical_history: {
    implanted_devices: null,
    implanted_devices_specify: '',
    smoking_status: null,
    smoking_packs_per_day: null,
    smoking_years: null,
    alcohol_use: null,
    alcohol_drinks_per_week: null,
    sleep_apnea: null,
    sleep_apnea_treatment: '',
    family_cardiac_history: null,
    family_cardiac_specify: '',
    covid_history: null,
    covid_date: '',
    insurance_type: '',
    ai_notes: '',
  },
  medical_conditions: {
    mi_history: { present: null, diagnosis_date: '', notes: '' },
    lvh: { present: null, diagnosis_date: '', notes: '' },
    valvular_disease: { present: null, diagnosis_date: '', notes: '' },
    chf: { present: null, diagnosis_date: '', notes: '' },
    pulmonary_hypertension: { present: null, diagnosis_date: '', notes: '' },
    angina: { present: null, diagnosis_date: '', notes: '' },
    cardiomyopathy: { present: null, diagnosis_date: '', notes: '' },
    diabetes: { present: null, diagnosis_date: '', notes: '' },
    ckd: { present: null, diagnosis_date: '', notes: '' },
    cad: { present: null, diagnosis_date: '', notes: '' },
    hypertension: { present: null, diagnosis_date: '', notes: '' },
    hyperlipidemia: { present: null, diagnosis_date: '', notes: '' },
    ai_notes: '',
  },
  arrhythmia_history: {
    afib_aflutter: null,
    afib_type: '',
    bradycardia: null,
    svt: null,
    vt: null,
    heart_block: null,
    heart_block_degree: '',
    long_qt: null,
    pacs_pvcs: null,
    psvt: null,
    other_arrhythmia: null,
    other_arrhythmia_specify: '',
    ai_notes: '',
  },
  acs_risk: {
    risk_arm: null,
    stable_angina: null,
    nstemi_no_high_risk: null,
    recurrent_angina: null,
    dynamic_st_changes: null,
    elevated_troponin: null,
    hemodynamic_instability: null,
    sustained_vt: null,
    recent_pci: null,
    prior_cabg: null,
    high_grace_score: null,
    lvef_under_40: null,
    ai_notes: '',
  },
  troponin_log: { results: [], ai_notes: '' },
  ecg_log: { results: [], ai_notes: '' },
  medications_log: { medications: [], ai_notes: '' },
  catheterization: {
    procedure_date: null,
    procedure_start_time: null,
    procedure_end_time: null,
    admission_source: null,
    primary_diagnosis: '',
    procedure_indication: '',
    anesthesia_type: null,
    access_site: null,
    pci_performed: null,
    vessels_treated: [],
    culprit_vessel: '',
    coronary_dominance: null,
    total_stents_placed: 0,
    complications: '',
    ai_notes: '',
  },
  followup_30day: {
    followup_date: null,
    er_visit: null,
    hospitalization: null,
    new_mi: null,
    new_revascularization: null,
    new_arrhythmia: null,
    new_chf: null,
    stroke_tia: null,
    death: null,
    ai_notes: '',
  },
});

// Component helpers
const YesNoSelect = ({
  value,
  onChange,
  includeNA = false,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  includeNA?: boolean;
}) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value || null)}
    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
  >
    <option value="">-- Select --</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
    {includeNA && <option value="N/A">N/A</option>}
  </select>
);

const TextInput = ({
  value,
  onChange,
  placeholder = '',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <input
    type="text"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none ${className}`}
  />
);

const NumberInput = ({
  value,
  onChange,
  placeholder = '',
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) => (
  <input
    type="number"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    placeholder={placeholder}
    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none w-24"
  />
);

const FormField = ({
  label,
  children,
  required = false,
  hint = '',
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-slate-300">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <span className="text-xs text-slate-500">{hint}</span>}
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  children,
  expanded,
  onToggle,
  status = 'incomplete',
  aiNotes = '',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  status?: 'complete' | 'incomplete' | 'error' | 'ai_filled';
  aiNotes?: string;
}) => {
  const statusColors = {
    complete: 'bg-emerald-500/20 border-emerald-500/50',
    incomplete: 'bg-slate-700/50 border-slate-600',
    error: 'bg-red-500/20 border-red-500/50',
    ai_filled: 'bg-amber-500/20 border-amber-500/50',
  };

  return (
    <div className={`rounded-xl border ${statusColors[status]} overflow-hidden transition-all duration-200`}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-slate-100">{title}</span>
          {status === 'complete' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {status === 'ai_filled' && <Sparkles className="w-4 h-4 text-amber-400" />}
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/50">
          {aiNotes && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                AI Notes
              </div>
              <p className="text-sm text-slate-300">{aiNotes}</p>
            </div>
          )}
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
};

export default function PatientEditPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const patient = useQuery(api.subjects.get, { id: patientId as Id<'subjects'> });
  const updateSubjectMutation = useMutation(api.subjects.update);

  const [epicData, setEpicData] = useState('');
  const [subject, setSubject] = useState<SubjectData>(createEmptySubject());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ subject_info: true });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('forms');
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedPDFs, setGeneratedPDFs] = useState<Array<{ name: string; base64: string }>>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load patient data when it becomes available
  useEffect(() => {
    if (patient?.data) {
      setSubject(patient.data as SubjectData);
    }
  }, [patient]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateSubjectField = (section: keyof SubjectData, data: Record<string, unknown>) => {
    setSubject((prev) => ({ ...prev, [section]: data }));
    setHasChanges(true);
  };

  const processWithAI = async () => {
    if (!epicData.trim()) {
      setError('Please paste Epic data first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingStatus('Sending data to AI for interpretation...');

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epic_data: epicData,
          site_code: subject.subject_info.site_code || 'MSW',
          subject_number: subject.subject_info.subject_number || '001',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProcessingStatus('Data extracted successfully! Merging with existing data...');

        // Merge new data with existing - append arrays, update other fields
        const newData = result.data as SubjectData;
        setSubject(prev => ({
          ...prev,
          ...newData,
          // Merge arrays instead of replacing
          troponin_log: {
            results: [...prev.troponin_log.results, ...newData.troponin_log.results],
            ai_notes: newData.troponin_log.ai_notes || prev.troponin_log.ai_notes,
          },
          ecg_log: {
            results: [...prev.ecg_log.results, ...newData.ecg_log.results],
            ai_notes: newData.ecg_log.ai_notes || prev.ecg_log.ai_notes,
          },
          medications_log: {
            medications: [...prev.medications_log.medications, ...newData.medications_log.medications],
            ai_notes: newData.medications_log.ai_notes || prev.medications_log.ai_notes,
          },
          // Keep original subject info
          subject_info: prev.subject_info,
        }));
        setHasChanges(true);
        setActiveTab('forms');
      } else {
        setError(result.error || 'Failed to process data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const generatePDFs = async () => {
    setIsGeneratingPDF(true);
    setError('');

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_data: subject,
          forms: ['all'],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPDFs(result.files);
        setActiveTab('preview');
      } else {
        setError(result.error || 'Failed to generate PDFs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDFs');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadPDF = (pdf: { name: string; base64: string }) => {
    const link = document.createElement('a');
    link.href = pdf.base64;
    link.download = pdf.name;
    link.click();
  };

  const savePatient = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const newVersion = await updateSubjectMutation({
        id: patientId as Id<'subjects'>,
        data: subject,
        changeNote: 'Updated patient data',
      });
      setSuccessMessage(`Patient updated successfully! Now at version ${newVersion}`);
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save patient');
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionStatus = (section: keyof SubjectData): 'complete' | 'incomplete' | 'ai_filled' | 'error' => {
    const data = subject[section];
    if (!data) return 'incomplete';

    const values = Object.values(data).filter((v) => v !== '' && v !== null && v !== undefined);
    if (values.length === 0) return 'incomplete';
    if ((data as Record<string, unknown>).ai_notes) return 'ai_filled';
    return 'complete';
  };

  if (patient === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading patient data...</p>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  Edit Patient: {patient.siteCode}-{patient.subjectNumber}
                </h1>
                <p className="text-sm text-slate-400">
                  Version {patient.currentVersion} | Last updated: {new Date(patient.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/patient/${patientId}/history`}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                <History className="w-4 h-4" />
                History
              </Link>
              <button
                onClick={savePatient}
                disabled={isSaving || !hasChanges}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white disabled:text-slate-400 font-semibold rounded-lg flex items-center gap-2 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {hasChanges ? 'Save Changes' : 'Saved'}
                  </>
                )}
              </button>
              <button
                onClick={generatePDFs}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-slate-900 disabled:text-slate-400 font-semibold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 disabled:shadow-none"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate PDFs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700/50 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'forms', label: 'Edit Forms', icon: Edit3 },
              { id: 'input', label: 'Add More Data', icon: Upload },
              { id: 'preview', label: 'Preview & Download', icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-amber-400 border-amber-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-emerald-200">
            <strong>Success:</strong> {successMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Add More Data Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-slate-100">Add More Epic Data</h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Paste additional clinical data to merge with existing patient information.
                New medications, troponin values, and ECG results will be appended to existing lists.
              </p>
              <textarea
                value={epicData}
                onChange={(e) => setEpicData(e.target.value)}
                placeholder="Paste additional Epic data here..."
                className="w-full h-60 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              />
              <div className="mt-4">
                <button
                  onClick={processWithAI}
                  disabled={isProcessing || !epicData.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-slate-900 disabled:text-slate-400 font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 disabled:shadow-none"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Extract & Merge with AI
                    </>
                  )}
                </button>
                {processingStatus && <span className="ml-4 text-sm text-amber-400">{processingStatus}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="space-y-4">
            <SectionCard
              title="Subject Information"
              icon={FileText}
              expanded={expandedSections.subject_info}
              onToggle={() => toggleSection('subject_info')}
              status={getSectionStatus('subject_info')}
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Site Code" required>
                  <TextInput
                    value={subject.subject_info.site_code}
                    onChange={(v) =>
                      updateSubjectField('subject_info', { ...subject.subject_info, site_code: v })
                    }
                    placeholder="e.g., MSW"
                  />
                </FormField>
                <FormField label="Subject Number" required>
                  <TextInput
                    value={subject.subject_info.subject_number}
                    onChange={(v) =>
                      updateSubjectField('subject_info', { ...subject.subject_info, subject_number: v })
                    }
                    placeholder="e.g., 001"
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="Demographics"
              icon={FileText}
              expanded={expandedSections.demographics}
              onToggle={() => toggleSection('demographics')}
              status={getSectionStatus('demographics')}
              aiNotes={(subject.demographics as Record<string, unknown>).ai_notes as string}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField label="Date of Birth" hint="DD-MMM-YY">
                  <TextInput
                    value={(subject.demographics as Record<string, unknown>).date_of_birth as string}
                    onChange={(v) => updateSubjectField('demographics', { ...subject.demographics, date_of_birth: v })}
                    placeholder="15-Mar-65"
                  />
                </FormField>
                <FormField label="Gender">
                  <select
                    value={((subject.demographics as Record<string, unknown>).gender as string) || ''}
                    onChange={(e) =>
                      updateSubjectField('demographics', { ...subject.demographics, gender: e.target.value || null })
                    }
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Select --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormField>
                <FormField label="Ethnicity">
                  <select
                    value={((subject.demographics as Record<string, unknown>).ethnicity as string) || ''}
                    onChange={(e) =>
                      updateSubjectField('demographics', { ...subject.demographics, ethnicity: e.target.value || null })
                    }
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Select --</option>
                    <option value="Hispanic or Latino">Hispanic or Latino</option>
                    <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </FormField>
                <FormField label="Race">
                  <select
                    value={((subject.demographics as Record<string, unknown>).race as string) || ''}
                    onChange={(e) =>
                      updateSubjectField('demographics', { ...subject.demographics, race: e.target.value || null })
                    }
                    className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Select --</option>
                    <option value="White">White</option>
                    <option value="Black or African American">Black or African American</option>
                    <option value="Asian">Asian</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="ACS Risk Stratification"
              icon={FileText}
              expanded={expandedSections.acs_risk}
              onToggle={() => toggleSection('acs_risk')}
              status={getSectionStatus('acs_risk')}
              aiNotes={(subject.acs_risk as Record<string, unknown>).ai_notes as string}
            >
              <FormField label="Risk Arm Assignment">
                <select
                  value={((subject.acs_risk as Record<string, unknown>).risk_arm as string) || ''}
                  onChange={(e) =>
                    updateSubjectField('acs_risk', { ...subject.acs_risk, risk_arm: e.target.value || null })
                  }
                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:border-amber-500 outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="Low">Low (Stable Angina)</option>
                  <option value="Medium">Medium (NSTEMI without high-risk features)</option>
                  <option value="High">High (NSTEMI with high-risk features)</option>
                </select>
              </FormField>
            </SectionCard>

            <SectionCard
              title="Troponin Log"
              icon={FileText}
              expanded={expandedSections.troponin_log}
              onToggle={() => toggleSection('troponin_log')}
              status={subject.troponin_log.results.length > 0 ? 'ai_filled' : 'incomplete'}
              aiNotes={subject.troponin_log.ai_notes}
            >
              <p className="text-sm text-slate-400 mb-4">
                {subject.troponin_log.results.length} troponin result(s) recorded
              </p>
              {subject.troponin_log.results.map((result, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-sm text-slate-400">Date/Time:</span>
                      <span className="ml-2 text-slate-100">
                        {(result as Record<string, unknown>).collection_datetime as string}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Value:</span>
                      <span className="ml-2 text-slate-100">
                        {(result as Record<string, unknown>).value_ng_l as number} ng/L
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Above Ref:</span>
                      <span
                        className={`ml-2 ${(result as Record<string, unknown>).above_reference === 'Yes' ? 'text-red-400' : 'text-emerald-400'}`}
                      >
                        {(result as Record<string, unknown>).above_reference as string}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {subject.troponin_log.results.length === 0 && (
                <p className="text-slate-500 italic">No troponin results recorded</p>
              )}
            </SectionCard>

            <SectionCard
              title="Medications Log"
              icon={FileText}
              expanded={expandedSections.medications_log}
              onToggle={() => toggleSection('medications_log')}
              status={subject.medications_log.medications.length > 0 ? 'ai_filled' : 'incomplete'}
              aiNotes={subject.medications_log.ai_notes}
            >
              <p className="text-sm text-slate-400 mb-4">
                {subject.medications_log.medications.length} medication(s) recorded
              </p>
              {subject.medications_log.medications.map((med, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-sm text-slate-400">Medication:</span>
                      <span className="ml-2 text-slate-100 font-medium">
                        {(med as Record<string, unknown>).medication_name as string}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Dose:</span>
                      <span className="ml-2 text-slate-100">
                        {(med as Record<string, unknown>).dose as string} {(med as Record<string, unknown>).unit as string}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Frequency:</span>
                      <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).frequency as string}</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Route:</span>
                      <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).route as string}</span>
                    </div>
                  </div>
                </div>
              ))}
              {subject.medications_log.medications.length === 0 && (
                <p className="text-slate-500 italic">No medications recorded</p>
              )}
            </SectionCard>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {generatedPDFs.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">Generated PDFs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedPDFs.map((pdf, index) => (
                    <div key={index} className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-amber-400" />
                        <span className="text-slate-200 text-sm">{pdf.name}</span>
                      </div>
                      <button
                        onClick={() => downloadPDF(pdf)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
              <h2 className="text-lg font-semibold text-slate-100 mb-6">Form Data Preview (JSON)</h2>
              <pre className="bg-slate-900 rounded-xl p-6 text-sm text-slate-300 overflow-auto max-h-[600px] font-mono">
                {JSON.stringify(subject, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
