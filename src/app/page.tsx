'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Link from 'next/link';
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
    able_to_comply: 'Yes',
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

// Sample Epic data for testing
const SAMPLE_EPIC_DATA = `Patient: John D.
DOB: 03/15/1965
Gender: Male
Race: White
Ethnicity: Not Hispanic or Latino

Vitals (12/20/2024 08:30):
BP: 142/88 mmHg
HR: 78 bpm
Temp: 98.6F
SpO2: 96% RA
Height: 5'10" (70 inches)
Weight: 185 lbs

Chief Complaint: Chest pain, pressure-like, radiating to left arm, started 3 hours ago

Past Medical History:
- Hypertension (diagnosed 2015)
- Hyperlipidemia (diagnosed 2018)
- Type 2 Diabetes Mellitus (diagnosed 2019, A1c 7.2%)
- Former smoker (quit 2020, 20 pack-year history)
- No prior MI or PCI
- No pacemaker or ICD

Current Medications:
- Metformin 1000mg PO BID
- Lisinopril 20mg PO daily
- Atorvastatin 40mg PO daily
- Aspirin 81mg PO daily
- Metoprolol 25mg PO BID

Labs (12/20/2024):
Troponin I (06:00): 45 ng/L (H) - Reference: Males ≤20 ng/L
Troponin I (12:00): 128 ng/L (H)
Troponin I (18:00): 89 ng/L (H) - Downtrending
BUN: 18 mg/dL
Creatinine: 1.1 mg/dL
eGFR: 72 mL/min

ECG (12/20/24 06:15):
Sinus rhythm, rate 78
ST depression 1-2mm in leads V4-V6 and leads II, III, aVF
No ST elevation
QTc 440ms

Assessment: NSTEMI - Non-ST elevation myocardial infarction
Risk Stratification: High risk due to dynamic ST changes and rising troponin

Plan:
1. Admit to CCU
2. Continue dual antiplatelet therapy
3. Heparin drip per ACS protocol
4. Cardiac catheterization scheduled for tomorrow morning
5. Continue home medications
6. NPO after midnight

Consent: Written informed consent obtained for cardiac catheterization
Consent signed: 12/20/2024 at 14:30

No thoracic implants
No external monitoring devices on chest
Patient able to lie supine
Good follow-up access - has phone and transportation`;

