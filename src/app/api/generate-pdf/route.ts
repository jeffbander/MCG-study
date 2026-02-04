import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

// Helper function to draw a simple table manually
function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  data: string[][],
  colWidths: number[]
): number {
  const startX = 20;
  const rowHeight = 8;
  const fontSize = 8;
  let y = startY;

  // Draw header
  doc.setFillColor(100, 100, 100);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');

  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(x, y, colWidths[i], rowHeight, 'F');
    doc.text(headers[i], x + 2, y + 5.5);
    x += colWidths[i];
  }
  y += rowHeight;

  // Draw data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  for (const row of data) {
    x = startX;
    for (let i = 0; i < row.length; i++) {
      doc.rect(x, y, colWidths[i], rowHeight, 'S');
      const cellText = String(row[i] || '').substring(0, 25); // Truncate long text
      doc.text(cellText, x + 2, y + 5.5);
      x += colWidths[i];
    }
    y += rowHeight;
  }

  return y;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '___________';
  return dateStr;
}

function formatYesNo(value: string | null): string {
  if (value === 'Yes') return '[X] Yes  [ ] No';
  if (value === 'No') return '[ ] Yes  [X] No';
  return '[ ] Yes  [ ] No';
}

function generatePrescreeningConsent(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  // Site and Subject
  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  // Form Title
  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('PRE-SCREENING INFORMED CONSENT', 105, 51, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let y = 65;
  doc.text('DOCUMENTATION OF SUBJECT INFORMED CONSENT:', 20, y);
  y += 10;

  const consent = data.prescreening_consent as Record<string, unknown> || {};

  doc.text(`ICF Signed: ${formatYesNo(consent.icf_signed as string | null)}`, 25, y);
  y += 8;
  doc.text(`Consent Date: ${formatDate(consent.consent_date as string | null)}`, 25, y);
  y += 8;
  doc.text(`Consent Time: ${formatDate(consent.consent_time as string | null)}`, 25, y);
  y += 15;

  // Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (consent.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  // Footer
  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateBaselineScreening(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('BASELINE SCREENING / ELIGIBILITY', 105, 51, { align: 'center' });

  let y = 65;

  // Inclusion Criteria
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INCLUSION CRITERIA (All must be YES):', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const inclusion = data.inclusion_criteria as Record<string, unknown> || {};

  const inclusionItems = [
    { key: 'age_18_or_older', label: 'Age >= 18 years' },
    { key: 'scheduled_for_angiography', label: 'Scheduled for coronary angiography' },
    { key: 'able_to_comply', label: 'Able to comply with study procedures' },
    { key: 'written_consent', label: 'Written informed consent' },
    { key: 'female_negative_pregnancy', label: 'Female: Negative pregnancy test (N/A for males)' },
  ];

  for (const item of inclusionItems) {
    doc.text(`${item.label}: ${formatYesNo(inclusion[item.key] as string | null)}`, 25, y);
    y += 7;
  }

  y += 5;

  // Exclusion Criteria
  doc.setFont('helvetica', 'bold');
  doc.text('EXCLUSION CRITERIA (All must be NO):', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const exclusion = data.exclusion_criteria as Record<string, unknown> || {};

  const exclusionItems = [
    { key: 'present_stemi', label: 'Present STEMI' },
    { key: 'pregnant_or_lactating', label: 'Pregnant or lactating' },
    { key: 'active_afib', label: 'Active atrial fibrillation' },
    { key: 'thoracic_implants', label: 'Thoracic implants (PM/ICD)' },
    { key: 'external_devices', label: 'External devices on chest' },
    { key: 'inability_supine', label: 'Inability to lie supine' },
    { key: 'poor_followup_access', label: 'Poor follow-up access' },
  ];

  for (const item of exclusionItems) {
    doc.text(`${item.label}: ${formatYesNo(exclusion[item.key] as string | null)}`, 25, y);
    y += 7;
  }

  // AI Notes
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const incNotes = (inclusion.ai_notes as string) || '';
  const excNotes = (exclusion.ai_notes as string) || '';
  const notes = `Inclusion: ${incNotes}\nExclusion: ${excNotes}`;
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateMedicalHistory(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('MEDICAL HISTORY', 105, 51, { align: 'center' });

  let y = 65;

  // Demographics
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DEMOGRAPHICS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const demo = data.demographics as Record<string, unknown> || {};
  doc.text(`Date of Birth: ${formatDate(demo.date_of_birth as string | null)}`, 25, y); y += 7;
  doc.text(`Gender: ${demo.gender || '___________'}`, 25, y); y += 7;
  doc.text(`Ethnicity: ${demo.ethnicity || '___________'}`, 25, y); y += 7;
  doc.text(`Race: ${demo.race || '___________'}`, 25, y); y += 12;

  // Measurements
  doc.setFont('helvetica', 'bold');
  doc.text('MEASUREMENTS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const meas = data.measurements as Record<string, unknown> || {};
  doc.text(`Height: ${meas.height_inches || '___'} inches`, 25, y);
  doc.text(`Weight: ${meas.weight_lbs || '___'} lbs`, 90, y); y += 7;
  doc.text(`BP: ${meas.systolic_bp || '___'}/${meas.diastolic_bp || '___'} mmHg`, 25, y);
  doc.text(`Pulse: ${meas.pulse_bpm || '___'} bpm`, 90, y); y += 7;
  doc.text(`O2 Sat: ${meas.o2_saturation || '___'}%`, 25, y);
  doc.text(`Temp: ${meas.temperature_f || '___'} F`, 90, y); y += 12;

  // Medical Conditions
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL CONDITIONS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const conditions = data.medical_conditions as Record<string, unknown> || {};

  // ACS/MI/Angina Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Acute Coronary Events:', 25, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const acuteConditions = [
    { key: 'acs', label: 'ACS' },
    { key: 'mi', label: 'MI' },
    { key: 'angina', label: 'Angina' },
  ];

  for (const cond of acuteConditions) {
    const condData = conditions[cond.key] as Record<string, unknown> || {};
    let line = `${cond.label}: ${formatYesNo(condData.present as string | null)}`;
    if (condData.type_details) line += ` (${condData.type_details})`;
    doc.text(line, 30, y);
    if (condData.onset_date || condData.end_date) {
      doc.text(`Onset: ${condData.onset_date || '___'} | End: ${condData.end_date || '___'}`, 110, y);
    }
    y += 5;
  }

  y += 3;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Cardiac Conditions (Chronic):', 25, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const cardiacConditions = [
    { key: 'cad', label: 'CAD' },
    { key: 'chf', label: 'CHF' },
    { key: 'lvh', label: 'LVH' },
    { key: 'valvular_disease', label: 'Valvular Disease' },
    { key: 'pulmonary_hypertension', label: 'Pulmonary HTN' },
    { key: 'cardiomyopathy', label: 'Cardiomyopathy' },
  ];

  for (const cond of cardiacConditions) {
    const condData = conditions[cond.key] as Record<string, unknown> || {};
    let line = `${cond.label}: ${formatYesNo(condData.present as string | null)}`;
    if (condData.type_details) line += ` (${condData.type_details})`;
    doc.text(line, 30, y);
    if (condData.onset_date) {
      doc.text(`Onset: ${condData.onset_date}`, 130, y);
    }
    y += 5;
  }

  y += 3;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Systemic Conditions (Chronic):', 25, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const systemicConditions = [
    { key: 'hypertension', label: 'Hypertension' },
    { key: 'hyperlipidemia', label: 'Hyperlipidemia' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'ckd', label: 'CKD' },
  ];

  for (const cond of systemicConditions) {
    const condData = conditions[cond.key] as Record<string, unknown> || {};
    let line = `${cond.label}: ${formatYesNo(condData.present as string | null)}`;
    if (condData.type_details) line += ` (${condData.type_details})`;
    if (condData.notes) line += ` - ${condData.notes}`;
    doc.text(line, 30, y);
    y += 5;
  }

  doc.setFontSize(10);

  // ACS Risk
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('ACS RISK STRATIFICATION:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const risk = data.acs_risk as Record<string, unknown> || {};
  doc.text(`Risk Arm: ${risk.risk_arm || '___________'}`, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateTroponinLog(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('TROPONIN LOG', 105, 51, { align: 'center' });

  const tropLog = data.troponin_log as Record<string, unknown> || {};
  const results = (tropLog.results as Array<Record<string, unknown>>) || [];

  if (results.length > 0) {
    const tableData = results.map((r, i) => [
      String(i + 1),
      String(r.collection_datetime || ''),
      String(r.value_ng_l || ''),
      String(r.above_reference || ''),
    ]);

    drawTable(
      doc,
      60,
      ['#', 'Date/Time', 'Value (ng/L)', 'Above Ref'],
      tableData,
      [15, 60, 50, 45]
    );
  } else {
    doc.setFontSize(10);
    doc.text('No troponin results recorded.', 25, 70);
  }

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateMedicationsLog(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('CARDIAC MEDICATIONS LOG', 105, 51, { align: 'center' });

  const medLog = data.medications_log as Record<string, unknown> || {};
  const medications = (medLog.medications as Array<Record<string, unknown>>) || [];

  if (medications.length > 0) {
    const tableData = medications.map((m) => [
      String(m.medication_name || ''),
      `${m.dose || ''} ${m.unit || ''}`.trim(),
      String(m.start_date || 'Unknown'),
      String(m.end_date || 'Unknown'),
      String(m.route || ''),
      String(m.frequency || ''),
    ]);

    drawTable(
      doc,
      60,
      ['Medication', 'Dose', 'Start', 'End', 'Route', 'Freq'],
      tableData,
      [30, 25, 25, 25, 30, 35]
    );
  } else {
    doc.setFontSize(10);
    doc.text('No cardiac medications recorded.', 25, 70);
  }

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateECGLog(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('ECG LOG', 105, 51, { align: 'center' });

  const ecgLog = data.ecg_log as Record<string, unknown> || {};
  const results = (ecgLog.results as Array<Record<string, unknown>>) || [];

  if (results.length > 0) {
    const tableData = results.map((r, i) => [
      String(i + 1),
      String(r.datetime || ''),
      String(r.rhythm || ''),
      String(r.st_segment_changes || 'None'),
      String(r.clinically_significant || ''),
    ]);

    drawTable(
      doc,
      60,
      ['#', 'Date/Time', 'Rhythm', 'ST Changes', 'Significant'],
      tableData,
      [15, 45, 40, 45, 25]
    );
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No ECG results recorded.', 25, 70);
  }

  // AI Notes
  let y = results.length > 0 ? 70 + (results.length * 8) + 10 : 85;
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (ecgLog.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateCatheterization(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('CATHETERIZATION PROCEDURE', 105, 51, { align: 'center' });

  const cath = data.catheterization as Record<string, unknown> || {};
  let y = 65;

  // Procedure Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCEDURE DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Procedure Date: ${formatDate(cath.procedure_date as string | null)}`, 25, y); y += 7;
  doc.text(`Start Time: ${cath.procedure_start_time || '___:___'}`, 25, y);
  doc.text(`End Time: ${cath.procedure_end_time || '___:___'}`, 100, y); y += 7;
  doc.text(`Admission Source: ${cath.admission_source || '___________'}`, 25, y); y += 7;
  doc.text(`Primary Diagnosis: ${cath.primary_diagnosis || '___________'}`, 25, y); y += 7;
  doc.text(`Procedure Indication: ${cath.procedure_indication || '___________'}`, 25, y); y += 7;
  doc.text(`Anesthesia Type: ${cath.anesthesia_type || '___________'}`, 25, y); y += 7;
  doc.text(`Access Site: ${cath.access_site || '___________'}`, 25, y); y += 12;

  // Angiography Findings
  doc.setFont('helvetica', 'bold');
  doc.text('ANGIOGRAPHY FINDINGS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Coronary Dominance: ${cath.coronary_dominance || '___________'}`, 25, y); y += 7;
  doc.text(`Culprit Vessel: ${cath.culprit_vessel || '___________'}`, 25, y); y += 10;

  // Vessel findings table header
  doc.setFont('helvetica', 'bold');
  doc.text('Vessel Stenosis:', 25, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  const vessels = ['Left Main', 'LAD (Proximal)', 'LAD (Mid)', 'LAD (Distal)', 'LCx (Proximal)', 'LCx (OM1)', 'RCA (Proximal)', 'RCA (Mid)', 'RCA (Distal)'];
  for (const vessel of vessels) {
    doc.text(`${vessel}: ____% stenosis   TIMI Flow: ___`, 30, y);
    y += 6;
    if (y > 200) break;
  }

  y += 5;

  // PCI Details
  doc.setFont('helvetica', 'bold');
  doc.text('PCI DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`PCI Performed: ${formatYesNo(cath.pci_performed as string | null)}`, 25, y); y += 7;
  const vesselsTreated = (cath.vessels_treated as string[]) || [];
  doc.text(`Vessels Treated: ${vesselsTreated.length > 0 ? vesselsTreated.join(', ') : '___________'}`, 25, y); y += 7;
  doc.text(`Total Stents Placed: ${cath.total_stents_placed ?? '___'}`, 25, y); y += 7;
  doc.text(`Complications: ${cath.complications || 'None'}`, 25, y); y += 10;

  // AI Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (cath.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateStudyScan(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('MCG STUDY SCAN', 105, 51, { align: 'center' });

  const scan = data.study_scan as Record<string, unknown> || {};
  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN PROCEDURE:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Scan Date: ${formatDate(scan.scan_date as string | null)}`, 25, y); y += 7;
  doc.text(`Start Time: ${scan.scan_start_time || '___:___'}`, 25, y);
  doc.text(`End Time: ${scan.scan_end_time || '___:___'}`, 100, y); y += 7;
  doc.text(`Device ID: ${scan.device_id || '___________'}`, 25, y); y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('PRE-SCAN CHECKLIST:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Metallic Objects Removed: ${formatYesNo(scan.metallic_objects_removed as string | null)}`, 25, y); y += 7;
  doc.text(`Telemetry Removed: ${formatYesNo(scan.telemetry_removed as string | null)}`, 25, y); y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('SCAN COMPLETION:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Scan Completed: ${formatYesNo(scan.scan_completed as string | null)}`, 25, y); y += 7;
  doc.text(`Scan Interrupted: ${formatYesNo(scan.scan_interrupted as string | null)}`, 25, y); y += 7;
  doc.text(`Adverse Event During Scan: ${formatYesNo(scan.adverse_event_occurred as string | null)}`, 25, y); y += 10;

  // AI Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (scan.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateFollowup30Day(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('30-DAY FOLLOW-UP', 105, 51, { align: 'center' });

  const followup = data.followup_30day as Record<string, unknown> || {};
  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLLOW-UP VISIT:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`Follow-up Date: ${formatDate(followup.followup_date as string | null)}`, 25, y); y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('EVENTS SINCE PROCEDURE:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const events = [
    { key: 'er_visit', label: 'ER Visit' },
    { key: 'hospitalization', label: 'Hospitalization' },
    { key: 'new_mi', label: 'New MI' },
    { key: 'new_revascularization', label: 'New Revascularization' },
    { key: 'new_arrhythmia', label: 'New Arrhythmia' },
    { key: 'new_chf', label: 'New CHF' },
    { key: 'stroke_tia', label: 'Stroke/TIA' },
    { key: 'death', label: 'Death' },
  ];

  for (const event of events) {
    doc.text(`${event.label}: ${formatYesNo(followup[event.key] as string | null)}`, 25, y);
    y += 7;
  }

  y += 5;

  // AI Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (followup.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateArrhythmiaHistory(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('ARRHYTHMIA HISTORY', 105, 51, { align: 'center' });

  const arrhythmia = data.arrhythmia_history as Record<string, unknown> || {};
  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ARRHYTHMIA ASSESSMENT:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');

  doc.text(`AFib/AFlutter: ${formatYesNo(arrhythmia.afib_aflutter as string | null)}`, 25, y);
  if (arrhythmia.afib_type) doc.text(`Type: ${arrhythmia.afib_type}`, 120, y);
  y += 7;

  doc.text(`Bradycardia: ${formatYesNo(arrhythmia.bradycardia as string | null)}`, 25, y); y += 7;
  doc.text(`SVT: ${formatYesNo(arrhythmia.svt as string | null)}`, 25, y); y += 7;
  doc.text(`VT: ${formatYesNo(arrhythmia.vt as string | null)}`, 25, y); y += 7;

  doc.text(`Heart Block: ${formatYesNo(arrhythmia.heart_block as string | null)}`, 25, y);
  if (arrhythmia.heart_block_degree) doc.text(`Degree: ${arrhythmia.heart_block_degree}`, 120, y);
  y += 7;

  doc.text(`Long QT: ${formatYesNo(arrhythmia.long_qt as string | null)}`, 25, y); y += 7;
  doc.text(`PACs/PVCs: ${formatYesNo(arrhythmia.pacs_pvcs as string | null)}`, 25, y); y += 7;
  doc.text(`PSVT: ${formatYesNo(arrhythmia.psvt as string | null)}`, 25, y); y += 7;

  doc.text(`Other Arrhythmia: ${formatYesNo(arrhythmia.other_arrhythmia as string | null)}`, 25, y);
  if (arrhythmia.other_arrhythmia_specify) {
    y += 7;
    doc.text(`Specify: ${arrhythmia.other_arrhythmia_specify}`, 30, y);
  }
  y += 10;

  // AI Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (arrhythmia.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateACSRisk(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('ACS RISK STRATIFICATION', 105, 51, { align: 'center' });

  const risk = data.acs_risk as Record<string, unknown> || {};
  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK ARM ASSIGNMENT:', 20, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const riskArm = risk.risk_arm || '___________';
  doc.setFontSize(12);
  doc.text(`Assigned Risk Arm: ${riskArm}`, 25, y);
  doc.setFontSize(10);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('HIGH-RISK FEATURES:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const features = [
    { key: 'recurrent_angina', label: 'Recurrent Angina' },
    { key: 'dynamic_st_changes', label: 'Dynamic ST Changes' },
    { key: 'elevated_troponin', label: 'Elevated Troponin' },
    { key: 'hemodynamic_instability', label: 'Hemodynamic Instability' },
    { key: 'sustained_vt', label: 'Sustained VT' },
    { key: 'recent_pci', label: 'Recent PCI (<6 months)' },
    { key: 'prior_cabg', label: 'Prior CABG' },
    { key: 'high_grace_score', label: 'GRACE Score >140' },
    { key: 'lvef_under_40', label: 'LVEF <40%' },
  ];

  for (const feature of features) {
    doc.text(`${feature.label}: ${formatYesNo(risk[feature.key] as string | null)}`, 25, y);
    y += 7;
  }

  y += 5;

  // Risk Determination Logic
  doc.setFont('helvetica', 'bold');
  doc.text('RISK DETERMINATION LOGIC:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('LOW: Stable angina, no NSTEMI, no ACS', 25, y); y += 6;
  doc.text('MEDIUM: NSTEMI WITHOUT any high-risk features', 25, y); y += 6;
  doc.text('HIGH: NSTEMI WITH ANY high-risk feature listed above', 25, y); y += 10;

  doc.setFontSize(10);

  // AI Notes
  doc.setFont('helvetica', 'bold');
  doc.text('AI Notes:', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  const notes = (risk.ai_notes as string) || 'No additional notes';
  const splitNotes = doc.splitTextToSize(notes, 160);
  doc.text(splitNotes, 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateAdverseEvent(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('ADVERSE EVENT FORM', 105, 51, { align: 'center' });

  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ADVERSE EVENT DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('AE Description: _________________________________________________', 25, y); y += 10;
  doc.text('Onset Date: ___________    Onset Time: ___:___', 25, y); y += 7;
  doc.text('Resolution Date: ___________    Resolution Time: ___:___', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('SEVERITY:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('[ ] Mild    [ ] Moderate    [ ] Severe    [ ] Life-threatening    [ ] Fatal', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('RELATIONSHIP TO STUDY:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('[ ] Unrelated    [ ] Unlikely    [ ] Possible    [ ] Probable    [ ] Definite', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('OUTCOME:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('[ ] Recovered    [ ] Recovering    [ ] Not Recovered    [ ] Fatal    [ ] Unknown', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('SERIOUS ADVERSE EVENT:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('[ ] Yes  [ ] No', 25, y); y += 7;
  doc.text('If Yes: [ ] Death  [ ] Life-threatening  [ ] Hospitalization  [ ] Disability', 25, y); y += 10;

  doc.text('Action Taken: _________________________________________________', 25, y); y += 10;
  doc.text('Reporter Signature: _________________ Date: ___________', 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generatePatientExperience(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('PATIENT EXPERIENCE SURVEY', 105, 51, { align: 'center' });

  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MCG SCAN EXPERIENCE:', 20, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const questions = [
    'How comfortable was the MCG scan procedure?',
    'How would you rate the duration of the scan?',
    'Were instructions clearly explained?',
    'How satisfied are you with the overall experience?',
    'Would you recommend this procedure to others?',
  ];

  for (const question of questions) {
    doc.text(question, 25, y);
    y += 7;
    doc.text('[ ] Very Poor  [ ] Poor  [ ] Fair  [ ] Good  [ ] Excellent', 30, y);
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('ADDITIONAL COMMENTS:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 40, 'S');

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateDeviceMalfunction(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('DEVICE MALFUNCTION REPORT', 105, 51, { align: 'center' });

  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVICE INFORMATION:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('Device ID: ___________________', 25, y); y += 7;
  doc.text('Device Serial Number: ___________________', 25, y); y += 7;
  doc.text('Date of Malfunction: ___________    Time: ___:___', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('MALFUNCTION DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('Description of Malfunction:', 25, y); y += 7;
  doc.rect(25, y, 160, 30, 'S');
  y += 35;

  doc.text('Impact on Subject: [ ] None  [ ] Minor  [ ] Significant', 25, y); y += 10;
  doc.text('Scan Aborted: [ ] Yes  [ ] No', 25, y); y += 10;
  doc.text('Device Replaced: [ ] Yes  [ ] No', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('CORRECTIVE ACTION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 25, 'S');

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateProtocolDeviation(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('PROTOCOL DEVIATION FORM', 105, 51, { align: 'center' });

  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVIATION DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('Date of Deviation: ___________', 25, y); y += 7;
  doc.text('Date Discovered: ___________', 25, y); y += 10;

  doc.text('Type of Deviation:', 25, y); y += 7;
  doc.text('[ ] Inclusion/Exclusion Criteria  [ ] Informed Consent', 25, y); y += 7;
  doc.text('[ ] Study Procedure  [ ] Safety Reporting  [ ] Other', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION OF DEVIATION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 35, 'S');
  y += 40;

  doc.setFont('helvetica', 'bold');
  doc.text('ROOT CAUSE:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 25, 'S');
  y += 30;

  doc.setFont('helvetica', 'bold');
  doc.text('CORRECTIVE/PREVENTIVE ACTION:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 25, 'S');

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

function generateStudyExit(doc: jsPDF, data: Record<string, unknown>, siteCode: string, subjectNumber: string): void {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Source Document Worksheet', 105, 20, { align: 'center' });
  doc.text('Protocol: SB-ACS-005', 105, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Site: ${siteCode}`, 20, 40);
  doc.text(`Subject #: ${subjectNumber}`, 150, 40);

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 45, 170, 8, 'F');
  doc.setFontSize(11);
  doc.text('STUDY EXIT FORM', 105, 51, { align: 'center' });

  let y = 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EXIT DETAILS:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('Exit Date: ___________', 25, y); y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('REASON FOR EXIT:', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('[ ] Study Completed Successfully', 25, y); y += 7;
  doc.text('[ ] Subject Withdrawal (Consent withdrawn)', 25, y); y += 7;
  doc.text('[ ] Lost to Follow-up', 25, y); y += 7;
  doc.text('[ ] Adverse Event', 25, y); y += 7;
  doc.text('[ ] Protocol Violation', 25, y); y += 7;
  doc.text('[ ] Investigator Decision', 25, y); y += 7;
  doc.text('[ ] Death', 25, y); y += 7;
  doc.text('[ ] Other: ___________________________________', 25, y); y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('EXIT SUMMARY:', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.rect(25, y, 160, 40, 'S');
  y += 45;

  doc.text('All study procedures completed: [ ] Yes  [ ] No', 25, y); y += 7;
  doc.text('All CRFs completed: [ ] Yes  [ ] No', 25, y); y += 10;

  doc.text('Investigator Signature: _________________ Date: ___________', 25, y);

  doc.setFontSize(8);
  doc.text('Confidential - Version: Oct2025', 20, 280);
  doc.text('Page 1 of 1', 105, 280, { align: 'center' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject_data, forms } = body;

    const siteCode = subject_data?.subject_info?.site_code || 'SITE';
    const subjectNumber = subject_data?.subject_info?.subject_number || '000';

    const requestedForms = forms || ['all'];
    const formsToGenerate = requestedForms.includes('all')
      ? [
          'prescreening',
          'baseline',
          'medical_history',
          'troponin_log',
          'medications_log',
          'ecg_log',
          'catheterization',
          'study_scan',
          'followup_30day',
          'arrhythmia_history',
          'acs_risk',
          'adverse_event',
          'patient_experience',
          'device_malfunction',
          'protocol_deviation',
          'study_exit'
        ]
      : requestedForms;

    const generatedFiles: Array<{ name: string; base64: string }> = [];

    for (const formName of formsToGenerate) {
      const doc = new jsPDF();

      switch (formName) {
        case 'prescreening':
          generatePrescreeningConsent(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'baseline':
          generateBaselineScreening(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'medical_history':
          generateMedicalHistory(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'troponin_log':
          generateTroponinLog(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'medications_log':
          generateMedicationsLog(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'ecg_log':
          generateECGLog(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'catheterization':
          generateCatheterization(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'study_scan':
          generateStudyScan(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'followup_30day':
          generateFollowup30Day(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'arrhythmia_history':
          generateArrhythmiaHistory(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'acs_risk':
          generateACSRisk(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'adverse_event':
          generateAdverseEvent(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'patient_experience':
          generatePatientExperience(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'device_malfunction':
          generateDeviceMalfunction(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'protocol_deviation':
          generateProtocolDeviation(doc, subject_data, siteCode, subjectNumber);
          break;
        case 'study_exit':
          generateStudyExit(doc, subject_data, siteCode, subjectNumber);
          break;
        default:
          continue;
      }

      const base64 = doc.output('datauristring');
      generatedFiles.push({
        name: `${siteCode}-${subjectNumber}_${formName}.pdf`,
        base64,
      });
    }

    return NextResponse.json({
      success: true,
      subject: `${siteCode}-${subjectNumber}`,
      files: generatedFiles,
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
