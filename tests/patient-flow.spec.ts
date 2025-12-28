import { test, expect } from '@playwright/test';

// Test user credentials (using Clerk test mode)
const TEST_EMAIL = 'testuser+clerk_test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_VERIFICATION_CODE = '424242';

// Sample Epic data for testing
const SAMPLE_EPIC_DATA = `Patient: Test Patient
DOB: 05/20/1970
Gender: Male
Race: White
Ethnicity: Not Hispanic or Latino

Vitals (12/28/2024 10:00):
BP: 138/85 mmHg
HR: 72 bpm
Temp: 98.4F
SpO2: 97% RA
Height: 5'11" (71 inches)
Weight: 195 lbs

Chief Complaint: Chest pain, substernal, started 6 hours ago

Past Medical History:
- Hypertension (diagnosed 2018)
- Type 2 Diabetes (diagnosed 2020)
- No prior MI
- No pacemaker or ICD

Current Medications:
- Metformin 500mg PO BID
- Lisinopril 10mg PO daily
- Aspirin 81mg PO daily

Labs (12/28/2024):
Troponin I (08:00): 35 ng/L (H) - Reference: Males ≤20 ng/L
Troponin I (14:00): 85 ng/L (H)
BUN: 15 mg/dL
Creatinine: 0.9 mg/dL

ECG (12/28/24 08:15):
Sinus rhythm, rate 72
ST depression 1mm in leads V3-V5
No ST elevation

Assessment: NSTEMI
Risk Stratification: Medium risk

Consent: Written informed consent obtained
Consent signed: 12/28/2024 at 09:30

No thoracic implants
Patient able to lie supine`;

// Additional Epic data for update test
const ADDITIONAL_EPIC_DATA = `Cardiac Catheterization Note (12/28/2024):

Procedure performed: Coronary angiography with PCI

Findings:
- Left main: No significant disease
- LAD: 80% stenosis proximal segment - CULPRIT LESION
- LCx: 40% stenosis OM1
- RCA: No significant disease
- Coronary dominance: Right dominant

Intervention:
- PCI to LAD with drug-eluting stent 3.0 x 18mm
- TIMI 3 flow post-intervention
- No complications

Additional Medications Given:
- Heparin 5000 units IV bolus
- Clopidogrel 600mg loading dose
- Atorvastatin 80mg PO

Post-procedure Troponin (20:00): 250 ng/L (H) - expected post-PCI rise`;