export default function MCGStudyApp() {
  const [epicData, setEpicData] = useState('');
  const [subject, setSubject] = useState<SubjectData>(createEmptySubject());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ subject_info: true });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedPDFs, setGeneratedPDFs] = useState<Array<{ name: string; base64: string }>>([]);

  // Convex mutations
  const createSubject = useMutation(api.subjects.create);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateSubjectField = (section: keyof SubjectData, data: Record<string, unknown>) => {
    setSubject((prev) => ({ ...prev, [section]: data }));
  };

  const loadSampleData = () => {
    setEpicData(SAMPLE_EPIC_DATA);
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
        setProcessingStatus('Data extracted successfully!');
        setSubject(result.data);
        setActiveTab('forms');
        setExpandedSections({
          subject_info: true,
          demographics: true,
          inclusion_criteria: true,
          acs_risk: true,
        });
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
    if (!subject.subject_info.site_code || !subject.subject_info.subject_number) {
      setError('Please enter Site Code and Subject Number before saving');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await createSubject({
        siteCode: subject.subject_info.site_code,
        subjectNumber: subject.subject_info.subject_number,
        data: subject,
      });
      setSuccessMessage(`Patient ${subject.subject_info.site_code}-${subject.subject_info.subject_number} saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        setError(`Patient ${subject.subject_info.site_code}-${subject.subject_info.subject_number} already exists. Go to Dashboard to edit.`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save patient');
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">MCG Study Forms App</h1>
                <p className="text-sm text-slate-400">Protocol SB-ACS-005</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={savePatient}
                disabled={isSaving}
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
                    Save Patient
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
              { id: 'input', label: 'Paste Data', icon: Clipboard },
              { id: 'forms', label: 'Review Forms', icon: Edit3 },
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
        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Subject Info */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Subject Information</h2>
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
            </div>

            {/* Epic Data Input */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  Paste Epic EMR Data
                </h2>
                <button
                  onClick={loadSampleData}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
                >
                  Load Sample Data
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Copy and paste the relevant clinical data from Epic. Include demographics, vitals, labs, ECGs,
                medications, procedure notes, and any other relevant information.
              </p>
              <textarea
                value={epicData}
                onChange={(e) => setEpicData(e.target.value)}
                placeholder="Paste Epic data here..."
                className="w-full h-80 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              />

              <div className="mt-4 flex items-center gap-4">
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
                      Extract & Fill Forms with AI
                    </>
                  )}
                </button>

                {processingStatus && <span className="text-sm text-amber-400">{processingStatus}</span>}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                <h3 className="font-medium text-slate-200 mb-2">What to Include</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>Demographics (DOB, gender, race)</li>
                  <li>Vital signs</li>
                  <li>Lab results (troponin, BMP)</li>
                  <li>ECG interpretations</li>
                  <li>Medication list</li>
                  <li>Problem list / diagnoses</li>
                </ul>
              </div>
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                <h3 className="font-medium text-slate-200 mb-2">AI Will Extract</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>Eligibility criteria answers</li>
                  <li>Medical conditions</li>
                  <li>Arrhythmia history</li>
                  <li>ACS risk stratification</li>
                  <li>Troponin trends</li>
                  <li>Medication details</li>
                </ul>
              </div>
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                <h3 className="font-medium text-slate-200 mb-2">PHI Protection</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>No MRN in output</li>
                  <li>No SSN</li>
                  <li>No full names</li>
                  <li>No addresses</li>
                  <li>Subject number only</li>
                </ul>
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
                      updateSubjectField('demographics', {
                        ...subject.demographics,
                        ethnicity: e.target.value || null,
                      })
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
              title="Measurements & Vitals"
              icon={FileText}
              expanded={expandedSections.measurements}
              onToggle={() => toggleSection('measurements')}
              status={getSectionStatus('measurements')}
              aiNotes={(subject.measurements as Record<string, unknown>).ai_notes as string}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField label="Height" hint="inches">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).height_inches as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, height_inches: v })}
                    placeholder="70"
                  />
                </FormField>
                <FormField label="Weight" hint="lbs">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).weight_lbs as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, weight_lbs: v })}
                    placeholder="185"
                  />
                </FormField>
                <FormField label="Systolic BP" hint="mmHg">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).systolic_bp as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, systolic_bp: v })}
                    placeholder="120"
                  />
                </FormField>
                <FormField label="Diastolic BP" hint="mmHg">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).diastolic_bp as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, diastolic_bp: v })}
                    placeholder="80"
                  />
                </FormField>
                <FormField label="Pulse" hint="bpm">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).pulse_bpm as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, pulse_bpm: v })}
                    placeholder="72"
                  />
                </FormField>
                <FormField label="O2 Saturation" hint="%">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).o2_saturation as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, o2_saturation: v })}
                    placeholder="98"
                  />
                </FormField>
                <FormField label="Temperature" hint="F">
                  <NumberInput
                    value={(subject.measurements as Record<string, unknown>).temperature_f as number | null}
                    onChange={(v) => updateSubjectField('measurements', { ...subject.measurements, temperature_f: v })}
                    placeholder="98.6"
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="Inclusion Criteria"
              icon={CheckCircle}
              expanded={expandedSections.inclusion_criteria}
              onToggle={() => toggleSection('inclusion_criteria')}
              status={getSectionStatus('inclusion_criteria')}
              aiNotes={(subject.inclusion_criteria as Record<string, unknown>).ai_notes as string}
            >
              <p className="text-sm text-amber-400 font-medium mb-4">All criteria must be Yes for eligibility</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Age >= 18 years">
                  <YesNoSelect
                    value={(subject.inclusion_criteria as Record<string, unknown>).age_18_or_older as string | null}
                    onChange={(v) =>
                      updateSubjectField('inclusion_criteria', { ...subject.inclusion_criteria, age_18_or_older: v })
                    }
                  />
                </FormField>
                <FormField label="Scheduled for coronary angiography">
                  <YesNoSelect
                    value={
                      (subject.inclusion_criteria as Record<string, unknown>).scheduled_for_angiography as string | null
                    }
                    onChange={(v) =>
                      updateSubjectField('inclusion_criteria', {
                        ...subject.inclusion_criteria,
                        scheduled_for_angiography: v,
                      })
                    }
                  />
                </FormField>
                <FormField label="Able to comply with study procedures">
                  <YesNoSelect
                    value={(subject.inclusion_criteria as Record<string, unknown>).able_to_comply as string | null}
                    onChange={(v) =>
                      updateSubjectField('inclusion_criteria', { ...subject.inclusion_criteria, able_to_comply: v })
                    }
                  />
                </FormField>
                <FormField label="Written informed consent">
                  <YesNoSelect
                    value={(subject.inclusion_criteria as Record<string, unknown>).written_consent as string | null}
                    onChange={(v) =>
                      updateSubjectField('inclusion_criteria', { ...subject.inclusion_criteria, written_consent: v })
                    }
                  />
                </FormField>
                <FormField label="Female: Negative pregnancy test" hint="N/A for males">
                  <YesNoSelect
                    value={
                      (subject.inclusion_criteria as Record<string, unknown>).female_negative_pregnancy as string | null
                    }
                    onChange={(v) =>
                      updateSubjectField('inclusion_criteria', {
                        ...subject.inclusion_criteria,
                        female_negative_pregnancy: v,
                      })
                    }
                    includeNA
                  />
                </FormField>
              </div>
            </SectionCard>

            <SectionCard
              title="Exclusion Criteria"
              icon={AlertCircle}
              expanded={expandedSections.exclusion_criteria}
              onToggle={() => toggleSection('exclusion_criteria')}
              status={getSectionStatus('exclusion_criteria')}
              aiNotes={(subject.exclusion_criteria as Record<string, unknown>).ai_notes as string}
            >
              <p className="text-sm text-red-400 font-medium mb-4">All criteria must be No for eligibility</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Present STEMI">
                  <YesNoSelect
                    value={(subject.exclusion_criteria as Record<string, unknown>).present_stemi as string | null}
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', { ...subject.exclusion_criteria, present_stemi: v })
                    }
                  />
                </FormField>
                <FormField label="Pregnant or lactating">
                  <YesNoSelect
                    value={
                      (subject.exclusion_criteria as Record<string, unknown>).pregnant_or_lactating as string | null
                    }
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', {
                        ...subject.exclusion_criteria,
                        pregnant_or_lactating: v,
                      })
                    }
                  />
                </FormField>
                <FormField label="Active atrial fibrillation">
                  <YesNoSelect
                    value={(subject.exclusion_criteria as Record<string, unknown>).active_afib as string | null}
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', { ...subject.exclusion_criteria, active_afib: v })
                    }
                  />
                </FormField>
                <FormField label="Thoracic implants (PM/ICD)">
                  <YesNoSelect
                    value={(subject.exclusion_criteria as Record<string, unknown>).thoracic_implants as string | null}
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', { ...subject.exclusion_criteria, thoracic_implants: v })
                    }
                  />
                </FormField>
                <FormField label="External devices on chest">
                  <YesNoSelect
                    value={(subject.exclusion_criteria as Record<string, unknown>).external_devices as string | null}
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', { ...subject.exclusion_criteria, external_devices: v })
                    }
                  />
                </FormField>
                <FormField label="Inability to lie supine">
                  <YesNoSelect
                    value={(subject.exclusion_criteria as Record<string, unknown>).inability_supine as string | null}
                    onChange={(v) =>
                      updateSubjectField('exclusion_criteria', { ...subject.exclusion_criteria, inability_supine: v })
                    }
                  />
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

              <div className="p-4 bg-slate-800/50 rounded-lg mt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">High-Risk Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'recurrent_angina', label: 'Recurrent angina' },
                    { key: 'dynamic_st_changes', label: 'Dynamic ST changes' },
                    { key: 'elevated_troponin', label: 'Elevated troponin' },
                    { key: 'hemodynamic_instability', label: 'Hemodynamic instability' },
                    { key: 'sustained_vt', label: 'Sustained VT' },
                    { key: 'lvef_under_40', label: 'LVEF < 40%' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={(subject.acs_risk as Record<string, unknown>)[key] === 'Yes'}
                        onChange={(e) =>
                          updateSubjectField('acs_risk', {
                            ...subject.acs_risk,
                            [key]: e.target.checked ? 'Yes' : 'No',
                          })
                        }
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Troponin Log"
              icon={FileText}
              expanded={expandedSections.troponin_log}
              onToggle={() => toggleSection('troponin_log')}
              status={subject.troponin_log.results.length > 0 ? 'ai_filled' : 'incomplete'}
              aiNotes={subject.troponin_log.ai_notes}
            >
              <p className="text-sm text-slate-400 mb-4">Reference: Males &lt;= 20 ng/L, Females &lt;= 15 ng/L</p>
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
                <p className="text-slate-500 italic">No troponin results extracted</p>
              )}
            </SectionCard>

            <SectionCard
              title="Cardiac Medications Log"
              icon={FileText}
              expanded={expandedSections.medications_log}
              onToggle={() => toggleSection('medications_log')}
              status={subject.medications_log.medications.length > 0 ? 'ai_filled' : 'incomplete'}
              aiNotes={subject.medications_log.ai_notes}
            >
              {subject.medications_log.medications.map((med, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      <span className="text-sm text-slate-400">Indication:</span>
                      <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).indication as string}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <div>
                      <span className="text-sm text-slate-400">Start Date:</span>
                      <span className="ml-2 text-slate-100">
                        {(med as Record<string, unknown>).start_date as string || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">End Date:</span>
                      <span className={`ml-2 ${(med as Record<string, unknown>).end_date === 'Ongoing' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {(med as Record<string, unknown>).end_date as string || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Route:</span>
                      <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).route as string}</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Frequency:</span>
                      <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).frequency as string}</span>
                    </div>
                  </div>
                </div>
              ))}
              {subject.medications_log.medications.length === 0 && (
                <p className="text-slate-500 italic">No cardiac medications extracted</p>
              )}
            </SectionCard>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {/* Generated PDFs */}
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

            {/* JSON Preview */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
              <h2 className="text-lg font-semibold text-slate-100 mb-6">Form Data Preview (JSON)</h2>
              <pre className="bg-slate-900 rounded-xl p-6 text-sm text-slate-300 overflow-auto max-h-[600px] font-mono">
                {JSON.stringify(subject, null, 2)}
              </pre>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={generatePDFs}
                  disabled={isGeneratingPDF}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-slate-900 disabled:text-slate-400 font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 disabled:shadow-none"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Generate All PDFs
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(subject, null, 2))}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Clipboard className="w-5 h-5" />
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
