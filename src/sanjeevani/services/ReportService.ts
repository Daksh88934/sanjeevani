/**
 * ReportService — ports src/services/ReportService.js.
 *
 * Change: `saveReportToDB` no longer POSTs to the Vercel/Mongo `/api/reports`
 * endpoint (Enter has no Node server). It now writes straight into the local
 * `savedRecords` store so every module's "Save Report" button lands in the
 * unified Patient Records dashboard.
 *
 * `downloadPDF` (jsPDF) is kept verbatim — pure client-side export.
 */

import jsPDF from "jspdf";
import { saveRecord } from "./localDb";

export const saveReportToDB = async (
  type: string,
  patientId: string,
  data: any,
): Promise<string> => {
  try {
    return saveRecord({ patientId, type, data });
  } catch (error) {
    console.error("Error saving report:", error);
    throw error;
  }
};

export const downloadPDF = async (
  reportType: string,
  patientId: string,
  reportData: any,
): Promise<void> => {
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 20;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(15, 30, 60);
  pdf.text("SANJEEVANI AI", pageWidth / 2, y, { align: "center" });

  y += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text("CLINICAL REPORT", pageWidth / 2, y, { align: "center" });

  y += 15;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, y, pageWidth - 20, y);

  // Metadata
  y += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  pdf.text(`Patient ID: ${patientId || "N/A"}`, 20, y);
  pdf.text(`Date: ${new Date().toLocaleString()}`, pageWidth - 20, y, {
    align: "right",
  });
  y += 6;
  pdf.text(`Report Type: ${reportType}`, 20, y);

  y += 10;
  pdf.line(20, y, pageWidth - 20, y);

  y += 15;

  const addSection = (title: string, content: any, isAlert = false) => {
    if (!content && content !== 0) return;
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(isAlert ? 220 : 30, isAlert ? 50 : 60, isAlert ? 50 : 120);
    pdf.text(String(title).toUpperCase(), 20, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);

    const splitText = pdf.splitTextToSize(String(content), pageWidth - 40);
    pdf.text(splitText, 20, y);

    y += splitText.length * 5 + 10;
  };

  if (reportType === "VisionAI") {
    addSection("Image Type", reportData.imageType);
    if (reportData.imageUrl) {
      addSection("Secure Cloud Archive Link", reportData.imageUrl);
    }
    addSection("Severity", reportData.severity, reportData.severity === "Critical");
    addSection("Findings", reportData.findings);
    addSection("Impression", reportData.impression);
    addSection("AI Recommendation", reportData.recommendation, true);
  } else if (reportType === "Genomic") {
    addSection("Detected Mutation", reportData.detectedMutation);
    addSection("Associated Disease", reportData.associatedDisease);
    addSection("Risk Level", reportData.riskLevel, reportData.riskLevel === "High");
    addSection("Chromosome Location", reportData.chromosomeLocation);
    addSection("Clinical Significance", reportData.clinicalSignificance);
    addSection("Pathogenic Mechanism", reportData.description);
    if (reportData.crisprTarget) {
      addSection("CRISPR-Cas9 Target", reportData.crisprTarget);
    }
  } else if (reportType === "ArtTherapy") {
    addSection("Psychological Insight", reportData.insight);
    addSection("Therapeutic Recommendation", reportData.recommendation);
    if (reportData.colorPalette) {
      addSection("Healing Palette", reportData.colorPalette.join(", "));
    }
  } else if (reportType === "AutoScribe") {
    addSection("Subjective", reportData.subjective);
    addSection("Objective", reportData.objective);
    addSection("Assessment", reportData.assessment);
    addSection("Plan", reportData.plan);
    if (reportData.icd10) addSection("ICD-10 Codes", reportData.icd10.join(", "));
  } else if (reportType === "MultiAgent") {
    addSection("Patient Case", reportData.caseDescription);
    addSection("Final Diagnostic Consensus", reportData.consensus);
    if (reportData.treatmentPlan) addSection("Unified Treatment Plan", reportData.treatmentPlan);
    addSection(
      "Differentials / Alternatives",
      reportData.disagreements || "None noted by the committee.",
    );
  } else if (reportType === "Triage") {
    addSection(
      "Priority Level",
      (reportData.priority || "UNKNOWN").toUpperCase(),
      reportData.priority === "red" || reportData.priority === "yellow",
    );
    if (reportData.estimatedWaitTime) addSection("Estimated Wait Time", reportData.estimatedWaitTime);
    if (reportData.department) addSection("Recommended Department", reportData.department);
    if (reportData.suggestedBedAllocation)
      addSection("Suggested Bed Allocation", reportData.suggestedBedAllocation);

    if (reportData.symptoms) addSection("Symptoms Extracted", reportData.symptoms.join(", "));
    if (reportData.affectedBodyPart) addSection("Affected Body Part", reportData.affectedBodyPart);

    if (reportData.suspectedCondition) addSection("AI Diagnosis (Suspected)", reportData.suspectedCondition);
    if (reportData.urgencyScore) addSection("AI Risk Confidence", reportData.urgencyScore + "%");
    if (reportData.aiReasoning) addSection("AI Reasoning", reportData.aiReasoning);

    if (reportData.ddxMatrix && reportData.ddxMatrix.length > 0) {
      const ddxStr = reportData.ddxMatrix
        .map((dx: any) => `${dx.condition} (${dx.probability}%)`)
        .join("\n");
      addSection("Differential Diagnosis (DDx) Matrix", ddxStr);
    }

    if (reportData.clinicalNotes) addSection("Clinical Notes", reportData.clinicalNotes);
    if (reportData.possibleCauses) addSection("Possible Causes", reportData.possibleCauses.join(", "));
    if (reportData.precautionsAndSafety)
      addSection("Precautions & Safety", reportData.precautionsAndSafety.join(", "));
    if (reportData.expectedTreatmentPlan)
      addSection("Expected Treatment Plan", reportData.expectedTreatmentPlan);

    if (reportData.recommendations && reportData.recommendations.length > 0)
      addSection("Immediate Actions Required", reportData.recommendations.join(", "));
    if (reportData.suggestedMedications && reportData.suggestedMedications.length > 0)
      addSection("Suggested Medications / E-Prescription", reportData.suggestedMedications.join(", "));
    if (reportData.clinicalCitation) addSection("Clinical Evidence Source", reportData.clinicalCitation);

    if (reportData.vitalsToCheck && reportData.vitalsToCheck.length > 0) {
      const vitalsStr = reportData.vitalsToCheck
        .map((v: any) => (typeof v === "object" ? `${v.name} (${v.reason})` : v))
        .join(", ");
      addSection("Vitals To Check", vitalsStr);
    }
    if (reportData.measuredBpm) addSection("Measured Vitals (BPM)", reportData.measuredBpm);
    if (reportData.visualPainIndex) addSection("Visual Pain Index", reportData.visualPainIndex + "/10");
    if (reportData.mentalDistressIndex)
      addSection("Mental Distress Index", `${reportData.mentalDistressIndex} - ${reportData.sentimentReasoning || ""}`);

    if (reportData.pastMedicalHistory) {
      if (reportData.pastMedicalHistory.pastDiagnoses?.length > 0)
        addSection("Previous Diagnoses", reportData.pastMedicalHistory.pastDiagnoses.join(", "));
      if (reportData.pastMedicalHistory.currentMedications?.length > 0)
        addSection("Current Medications", reportData.pastMedicalHistory.currentMedications.join(", "));
      if (reportData.pastMedicalHistory.allergies?.length > 0)
        addSection("Known Allergies", reportData.pastMedicalHistory.allergies.join(", "), true);
      if (reportData.pastMedicalHistory.labResults && reportData.pastMedicalHistory.labResults !== "null")
        addSection("Lab Results Summary", reportData.pastMedicalHistory.labResults);
    }

    if (reportData.safetyReview)
      addSection("AI Safety Review", reportData.safetyReview.safetyNotes, !reportData.safetyReview.isApproved);
    if (reportData.allergyAlert)
      addSection("Pharmacovigilance Alert", reportData.allergyAlert.alertMessage, reportData.allergyAlert.hasRisk);
    if (reportData.billingInfo)
      addSection(
        "Medical Billing Summary",
        `ICD-10: ${reportData.billingInfo.icd10Code} | Est. Cost: ${reportData.billingInfo.estimatedCostINR} \n${reportData.billingInfo.billingNotes}`,
      );

    if (reportData.chatHistory && reportData.chatHistory.length > 0) {
      const chatStr = reportData.chatHistory
        .map((msg: any) => `${msg.role === "user" ? "Patient" : "AI Doctor"}: ${msg.content}`)
        .join("\n\n");
      addSection(`Clinical Interaction Log (${reportData.language || "en"})`, chatStr);
    } else if (reportData.originalTranscript) {
      addSection("Clinical Interaction Log", reportData.originalTranscript);
    }
  }

  // Footer
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    "This report was generated by Sanjeevani AI and should be reviewed by a certified healthcare professional.",
    pageWidth / 2,
    285,
    { align: "center" },
  );

  pdf.save(`Sanjeevani_${reportType}_${patientId || "Report"}.pdf`);
};
