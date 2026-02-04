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
    "acs": {"present": "Yes" or "No", "type_details": "STEMI" or "NSTEMI Type I" or "NSTEMI Type II" or "Unstable Angina" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "DD-MMM-YY" or "Ongoing" or null, "notes": ""},
    "mi": {"present": "Yes" or "No", "type_details": "STEMI" or "NSTEMI Type I" or "NSTEMI Type II" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "DD-MMM-YY" or null, "notes": ""},
    "angina": {"present": "Yes" or "No", "type_details": "Stable" or "Unstable" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "DD-MMM-YY" or null, "notes": ""},
    "lvh": {"present": "Yes" or "No", "type_details": null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "valvular_disease": {"present": "Yes" or "No", "type_details": "specify valve and severity", "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "chf": {"present": "Yes" or "No", "type_details": "HFrEF" or "HFpEF" or "HFmrEF" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": "include EF if available"},
    "pulmonary_hypertension": {"present": "Yes" or "No", "type_details": null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "cardiomyopathy": {"present": "Yes" or "No", "type_details": "Dilated" or "Hypertrophic" or "Restrictive" or "Ischemic" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "diabetes": {"present": "Yes" or "No", "type_details": "Type 1" or "Type 2" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": "A1c if available"},
    "ckd": {"present": "Yes" or "No", "type_details": "Stage 1" or "Stage 2" or "Stage 3a" or "Stage 3b" or "Stage 4" or "Stage 5" or null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": "GFR if available"},
    "cad": {"present": "Yes" or "No", "type_details": "vessels involved", "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "hypertension": {"present": "Yes" or "No", "type_details": null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "hyperlipidemia": {"present": "Yes" or "No", "type_details": null, "onset_date": "DD-MMM-YY" or null, "end_date": "Ongoing", "notes": ""},
    "ai_notes": "Any additional conditions or notes"
  },

  IMPORTANT MEDICAL CONDITIONS INSTRUCTIONS - ACS/MI/ANGINA CASCADING LOGIC:
  ACS (Acute Coronary Syndrome), MI (Myocardial Infarction), and Angina are THREE SEPARATE conditions that must be filled out according to these rules:

  1. If patient has NSTEMI (Type I or Type II):
     - MI: present = "Yes", type_details = "NSTEMI Type I" or "NSTEMI Type II"
     - Angina: present = "Yes", type_details = "Unstable"
     - ACS: present = "Yes", type_details = same as MI type

  2. If patient has STEMI:
     - MI: present = "Yes", type_details = "STEMI"
     - ACS: present = "Yes", type_details = "STEMI"
     - Angina: may or may not be present (assess independently)

  3. If patient has Unstable Angina (without MI):
     - Angina: present = "Yes", type_details = "Unstable"
     - ACS: present = "Yes", type_details = "Unstable Angina"
     - MI: present = "No"

  4. If patient has Stable Angina:
     - Angina: present = "Yes", type_details = "Stable"
     - ACS: present = "No" (stable angina is NOT ACS)
     - MI: present = "No" (unless separate MI event)

  5. ACS ONLY includes: STEMI, NSTEMI Type I, NSTEMI Type II, and Unstable Angina. Stable angina is NOT ACS.

  IMPORTANT END DATE RULES:
  - Chronic conditions (hypertension, hyperlipidemia, diabetes, CKD, LVH, valvular disease, CHF, pulmonary hypertension, cardiomyopathy, CAD): end_date = "Ongoing" (always)
  - For MI, Angina, and ACS: end_date = the date of cardiac catheterization (cath date) from the catheterization procedure. If no cath date available, use "Ongoing"
  - NSTEMI Type I = atherothrombotic event (plaque rupture/erosion)
  - NSTEMI Type II = supply-demand mismatch (secondary to another condition)

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
        "indication": "why prescribed",
        "classification": "Home Med" or "Hospital Only" or "Hospital to Home",
        "start_date": "DD-MMM-YY" or null (earliest date found across all notes for when this medication was first prescribed),
        "end_date": "DD-MMM-YY" or "Ongoing" (if the patient is still taking this medication, use "Ongoing"; otherwise use the date it was discontinued),
        "route": "Oral/IV/Subcutaneous/Topical/etc" (use full word, e.g. "Oral" instead of "PO"),
        "frequency": "Once daily/Twice daily/Three times daily/Four times daily/As needed/other" (use plain language instead of medical abbreviations like qd/bid/tid)
      }
    ],
    "ai_notes": "Cardiac medication summary"
  },

  IMPORTANT MEDICATIONS INSTRUCTIONS:
  - ONLY include medications related to heart disease or heart problems (cardiac medications)
  - This includes but is not limited to: antiplatelets (aspirin, clopidogrel, ticagrelor, prasugrel), anticoagulants (warfarin, heparin, enoxaparin, apixaban, rivaroxaban), beta-blockers (metoprolol, atenolol, carvedilol), ACE inhibitors (lisinopril, enalapril, ramipril), ARBs (losartan, valsartan, irbesartan), statins (atorvastatin, rosuvastatin, simvastatin), nitrates (nitroglycerin, isosorbide), calcium channel blockers (amlodipine, diltiazem, verapamil), antiarrhythmics (amiodarone, flecainide, sotalol), diuretics for heart failure (furosemide, spironolactone, bumetanide), cardiac glycosides (digoxin), PCSK9 inhibitors, ezetimibe, ranolazine, hydralazine, sacubitril/valsartan (Entresto), ivabradine, dapagliflozin/empagliflozin (when used for heart failure)
  - Do NOT include medications for non-cardiac conditions (e.g., metformin for diabetes alone, PPIs, antibiotics, pain medications, psychiatric medications, etc.) unless they have a clear cardiac indication

  MEDICATION CLASSIFICATION INSTRUCTIONS:
  - Each medication MUST have a "classification" field with one of three values:
    1. "Home Med" - Medication the patient was already taking at home PRIOR to this hospitalization. These are medications on the patient's home medication list or medications documented as being taken before admission. For these medications, the start_date should reflect when the patient originally started the medication; if no start date is available, use null (it will display as "Unknown").
    2. "Hospital Only" - Medication that was ONLY given during the hospital stay and will NOT be continued at discharge. Examples: IV heparin drip, IV nitroglycerin, IV vasopressors, loading doses given only in hospital, medications discontinued before discharge.
    3. "Hospital to Home" - Medication that was newly started during this hospitalization and the patient will CONTINUE taking at home after discharge. These are new prescriptions initiated during the admission that appear on the discharge medication list.
  - Use clinical context clues to determine classification:
    - Home medication lists, "prior to admission" notes, and preadmission medication reconciliation indicate "Home Med"
    - IV medications, one-time doses, and medications not on discharge list indicate "Hospital Only"
    - New prescriptions during admission that appear on discharge medication list indicate "Hospital to Home"
    - If a medication was a home med AND continued through hospitalization, classify as "Home Med"
    - If classification is truly unclear, default to "Home Med" for oral medications and "Hospital Only" for IV medications

  - For start_date: Look through ALL patient notes to find the earliest date this medication was prescribed or mentioned as being started
  - For end_date: If the medication appears in the current/active medication list, use "Ongoing". If it was discontinued, use the discontinuation date. If unclear, use "Ongoing"
  - For route: Use plain language (e.g., "Oral" not "PO", "Intravenous" not "IV")
  - For frequency: Use plain language (e.g., "Twice daily" not "BID", "Once daily" not "QD")

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
