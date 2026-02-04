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
    acs: { present: null, type_details: null, onset_date: '', end_date: '', notes: '' },
    mi: { present: null, type_details: null, onset_date: '', end_date: '', notes: '' },
    angina: { present: null, type_details: null, onset_date: '', end_date: '', notes: '' },
    lvh: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    valvular_disease: { present: null, type_details: '', onset_date: '', end_date: 'Ongoing', notes: '' },
    chf: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    pulmonary_hypertension: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    cardiomyopathy: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    diabetes: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    ckd: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    cad: { present: null, type_details: '', onset_date: '', end_date: 'Ongoing', notes: '' },
    hypertension: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
    hyperlipidemia: { present: null, type_details: null, onset_date: '', end_date: 'Ongoing', notes: '' },
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

// Medical Condition Row Component
interface MedicalConditionData {
  present: string | null;
  type_details: string | null;
  onset_date: string;
  end_date: string;
  notes: string;
}

const MedicalConditionRow = ({
  label,
  conditionKey,
  condition,
  onChange,
  typeOptions,
  isChronicCondition = false,
  hint = '',
}: {
  label: string;
  conditionKey: string;
  condition: MedicalConditionData;
  onChange: (field: string, value: string | null) => void;
  typeOptions?: { value: string; label: string }[];
  isChronicCondition?: boolean;
  hint?: string;
}) => (
  <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-200">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Present */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Present</label>
          <select
            value={condition.present || ''}
            onChange={(e) => onChange('present', e.target.value || null)}
            className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 focus:border-amber-500 outline-none"
          >
            <option value="">-- Select --</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Type/Details */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Type/Details</label>
          {typeOptions ? (
            <select
              value={condition.type_details || ''}
              onChange={(e) => onChange('type_details', e.target.value || null)}
              className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 focus:border-amber-500 outline-none"
              disabled={condition.present !== 'Yes'}
            >
              <option value="">-- Select --</option>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={condition.type_details || ''}
              onChange={(e) => onChange('type_details', e.target.value || null)}
              placeholder="Details..."
              className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
              disabled={condition.present !== 'Yes'}
            />
          )}
        </div>

        {/* Onset Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Onset Date</label>
          <input
            type="text"
            value={condition.onset_date || ''}
            onChange={(e) => onChange('onset_date', e.target.value)}
            placeholder="DD-MMM-YY"
            className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
            disabled={condition.present !== 'Yes'}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">End Date</label>
          {isChronicCondition ? (
            <div className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-emerald-400">
              Ongoing
            </div>
          ) : (
            <input
              type="text"
              value={condition.end_date || ''}
              onChange={(e) => onChange('end_date', e.target.value)}
              placeholder="DD-MMM-YY or Ongoing"
              className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
              disabled={condition.present !== 'Yes'}
            />
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Notes</label>
          <input
            type="text"
            value={condition.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Additional notes..."
            className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
            disabled={condition.present !== 'Yes'}
          />
        </div>
      </div>
    </div>
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

  // Handler for medical condition changes with cascading logic for ACS/MI/Angina
  const updateMedicalCondition = (conditionKey: string, field: string, value: string | null) => {
    const conditions = subject.medical_conditions as Record<string, MedicalConditionData>;
    const updatedConditions = { ...conditions };

    // Update the specific field
    updatedConditions[conditionKey] = {
      ...updatedConditions[conditionKey],
      [field]: value,
    };

    // Cascading logic for ACS/MI/Angina
    if (conditionKey === 'mi' && field === 'type_details' && value) {
      // If MI type is set, apply cascading logic
      if (value === 'NSTEMI Type I' || value === 'NSTEMI Type II') {
        // NSTEMI -> MI = Yes, Angina = Yes (Unstable), ACS = Yes
        updatedConditions.mi.present = 'Yes';
        updatedConditions.angina = {
          ...updatedConditions.angina,
          present: 'Yes',
          type_details: 'Unstable',
        };
        updatedConditions.acs = {
          ...updatedConditions.acs,
          present: 'Yes',
          type_details: value,
        };
      } else if (value === 'STEMI') {
        // STEMI -> MI = Yes, ACS = Yes
        updatedConditions.mi.present = 'Yes';
        updatedConditions.acs = {
          ...updatedConditions.acs,
          present: 'Yes',
          type_details: 'STEMI',
        };
      }
    }

    if (conditionKey === 'angina' && field === 'type_details' && value) {
      if (value === 'Unstable') {
        // Unstable Angina -> Angina = Yes, ACS = Yes
        updatedConditions.angina.present = 'Yes';
        // Only set ACS to Unstable Angina if MI is not present
        if (updatedConditions.mi.present !== 'Yes') {
          updatedConditions.acs = {
            ...updatedConditions.acs,
            present: 'Yes',
            type_details: 'Unstable Angina',
          };
        }
      } else if (value === 'Stable') {
        // Stable Angina -> Angina = Yes, ACS = No (stable angina is NOT ACS)
        updatedConditions.angina.present = 'Yes';
        // Only set ACS to No if there's no MI
        if (updatedConditions.mi.present !== 'Yes') {
          updatedConditions.acs = {
            ...updatedConditions.acs,
            present: 'No',
            type_details: null,
          };
        }
      }
    }

    // If MI is set to No, clear MI type and potentially update ACS
    if (conditionKey === 'mi' && field === 'present' && value === 'No') {
      updatedConditions.mi.type_details = null;
      // If angina is also not present or stable, set ACS to No
      if (updatedConditions.angina.present !== 'Yes' || updatedConditions.angina.type_details === 'Stable') {
        updatedConditions.acs = {
          ...updatedConditions.acs,
          present: 'No',
          type_details: null,
        };
      } else if (updatedConditions.angina.type_details === 'Unstable') {
        // If unstable angina exists without MI, ACS is Unstable Angina
        updatedConditions.acs = {
          ...updatedConditions.acs,
          present: 'Yes',
          type_details: 'Unstable Angina',
        };
      }
    }

    // If Angina is set to No, clear angina type and potentially update ACS
    if (conditionKey === 'angina' && field === 'present' && value === 'No') {
      updatedConditions.angina.type_details = null;
      // If MI is also not present, set ACS to No
      if (updatedConditions.mi.present !== 'Yes') {
        updatedConditions.acs = {
          ...updatedConditions.acs,
          present: 'No',
          type_details: null,
        };
      }
    }

    // Use cath date for end_date of MI, Angina, ACS if available
    const cathDate = (subject.catheterization as Record<string, unknown>)?.procedure_date as string | null;
    if (cathDate && (conditionKey === 'mi' || conditionKey === 'angina' || conditionKey === 'acs')) {
      if (field === 'present' && value === 'Yes') {
        updatedConditions[conditionKey].end_date = cathDate;
      }
    }

    updateSubjectField('medical_conditions', updatedConditions);
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
              title="Medical Conditions"
              icon={FileText}
              expanded={expandedSections.medical_conditions}
              onToggle={() => toggleSection('medical_conditions')}
              status={getSectionStatus('medical_conditions')}
              aiNotes={(subject.medical_conditions as Record<string, unknown>).ai_notes as string}
            >
              {/* Clinical Logic Rules Info Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-300">
                    <p className="font-medium text-amber-400 mb-2">ACS/MI/Angina Cascading Logic:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li><strong>NSTEMI (Type I or II)</strong>: Auto-sets MI = Yes, Angina = Yes (Unstable), ACS = Yes</li>
                      <li><strong>STEMI</strong>: Auto-sets MI = Yes, ACS = Yes</li>
                      <li><strong>Unstable Angina</strong>: Auto-sets Angina = Yes, ACS = Yes</li>
                      <li><strong>Stable Angina</strong>: Sets Angina = Yes, but ACS = No (stable angina is NOT ACS)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ACS/MI/Angina Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  Acute Coronary Events
                </h4>
                <div className="space-y-3">
                  <MedicalConditionRow
                    label="ACS (Acute Coronary Syndrome)"
                    conditionKey="acs"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).acs}
                    onChange={(field, value) => updateMedicalCondition('acs', field, value)}
                    typeOptions={[
                      { value: 'STEMI', label: 'STEMI' },
                      { value: 'NSTEMI Type I', label: 'NSTEMI Type I (Atherothrombotic)' },
                      { value: 'NSTEMI Type II', label: 'NSTEMI Type II (Supply-Demand Mismatch)' },
                      { value: 'Unstable Angina', label: 'Unstable Angina' },
                    ]}
                    hint="End date = Cath date"
                  />
                  <MedicalConditionRow
                    label="MI (Myocardial Infarction)"
                    conditionKey="mi"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).mi}
                    onChange={(field, value) => updateMedicalCondition('mi', field, value)}
                    typeOptions={[
                      { value: 'STEMI', label: 'STEMI' },
                      { value: 'NSTEMI Type I', label: 'NSTEMI Type I (Atherothrombotic)' },
                      { value: 'NSTEMI Type II', label: 'NSTEMI Type II (Supply-Demand Mismatch)' },
                    ]}
                    hint="End date = Cath date"
                  />
                  <MedicalConditionRow
                    label="Angina"
                    conditionKey="angina"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).angina}
                    onChange={(field, value) => updateMedicalCondition('angina', field, value)}
                    typeOptions={[
                      { value: 'Stable', label: 'Stable' },
                      { value: 'Unstable', label: 'Unstable' },
                    ]}
                    hint="End date = Cath date"
                  />
                </div>
              </div>

              {/* Cardiac Conditions */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Cardiac Conditions (Chronic)
                </h4>
                <div className="space-y-3">
                  <MedicalConditionRow
                    label="CAD (Coronary Artery Disease)"
                    conditionKey="cad"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).cad}
                    onChange={(field, value) => updateMedicalCondition('cad', field, value)}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="CHF (Congestive Heart Failure)"
                    conditionKey="chf"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).chf}
                    onChange={(field, value) => updateMedicalCondition('chf', field, value)}
                    typeOptions={[
                      { value: 'HFrEF', label: 'HFrEF (Reduced EF)' },
                      { value: 'HFpEF', label: 'HFpEF (Preserved EF)' },
                      { value: 'HFmrEF', label: 'HFmrEF (Mid-range EF)' },
                    ]}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="LVH (Left Ventricular Hypertrophy)"
                    conditionKey="lvh"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).lvh}
                    onChange={(field, value) => updateMedicalCondition('lvh', field, value)}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="Valvular Disease"
                    conditionKey="valvular_disease"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).valvular_disease}
                    onChange={(field, value) => updateMedicalCondition('valvular_disease', field, value)}
                    isChronicCondition
                    hint="Specify valve & severity in details"
                  />
                  <MedicalConditionRow
                    label="Pulmonary Hypertension"
                    conditionKey="pulmonary_hypertension"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).pulmonary_hypertension}
                    onChange={(field, value) => updateMedicalCondition('pulmonary_hypertension', field, value)}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="Cardiomyopathy"
                    conditionKey="cardiomyopathy"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).cardiomyopathy}
                    onChange={(field, value) => updateMedicalCondition('cardiomyopathy', field, value)}
                    typeOptions={[
                      { value: 'Dilated', label: 'Dilated' },
                      { value: 'Hypertrophic', label: 'Hypertrophic' },
                      { value: 'Restrictive', label: 'Restrictive' },
                      { value: 'Ischemic', label: 'Ischemic' },
                    ]}
                    isChronicCondition
                  />
                </div>
              </div>

              {/* Systemic Conditions */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Systemic Conditions (Chronic)
                </h4>
                <div className="space-y-3">
                  <MedicalConditionRow
                    label="Hypertension"
                    conditionKey="hypertension"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).hypertension}
                    onChange={(field, value) => updateMedicalCondition('hypertension', field, value)}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="Hyperlipidemia"
                    conditionKey="hyperlipidemia"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).hyperlipidemia}
                    onChange={(field, value) => updateMedicalCondition('hyperlipidemia', field, value)}
                    isChronicCondition
                  />
                  <MedicalConditionRow
                    label="Diabetes"
                    conditionKey="diabetes"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).diabetes}
                    onChange={(field, value) => updateMedicalCondition('diabetes', field, value)}
                    typeOptions={[
                      { value: 'Type 1', label: 'Type 1' },
                      { value: 'Type 2', label: 'Type 2' },
                    ]}
                    isChronicCondition
                    hint="Include A1c in notes if available"
                  />
                  <MedicalConditionRow
                    label="CKD (Chronic Kidney Disease)"
                    conditionKey="ckd"
                    condition={(subject.medical_conditions as Record<string, MedicalConditionData>).ckd}
                    onChange={(field, value) => updateMedicalCondition('ckd', field, value)}
                    typeOptions={[
                      { value: 'Stage 1', label: 'Stage 1 (GFR ≥90)' },
                      { value: 'Stage 2', label: 'Stage 2 (GFR 60-89)' },
                      { value: 'Stage 3a', label: 'Stage 3a (GFR 45-59)' },
                      { value: 'Stage 3b', label: 'Stage 3b (GFR 30-44)' },
                      { value: 'Stage 4', label: 'Stage 4 (GFR 15-29)' },
                      { value: 'Stage 5', label: 'Stage 5 (GFR <15)' },
                    ]}
                    isChronicCondition
                    hint="Include GFR in notes if available"
                  />
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
              title="Cardiac Medications Log"
              icon={FileText}
              expanded={expandedSections.medications_log}
              onToggle={() => toggleSection('medications_log')}
              status={subject.medications_log.medications.length > 0 ? 'ai_filled' : 'incomplete'}
              aiNotes={subject.medications_log.ai_notes}
            >
              <p className="text-sm text-slate-400 mb-4">
                {subject.medications_log.medications.length} cardiac medication(s) recorded
              </p>

              {/* Classification legend */}
              {subject.medications_log.medications.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    <span className="text-xs text-slate-400">Home Med (Prior to Hospital)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                    <span className="text-xs text-slate-400">Hospital Only</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-xs text-slate-400">Hospital to Home</span>
                  </div>
                </div>
              )}

              {/* Home Medications */}
              {subject.medications_log.medications.filter(med => (med as Record<string, unknown>).classification === 'Home Med' || !(med as Record<string, unknown>).classification).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Home Medications (Prior to Hospitalization)
                  </h4>
                  {subject.medications_log.medications.map((med, index) => {
                    const classification = (med as Record<string, unknown>).classification as string;
                    if (classification && classification !== 'Home Med') return null;
                    return (
                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2 border-l-2 border-blue-400/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-100 font-medium">
                              {(med as Record<string, unknown>).medication_name as string}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Home Med
                            </span>
                          </div>
                          <select
                            value={classification || 'Home Med'}
                            onChange={(e) => {
                              const updatedMeds = [...subject.medications_log.medications];
                              updatedMeds[index] = { ...med, classification: e.target.value };
                              updateSubjectField('medications_log', { ...subject.medications_log, medications: updatedMeds });
                            }}
                            className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:border-amber-500 outline-none"
                          >
                            <option value="Home Med">Home Med</option>
                            <option value="Hospital Only">Hospital Only</option>
                            <option value="Hospital to Home">Hospital to Home</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                          <div>
                            <span className="text-sm text-slate-400">Started:</span>
                            <span className={`ml-2 ${(med as Record<string, unknown>).start_date ? 'text-slate-100' : 'text-amber-400 italic'}`}>
                              {(med as Record<string, unknown>).start_date as string || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
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
                    );
                  })}
                </div>
              )}

              {/* Hospital Only Medications */}
              {subject.medications_log.medications.filter(med => (med as Record<string, unknown>).classification === 'Hospital Only').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    Hospital Only Medications
                  </h4>
                  {subject.medications_log.medications.map((med, index) => {
                    if ((med as Record<string, unknown>).classification !== 'Hospital Only') return null;
                    return (
                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2 border-l-2 border-orange-400/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-100 font-medium">
                              {(med as Record<string, unknown>).medication_name as string}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              Hospital Only
                            </span>
                          </div>
                          <select
                            value={(med as Record<string, unknown>).classification as string}
                            onChange={(e) => {
                              const updatedMeds = [...subject.medications_log.medications];
                              updatedMeds[index] = { ...med, classification: e.target.value };
                              updateSubjectField('medications_log', { ...subject.medications_log, medications: updatedMeds });
                            }}
                            className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:border-amber-500 outline-none"
                          >
                            <option value="Home Med">Home Med</option>
                            <option value="Hospital Only">Hospital Only</option>
                            <option value="Hospital to Home">Hospital to Home</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                          <div>
                            <span className="text-sm text-slate-400">Route:</span>
                            <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).route as string}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
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
                            <span className="text-sm text-slate-400">Frequency:</span>
                            <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).frequency as string}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hospital to Home Medications */}
              {subject.medications_log.medications.filter(med => (med as Record<string, unknown>).classification === 'Hospital to Home').length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Started in Hospital, Continued at Home
                  </h4>
                  {subject.medications_log.medications.map((med, index) => {
                    if ((med as Record<string, unknown>).classification !== 'Hospital to Home') return null;
                    return (
                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg mb-2 border-l-2 border-emerald-400/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-100 font-medium">
                              {(med as Record<string, unknown>).medication_name as string}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Hospital to Home
                            </span>
                          </div>
                          <select
                            value={(med as Record<string, unknown>).classification as string}
                            onChange={(e) => {
                              const updatedMeds = [...subject.medications_log.medications];
                              updatedMeds[index] = { ...med, classification: e.target.value };
                              updateSubjectField('medications_log', { ...subject.medications_log, medications: updatedMeds });
                            }}
                            className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:border-amber-500 outline-none"
                          >
                            <option value="Home Med">Home Med</option>
                            <option value="Hospital Only">Hospital Only</option>
                            <option value="Hospital to Home">Hospital to Home</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                          <div>
                            <span className="text-sm text-slate-400">Route:</span>
                            <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).route as string}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
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
                            <span className="text-sm text-slate-400">Frequency:</span>
                            <span className="ml-2 text-slate-100">{(med as Record<string, unknown>).frequency as string}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subject.medications_log.medications.length === 0 && (
                <p className="text-slate-500 italic">No cardiac medications recorded</p>
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