test.describe('MCG Study App - Full Patient Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Increase timeout for Clerk auth
    test.setTimeout(120000);
  });

  test('Complete patient workflow: signup, create, edit, history', async ({ page }) => {
    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial page
    await page.screenshot({ path: 'tests/screenshots/01-initial-page.png' });

    // Step 2: Sign up with test user
    console.log('Step 2: Signing up with test user...');

    // Look for Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForTimeout(2000);
    }

    // Wait for Clerk modal or redirect
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/02-sign-in-modal.png' });

    // Look for Sign Up link/tab in the modal
    const signUpLink = page.locator('text=Sign up, a:has-text("Sign up"), button:has-text("Sign up")').first();
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForTimeout(2000);
    }

    // Fill in email
    const emailInput = page.locator('input[name="emailAddress"], input[type="email"], input[id*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await page.screenshot({ path: 'tests/screenshots/03-email-entered.png' });

      // Click continue/next
      const continueBtn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Fill in password (if password field appears)
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(TEST_PASSWORD);

      const continueBtn = page.locator('button:has-text("Continue"), button[type="submit"]').first();
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Enter verification code
    await page.screenshot({ path: 'tests/screenshots/04-verification.png' });
    const codeInput = page.locator('input[name="code"], input[id*="code"], input[aria-label*="code"]').first();
    if (await codeInput.isVisible()) {
      await codeInput.fill(TEST_VERIFICATION_CODE);
      await page.waitForTimeout(2000);
    } else {
      // Try individual digit inputs
      const digitInputs = page.locator('input[maxlength="1"]');
      const count = await digitInputs.count();
      if (count >= 6) {
        for (let i = 0; i < 6; i++) {
          await digitInputs.nth(i).fill(TEST_VERIFICATION_CODE[i]);
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/05-after-verification.png' });

    // Step 3: Create new patient
    console.log('Step 3: Creating new patient...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/06-main-page.png' });

    // Fill in Site Code and Subject Number
    const siteCodeInput = page.locator('input[placeholder*="MSW"], input').filter({ hasText: /site/i }).first();
    const siteInputs = page.locator('input[placeholder="e.g., MSW"]');
    if (await siteInputs.first().isVisible()) {
      await siteInputs.first().fill('TEST');
    }

    const subjectInputs = page.locator('input[placeholder="e.g., 001"]');
    if (await subjectInputs.first().isVisible()) {
      await subjectInputs.first().fill('001');
    }

    await page.screenshot({ path: 'tests/screenshots/07-subject-info.png' });

    // Step 4: Paste Epic data and process with AI
    console.log('Step 4: Pasting Epic data and processing with AI...');
    const epicTextarea = page.locator('textarea[placeholder*="Epic"], textarea').first();
    await epicTextarea.fill(SAMPLE_EPIC_DATA);

    await page.screenshot({ path: 'tests/screenshots/08-epic-data-pasted.png' });

    // Click "Extract & Fill Forms with AI" button
    const extractButton = page.locator('button:has-text("Extract"), button:has-text("AI")').first();
    await extractButton.click();

    // Wait for AI processing (can take a while)
    console.log('Waiting for AI processing...');
    await page.waitForTimeout(15000);

    await page.screenshot({ path: 'tests/screenshots/09-after-ai-processing.png' });

    // Step 5: Review forms tab
    console.log('Step 5: Reviewing forms...');
    const formsTab = page.locator('button:has-text("Review Forms"), button:has-text("Edit Forms")').first();
    if (await formsTab.isVisible()) {
      await formsTab.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'tests/screenshots/10-forms-tab.png' });

    // Step 6: Save patient
    console.log('Step 6: Saving patient...');
    const saveButton = page.locator('button:has-text("Save Patient"), button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'tests/screenshots/11-after-save.png' });

    // Step 7: Generate PDFs
    console.log('Step 7: Generating PDFs...');
    const generateButton = page.locator('button:has-text("Generate PDF")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(5000);
    }

    await page.screenshot({ path: 'tests/screenshots/12-pdfs-generated.png' });

    // Step 8: Go to Dashboard
    console.log('Step 8: Navigating to Dashboard...');
    const dashboardLink = page.locator('a:has-text("Dashboard"), button:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('/dashboard');
    }

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/13-dashboard.png' });

    // Verify patient is in the list
    const patientRow = page.locator('text=TEST-001');
    await expect(patientRow).toBeVisible({ timeout: 10000 });

    // Step 9: Edit patient
    console.log('Step 9: Editing patient...');
    const editLink = page.locator('a:has-text("Edit")').first();
    await editLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/14-edit-patient.png' });

    // Step 10: Add more data
    console.log('Step 10: Adding more Epic data...');
    const addDataTab = page.locator('button:has-text("Add More Data")').first();
    if (await addDataTab.isVisible()) {
      await addDataTab.click();
      await page.waitForTimeout(1000);
    }

    const additionalTextarea = page.locator('textarea').first();
    await additionalTextarea.fill(ADDITIONAL_EPIC_DATA);

    await page.screenshot({ path: 'tests/screenshots/15-additional-data.png' });

    // Process with AI
    const mergeButton = page.locator('button:has-text("Extract"), button:has-text("Merge")').first();
    await mergeButton.click();

    console.log('Waiting for AI merge...');
    await page.waitForTimeout(15000);

    await page.screenshot({ path: 'tests/screenshots/16-after-merge.png' });

    // Save changes
    const saveChangesButton = page.locator('button:has-text("Save Changes"), button:has-text("Save")').first();
    if (await saveChangesButton.isVisible()) {
      await saveChangesButton.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'tests/screenshots/17-saved-changes.png' });

    // Step 11: Check version history
    console.log('Step 11: Checking version history...');
    const historyLink = page.locator('a:has-text("History"), button:has-text("History")').first();
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'tests/screenshots/18-version-history.png' });

    // Verify we have multiple versions
    const versionItems = page.locator('text=/Version \\d+/');
    const versionCount = await versionItems.count();
    console.log(`Found ${versionCount} versions`);
    expect(versionCount).toBeGreaterThanOrEqual(2);

    // Step 12: Log out
    console.log('Step 12: Logging out...');
    await page.goto('/');
    const userButton = page.locator('.cl-userButtonTrigger, [class*="userButton"]').first();
    if (await userButton.isVisible()) {
      await userButton.click();
      await page.waitForTimeout(1000);

      const signOutButton = page.locator('button:has-text("Sign out")').first();
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/19-logged-out.png' });

    // Step 13: Log back in
    console.log('Step 13: Logging back in...');
    await page.goto('/');
    await page.waitForTimeout(2000);

    const signInAgain = page.locator('button:has-text("Sign In")').first();
    if (await signInAgain.isVisible()) {
      await signInAgain.click();
      await page.waitForTimeout(2000);

      // Enter email
      const emailAgain = page.locator('input[name="emailAddress"], input[type="email"]').first();
      if (await emailAgain.isVisible()) {
        await emailAgain.fill(TEST_EMAIL);
        await page.locator('button:has-text("Continue")').first().click();
        await page.waitForTimeout(2000);
      }

      // Enter password
      const passAgain = page.locator('input[type="password"]').first();
      if (await passAgain.isVisible()) {
        await passAgain.fill(TEST_PASSWORD);
        await page.locator('button:has-text("Continue")').first().click();
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/20-logged-back-in.png' });

    // Step 14: Verify patient still exists
    console.log('Step 14: Verifying patient still exists...');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/21-final-dashboard.png' });

    const finalPatientCheck = page.locator('text=TEST-001');
    await expect(finalPatientCheck).toBeVisible({ timeout: 10000 });

    console.log('✅ All tests passed!');
  });
});
