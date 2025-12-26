import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MASTER_INTERPRETATION_PROMPT = `
You are a clinical research data extraction specialist. Your task is to analyze raw clinical data from Epic EMR and extract information to complete MCG Study Protocol SB-ACS-005 forms.

CRITICAL RULES:
1. Only extract information that is EXPLICITLY stated in the data
2. If information is not present, use null (do not guess)
3. For Yes/No questions, determine the answer from clinical evidence
4. Use exact values for measurements and lab results
5. Convert dates to DD-MMM-YY format (e.g., 15-Dec-24)
6. Convert times to HH:MM 24-hour format
7. Flag any uncertain interpretations in the "ai_notes" field
8. PHI Protection: Never include MRN, SSN, full names, or addresses

INPUT DATA:
{epic_data}

SUBJECT INFO:
- Site Code: {site_code}
- Subject Number: {subject_number}

Analyze the clinical data and return a JSON object with the following structure. For each field, extract the appropriate value or use null if not found.

{
  "subject_info": {
    "site_code": "{site_code}",
    "subject_number": "{subject_number}"
  },

  "prescreening_consent": {
    "icf_signed": "Yes" or "No" or null,
    "consent_date": "DD-MMM-YY" or null,
    "consent_time": "HH:MM" or null,
    "ai_notes": "Any notes about consent documentation"
  },

  "demographics": {
    "date_of_birth": "DD-MMM-YY" or null,
    "gender": "Male" or "Female" or "Other" or null,
    "ethnicity": "Hispanic or Latino" or "Not Hispanic or Latino" or "Unknown" or null,
    "race": "White" or "Black or African American" or "Asian" or "American Indian or Alaska Native" or "Native Hawaiian or Other Pacific Islander" or "Other" or "Unknown" or null,
    "ai_notes": "Any notes about demographics"
  },

  "measurements": {
    "height_inches": number or null,
    "weight_lbs": number or null,
    "chest_circumference_cm": number or null,
    "systolic_bp": number or null,
    "diastolic_bp": number or null,
    "pulse_bpm": number or null,
    "temperature_f": number or null,
    "o2_saturation": number or null,
    "measurement_date": "DD-MMM-YY" or null,
    "measurement_time": "HH:MM" or null,
    "ai_notes": "Any notes about measurements"
  },

  "inclusion_criteria": {
    "age_18_or_older": "Yes" or "No" (calculate from DOB if available),
    "scheduled_for_angiography": "Yes" or "No" (look for cath lab scheduling, procedure orders),
    "able_to_comply": "Yes" or "No" or null,
    "written_consent": "Yes" or "No" (look for consent documentation),
    "female_negative_pregnancy": "Yes" or "No" or "N/A" (N/A for males, check pregnancy test for females),
    "ai_notes": "Reasoning for each determination"
  },

  "exclusion_criteria": {
    "present_stemi": "Yes" or "No" (look for STEMI diagnosis, ST elevation on ECG),
    "pregnant_or_lactating": "Yes" or "No" (check pregnancy status, obstetric history),
    "active_afib": "Yes" or "No" (current AFib on ECG or telemetry),
    "thoracic_implants": "Yes" or "No" (pacemaker, ICD, loop recorder in chest),
    "external_devices": "Yes" or "No" (insulin pump, external monitors on chest),
    "inability_supine": "Yes" or "No" (orthopnea, CHF symptoms preventing lying flat),
    "poor_followup_access": "Yes" or "No" or null,
    "other_exclusion": "Yes" or "No" or null,
    "other_exclusion_specify": "text if other=Yes" or "",
    "ai_notes": "Reasoning for each determination"
  },

  "medical_history": {
    "implanted_devices": "Yes" or "No",
    "implanted_devices_specify": "list devices" or "",
    "smoking_status": "Current" or "Former" or "Never" or "Unknown",
    "smoking_packs_per_day": number or null,
    "smoking_years": number or null,
    "alcohol_use": "Current" or "Former" or "Never" or "Unknown",
    "alcohol_drinks_per_week": number or null,
    "sleep_apnea": "Yes" or "No",
    "sleep_apnea_treatment": "CPAP/BiPAP/etc" or "",
    "family_cardiac_history": "Yes" or "No",
    "family_cardiac_specify": "details" or "",
    "covid_history": "Yes" or "No",
    "covid_date": "DD-MMM-YY" or null,
    "insurance_type": "Medicare/Medicaid/Commercial/etc" or "",
    "ai_notes": "Any notes"
  },

  "medical_conditions": {
    "mi_history": {"present": "Yes" or "No", "diagnosis_date": "DD-MMM-YY or null", "notes": ""},
    "lvh": {"present": "Yes" or "No", "diagnosis_date": null, "notes": ""},
    "valvular_disease": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "specify valve and severity"},
    "chf": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "include EF if available"},
    "pulmonary_hypertension": {"present": "Yes" or "No", "diagnosis_date": null, "notes": ""},
    "angina": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "stable/unstable"},
    "cardiomyopathy": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "type"},
    "diabetes": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "Type 1/2, A1c if available"},
    "ckd": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "stage, GFR if available"},
    "cad": {"present": "Yes" or "No", "diagnosis_date": null, "notes": "vessels involved"},
    "hypertension": {"present": "Yes" or "No", "diagnosis_date": null, "notes": ""},
    "hyperlipidemia": {"present": "Yes" or "No", "diagnosis_date": null, "notes": ""},
    "ai_notes": "Any additional conditions or notes"
  },

  "arrhythmia_history": {
    "afib_aflutter": "Yes" or "No",
    "afib_type": "Paroxysmal" or "Persistent" or "Permanent" or "",
    "bradycardia": "Yes" or "No",
    "svt": "Yes" or "No",
    "vt": "Yes" or "No",
    "heart_block": "Yes" or "No",
    "heart_block_degree": "1st/2nd Type I/2nd Type II/3rd" or "",
    "long_qt": "Yes" or "No",
    "pacs_pvcs": "Yes" or "No",
    "psvt": "Yes" or "No",
    "other_arrhythmia": "Yes" or "No",
    "other_arrhythmia_specify": "" or "details",
    "ai_notes": "Any notes"
  },

  "acs_risk": {
    "risk_arm": "Low" or "Medium" or "High" (determine based on criteria below),
    "stable_angina": "Yes" or "No" (for Low risk),
    "nstemi_no_high_risk": "Yes" or "No" (for Medium risk),
    "recurrent_angina": "Yes" or "No",
    "dynamic_st_changes": "Yes" or "No",
    "elevated_troponin": "Yes" or "No",
    "hemodynamic_instability": "Yes" or "No",
    "sustained_vt": "Yes" or "No",
    "recent_pci": "Yes" or "No" (within 6 months),
    "prior_cabg": "Yes" or "No",
    "high_grace_score": "Yes" or "No" (>140),
    "lvef_under_40": "Yes" or "No",
    "ai_notes": "Reasoning for risk arm assignment"
  },

  "troponin_log": {
    "results": [
      {
        "collection_datetime": "DD-MMM-YY HH:MM",
        "value_ng_l": number,
        "above_reference": "Yes" or "No" (Males >20, Females >15)
      }
    ],
    "ai_notes": "Pattern interpretation (rising, falling, stable)"
  },

  "ecg_log": {
    "results": [
      {
        "datetime": "DD-MMM-YY HH:MM",
        "rhythm": "Sinus/AFib/etc",
        "st_segment_changes": "description or None",
        "clinically_significant": "Yes" or "No",
        "interpretation": "full interpretation text"
      }
    ],
    "ai_notes": "ECG pattern summary"
  },

  "medications_log": {
    "medications": [
      {
        "medication_name": "Drug name",
        "dose": "amount",
        "unit": "mg/mcg/etc",
        "frequency": "qd/bid/tid/qid/prn/other",
        "route": "PO/IV/etc",
        "indication": "why prescribed",
        "start_date": "DD-MMM-YY" or null
      }
    ],
    "ai_notes": "Medication summary"
  },

  "catheterization": {
    "procedure_date": "DD-MMM-YY" or null,
    "procedure_start_time": "HH:MM" or null,
    "procedure_end_time": "HH:MM" or null,
    "admission_source": "Outpatient/ED/Inpatient/Transfer",
    "primary_diagnosis": "diagnosis text",
    "procedure_indication": "indication text",
    "anesthesia_type": "Local/MAC/General",
    "access_site": "Radial/Femoral/Other",
    "pci_performed": "Yes" or "No",
    "vessels_treated": ["LAD", "RCA", etc] or [],
    "culprit_vessel": "vessel name" or "",
    "coronary_dominance": "Right/Left/Co-dominant",
    "total_stents_placed": number,
    "complications": "description" or "",
    "ai_notes": "Cath summary and key findings"
  },

  "followup_30day": {
    "followup_date": "DD-MMM-YY" or null,
    "er_visit": "Yes" or "No" or null,
    "hospitalization": "Yes" or "No" or null,
    "new_mi": "Yes" or "No" or null,
    "new_revascularization": "Yes" or "No" or null,
    "new_arrhythmia": "Yes" or "No" or null,
    "new_chf": "Yes" or "No" or null,
    "stroke_tia": "Yes" or "No" or null,
    "death": "Yes" or "No" or null,
    "ai_notes": "Follow-up summary"
  }
}

RISK ARM DETERMINATION LOGIC:
- LOW: Stable angina, no NSTEMI, no ACS
- MEDIUM: NSTEMI WITHOUT any high-risk features
- HIGH: NSTEMI WITH ANY of: recurrent angina, dynamic ST changes, rising troponin, hemodynamic instability, sustained VT, recent PCI (<6mo), prior CABG, GRACE score >140, LVEF <40%

Return ONLY the JSON object, no additional text or markdown formatting.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { epic_data, site_code, subject_number } = body;

    if (!epic_data) {
      return NextResponse.json(
        { success: false, error: 'No Epic data provided' },
        { status: 400 }
      );
    }

    const prompt = MASTER_INTERPRETATION_PROMPT
      .replace(/{epic_data}/g, epic_data)
      .replace(/{site_code}/g, site_code || 'SITE')
      .replace(/{subject_number}/g, subject_number || '000');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Clean up response - remove markdown code blocks if present
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      responseText = responseText.split('```')[1].split('```')[0];
    }

    try {
      const structuredData = JSON.parse(responseText.trim());
      return NextResponse.json({
        success: true,
        data: structuredData,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      });
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI response as JSON',
          raw_response: responseText.substring(0, 1000),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
