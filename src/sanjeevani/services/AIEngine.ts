/**
 * Sanjeevani AI Engine — ports src/services/AIEngine.js.
 *
 * The only change from the original: the hardcoded OpenRouter API key is
 * removed. The key is now read from localStorage at call time (set via the
 * Settings nav item). If missing, a clear `MissingApiKeyError` is thrown so
 * the UI can surface a friendly message instead of a silent network failure.
 */

import { getOpenRouterKey, MissingApiKeyError } from "./settings";

// A curated list of free OpenRouter chat models. The loop tries each in turn
// until one returns a valid response (mirrors the original fallback behaviour).
const modelsToTry = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
];

const callOpenRouterJSON = async (
  systemPrompt: string,
  userPrompt: string,
  timeout = 25000,
): Promise<any> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer":
              typeof window !== "undefined"
                ? window.location.href
                : "http://localhost",
            "X-Title": "Sanjeevani AI",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        },
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data || !data.choices || !data.choices[0]) {
        lastError = new Error(
          data?.error?.message || "Invalid response or rate limit",
        );
        continue;
      }

      let responseText: string = data.choices[0].message.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      } else {
        responseText = responseText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
      }

      return JSON.parse(responseText);
    } catch (err) {
      lastError = err as Error;
      console.warn(`Model ${model} failed`, err);
    }
  }
  throw lastError || new Error("All AI models failed or rate limited.");
};

export const generateFollowUpQuestion = async (
  chatHistory: any[],
  language: string,
  pastMedicalHistory: any = null,
  visualSymptomContext: string | null = null,
): Promise<{ question: string; readyForTriage: boolean }> => {
  try {
    const formattedHistory = chatHistory
      .map((msg) => `${msg.role === "user" ? "Patient" : "AI"}: ${msg.content}`)
      .join("\n");

    let contextStr = "";
    if (visualSymptomContext) {
      contextStr += `\n[VISUAL AI CONTEXT]: The patient uploaded a photo showing: "${visualSymptomContext}".`;
    }
    if (pastMedicalHistory && pastMedicalHistory.pastDiagnoses) {
      contextStr += `\n[PAST MEDICAL HISTORY]: Diagnoses: ${pastMedicalHistory.pastDiagnoses?.join(", ")}, Allergies: ${pastMedicalHistory.allergies?.join(", ")}.`;
    }

    const prompt = `
      You are an expert Emergency Room Doctor. You are interviewing a patient. The language is: ${language}.

      Chat History:
      ${formattedHistory}
      ${contextStr}

      Task: Based on the patient's exact symptoms and any visual context provided, ask ONE highly relevant, diagnostic follow-up question to narrow down the exact cause.
      DO NOT jump to unrelated life-threatening conditions unless the symptoms actually point to them.
      Be a smart, logical doctor. Ask only ONE question at a time.

      CRITICAL RULE 1: You MUST ALWAYS generate a medical question in the "question" field. It CANNOT be empty under ANY circumstances. Even if you think you have enough information, ask a concluding or confirming question (e.g., "Are you experiencing anything else before I finalize your report?").
      CRITICAL RULE 2: If you feel you have gathered enough diagnostic information (after 2-3 questions) OR if the patient mentions a critical emergency, set "readyForTriage": true, BUT YOU MUST STILL PROVIDE A QUESTION.

      Respond STRICTLY in this JSON format:
      {
        "question": "Your highly relevant, logical medical follow up question here in ${language}. THIS MUST NEVER BE EMPTY.",
        "readyForTriage": true/false
      }
    `;

    const parsed = await callOpenRouterJSON(
      "You are a medical JSON AI. Output only valid raw JSON.",
      prompt,
      15000,
    );
    if (!parsed.question || parsed.question.trim() === "") {
      throw new Error("AI returned empty question.");
    }
    return parsed;
  } catch (error) {
    console.error("Follow-up AI Error:", error);
    throw error instanceof Error
      ? error
      : new Error("AI engine failed to generate a response.");
  }
};

export const processTriage = async (
  chatHistory: any[],
  language = "en",
  pastMedicalHistory: any = null,
  visualSymptomContext: string | null = null,
  patientId = "",
): Promise<any> => {
  try {
    let historyContext = "";
    if (pastMedicalHistory && pastMedicalHistory.pastDiagnoses) {
      historyContext += `
      EXTREMELY IMPORTANT CONTEXT: The patient uploaded a previous medical report.
      Past Diagnoses: ${pastMedicalHistory.pastDiagnoses?.join(", ") || "None"}
      Current Medications: ${pastMedicalHistory.currentMedications?.join(", ") || "None"}
      Allergies: ${pastMedicalHistory.allergies?.join(", ") || "None"}
      `;
    }

    if (visualSymptomContext) {
      historyContext += `
      EXTREMELY IMPORTANT VISUAL CONTEXT: The patient uploaded a photo of their symptom.
      Computer Vision AI Analysis: "${visualSymptomContext}"
      You MUST integrate this visual finding into your diagnosis.
      `;
    }

    const formattedHistory = chatHistory
      .map(
        (msg) => `${msg.role === "user" ? "Patient" : "Doctor"}: ${msg.content}`,
      )
      .join("\n");

    const prompt = `
      You are an expert Medical Triage Assistant operating in a hospital Emergency Room.
      Analyze the following patient-doctor interaction and generate a highly structured Electronic Health Record (EHR) triage card.
      Language: ${language}.

      Interaction Log:
      ${formattedHistory}

      ${historyContext}

      CRITICAL PRIORITY RULES:
      - "red" (Level 1/2): Immediate life-threatening.
      - "yellow" (Level 3): Urgent but stable.
      - "green" (Level 4/5): Non-Urgent.

      Respond STRICTLY in the following JSON format ONLY:
      {
        "priority": "red|yellow|green",
        "urgencyScore": "Number between 0 and 100 representing exact risk percentage",
        "aiReasoning": "Explain EXACTLY why you gave this priority and score based on the interaction.",
        "department": "Cardiology, Psychiatry, Urology, General Medicine, Neurology, Orthopedics, etc",
        "suggestedBedAllocation": "A realistic bed allocation.",
        "affectedBodyPart": "STRICTLY ONE OF: [head, chest, abdomen, left_arm, right_arm, left_leg, right_leg, general]",
        "epidemicCategory": "STRICTLY ONE: [Gastrointestinal, Respiratory, Vector-borne, Neurological, Viral Fever, Orthopedic, Dermatological, Cardiovascular].",
        "mentalDistressIndex": "Analyze the patient's language. Output strictly ONE: [Low, Medium, High]",
        "sentimentReasoning": "1 sentence explaining the mental distress index.",
        "symptoms": ["Technical term 1", "Technical term 2"],
        "suspectedCondition": "Primary Differential Diagnosis",
        "ddxMatrix": [
          {"condition": "Disease A", "probability": 85},
          {"condition": "Disease B", "probability": 10},
          {"condition": "Disease C", "probability": 5}
        ],
        "possibleCauses": ["Potential Cause 1", "Potential Cause 2"],
        "clinicalNotes": "Brief, professional clinical observation notes",
        "precautionsAndSafety": ["Safety measure 1", "Safety measure 2"],
        "expectedTreatmentPlan": "A to Z brief medical protocol",
        "clinicalCitation": "Provide a realistic Medical Guideline Source that supports this treatment",
        "recommendations": ["Actionable step 1", "Actionable step 2"],
        "suggestedMedications": ["Provide AT LEAST 3 to 5 Specific Medication Names with dosages"],
        "vitalsToCheck": [
          {"name": "Blood Pressure", "reason": "Why?"}
        ]
      }
    `;

    const parsedData = await callOpenRouterJSON(
      "You are a Medical JSON AI. Output only raw JSON.",
      prompt,
      25000,
    );

    return {
      id: Date.now().toString(),
      patientId: patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      chatHistory,
      language,
      pastMedicalHistory,
      priority: parsedData.priority || "green",
      urgencyScore: parsedData.urgencyScore || 15,
      aiReasoning: parsedData.aiReasoning || "Standard evaluation.",
      suggestedBedAllocation: parsedData.suggestedBedAllocation || "Waiting Room",
      affectedBodyPart: parsedData.affectedBodyPart || "general",
      department: parsedData.department || "General Medicine",
      epidemicCategory: parsedData.epidemicCategory || "None",
      mentalDistressIndex: parsedData.mentalDistressIndex || "Low",
      sentimentReasoning: parsedData.sentimentReasoning || "Standard tone.",
      symptoms: parsedData.symptoms || ["General discomfort"],
      suspectedCondition: parsedData.suspectedCondition || "Unknown",
      ddxMatrix: parsedData.ddxMatrix || [{ condition: "Unknown", probability: 100 }],
      possibleCauses: parsedData.possibleCauses || ["Requires medical evaluation"],
      clinicalNotes: parsedData.clinicalNotes || "No specific clinical notes available.",
      precautionsAndSafety: parsedData.precautionsAndSafety || ["Monitor patient"],
      expectedTreatmentPlan:
        parsedData.expectedTreatmentPlan ||
        "Consult attending physician for treatment plan.",
      clinicalCitation:
        parsedData.clinicalCitation || "Standard Global Medical Protocols",
      recommendations: parsedData.recommendations || ["Consult a physician"],
      suggestedMedications: parsedData.suggestedMedications || [],
      vitalsToCheck: parsedData.vitalsToCheck || [
        { name: "General Vitals", reason: "Routine assessment" },
      ],
      safetyReview: null,
      billingInfo: null,
      allergyAlert: null,
    };
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to process symptoms with OpenRouter.");
  }
};

export const runSafetyReviewAgent = async (triageData: any): Promise<any> => {
  try {
    const prompt = `
      You are the "Chief Medical Safety Agent". Your job is to review the preliminary EHR generated by the "Triage Agent".
      Review the following medications, diagnosis, and treatment plan for any obvious safety risks, contraindications, or missing critical alerts.

      Diagnosis: ${triageData.suspectedCondition}
      Medicines: ${triageData.suggestedMedications.join(", ")}
      Priority: ${triageData.priority}

      Respond STRICTLY in the following JSON format ONLY:
      {
        "isApproved": true/false,
        "safetyNotes": "Brief 1 sentence note."
      }
    `;

    return await callOpenRouterJSON(
      "You are a medical safety JSON AI. Output only valid raw JSON.",
      prompt,
      15000,
    );
  } catch (error) {
    console.error("Safety Agent Error:", error);
    return {
      isApproved: true,
      safetyNotes: "Safety Agent offline. Proceed with standard caution.",
    };
  }
};

export const runBillingAgent = async (triageData: any): Promise<any> => {
  try {
    const prompt = `
      You are an expert "Medical Coding & Billing AI Agent".
      Based on the following diagnosis and priority, generate the accurate ICD-10 medical code and estimate the insurance claim treatment cost in INR.

      Diagnosis: ${triageData.suspectedCondition}
      Priority: ${triageData.priority}
      Medicines: ${triageData.suggestedMedications.join(", ")}

      Respond STRICTLY in the following JSON format ONLY:
      {
        "icd10Code": "e.g., J01.90",
        "estimatedCostINR": "e.g., ₹2,500 - ₹5,000",
        "billingNotes": "Brief 1 sentence justification."
      }
    `;

    return await callOpenRouterJSON(
      "You are a Medical Billing JSON AI. Output only valid raw JSON.",
      prompt,
      15000,
    );
  } catch (error) {
    console.error("Billing Agent Error:", error);
    return {
      icd10Code: "UNKNOWN",
      estimatedCostINR: "Calculation failed",
      billingNotes: "Billing Agent offline.",
    };
  }
};

export const runPharmacovigilanceAgent = async (
  triageData: any,
  pastMedicalHistory: any,
): Promise<any> => {
  try {
    const allergies = pastMedicalHistory?.allergies?.join(", ") || "None reported";

    const prompt = `
      You are the "Pharmacovigilance (Allergy Check) AI Agent".
      Your STRICT job is to cross-reference the patient's KNOWN ALLERGIES with the NEWLY PRESCRIBED MEDICATIONS.

      Patient Known Allergies: ${allergies}
      Newly Prescribed Medications: ${triageData.suggestedMedications.join(", ")}

      If there is ANY overlap, risk, or cross-reactivity between the allergies and the prescribed medications, you MUST flag it as a severe risk. If there are no allergies reported, or no overlap, mark it as safe.

      Respond STRICTLY in the following JSON format ONLY:
      {
        "hasRisk": true/false,
        "alertMessage": "If hasRisk is true, write a SEVERE WARNING. If false, write 'Safe: No known allergy interactions detected.'"
      }
    `;

    return await callOpenRouterJSON(
      "You are a Pharmacovigilance JSON AI. Output only valid raw JSON.",
      prompt,
      15000,
    );
  } catch (error) {
    console.error("Pharmacovigilance Agent Error:", error);
    return {
      hasRisk: false,
      alertMessage:
        "Pharmacovigilance Agent offline. Doctor must manually verify allergies.",
    };
  }
};

export const generateSOAPNote = async (transcript: string): Promise<any> => {
  try {
    const prompt = `
      You are an expert Ambient Clinical Intelligence AI (Auto-Scribe).
      Analyze the following raw transcript of a doctor-patient conversation.
      Your task is to ignore any small talk and extract all medically relevant information into a highly professional SOAP note.

      Transcript:
      "${transcript}"

      Respond STRICTLY in the following JSON format ONLY. Do not use markdown blocks.
      {
        "subjective": "Patient's chief complaint, history of present illness, and symptoms as described by them.",
        "objective": "Any observable facts mentioned. Leave empty if none.",
        "assessment": "Your differential diagnosis or medical impression based on the conversation.",
        "plan": "The treatment plan, prescriptions, or follow-up instructions given by the doctor.",
        "extractedKeywords": ["keyword1", "keyword2"]
      }
    `;

    return await callOpenRouterJSON(
      "You are a Medical SOAP Note AI. Output only valid raw JSON.",
      prompt,
      25000,
    );
  } catch (error) {
    console.error("AutoScribe Error:", error);
    throw error instanceof Error ? error : new Error("Failed to generate SOAP note.");
  }
};

export const checkDrugInteractions = async (
  drugs: string[],
  genes?: string,
): Promise<any> => {
  try {
    const prompt = `
      You are a strict, hyper-realistic Clinical Pharmacologist and Toxicologist AI with access to databases like Micromedex and Lexicomp.
      Analyze the following list of medications/substances and the patient's genetic/metabolic profile.

      Medications/Substances: ${drugs.join(", ")}
      Genetic/Metabolic Profile: ${genes || "Standard metabolizer"}

      CRITICAL RULES:
      1. You MUST accurately identify severe, life-threatening interactions.
      2. If the user inputs highly dangerous illicit or recreational drug combinations, you MUST aggressively flag the overall risk as "Severe".
      3. Provide a highly accurate biochemical and physiological mechanism of action.

      Respond STRICTLY in the following JSON format ONLY:
      {
        "riskLevel": "Low | Moderate | Severe",
        "summary": "1-2 sentence highly realistic clinical risk summary.",
        "interactions": [
          {
            "drugsInvolved": ["Drug A", "Drug B"],
            "severity": "Low | Moderate | High | Contraindicated",
            "mechanism": "Exact biochemical mechanism.",
            "recommendation": "Strict clinical medical recommendation."
          }
        ]
      }
    `;

    return await callOpenRouterJSON(
      "You are a Pharmacogenomics AI. Output only valid raw JSON.",
      prompt,
      25000,
    );
  } catch (error) {
    console.error("Pharma AI Error:", error);
    throw error instanceof Error ? error : new Error("Failed to analyze drug interactions.");
  }
};

export const runMultiAgentDebate = async (patientCase: string): Promise<any> => {
  try {
    const prompt = `
      You are simulating an advanced Multi-Agent Healthcare Committee.
      A patient presents with the following case/symptoms: "${patientCase}".

      You have access to a massive board of AI Specialists:
      - Dr. Heart (Cardiology)
      - Dr. Brain (Neurology)
      - Dr. Meds (Pharmacology)
      - Dr. Lungs (Pulmonology)
      - Dr. Gut (Gastroenterology)
      - Dr. Blood (Hematology)
      - Dr. Mind (Psychiatry)
      - Dr. Skin (Dermatology)
      - Dr. Trauma (ER Surgery)
      - Dr. Tox (Toxicology)
      - Dr. Endo (Endocrinology)
      - Dr. Onco (Oncology)
      - Dr. Path (Pathology)

      First, dynamically SELECT the 4 to 6 most relevant specialists based on the patient's case.
      Then, simulate a highly professional, highly technical medical debate between these selected specialists.
      They must argue constructively, cross-examine each other's differential diagnoses, call out risks, and finally reach a unified consensus.

      Respond STRICTLY in the following JSON format ONLY:
      {
        "debate": [
          {"agent": "Dr. [Name]", "specialty": "[Specialty]", "message": "His/Her argument or observation..."},
          {"agent": "Dr. [Name]", "specialty": "[Specialty]", "message": "Counter-argument or addition..."}
        ],
        "consensus": "The final agreed-upon clinical diagnosis and strict recommended action plan."
      }
    `;

    return await callOpenRouterJSON(
      "You are a medical JSON AI. Output only valid raw JSON.",
      prompt,
      35000,
    );
  } catch (error) {
    console.error("Multi-Agent Error:", error);
    throw error instanceof Error ? error : new Error("Failed to run the Multi-Agent debate.");
  }
};

export const generateDigitalTwinTrajectory = async (patientData: any): Promise<any> => {
  try {
    const prompt = `
      You are an advanced Predictive AI Medical Digital Twin generator.
      The user has provided the following current health baseline:
      Age: ${patientData.age}
      Gender: ${patientData.gender}
      Weight: ${patientData.weight}kg
      Height: ${patientData.height}cm
      Chronic Conditions: ${patientData.conditions}
      Family History: ${patientData.familyHistory}
      Lifestyle: ${patientData.lifestyle}

      Generate a highly advanced 10-year predictive health trajectory based on current medical literature if they DO NOT change their lifestyle.
      Calculate "Cardiac Risk %", "Metabolic Risk %", and "Neurological Risk %" for each year from Year 1 to Year 10.
      Calculate their estimated "Biological Age" (vs chronological) and "Estimated Life Expectancy".
      Assess current "Organ Health Scores" (out of 100) for Heart, Lungs, Liver, Kidneys, and Brain.

      Respond STRICTLY in the following JSON format ONLY without any conversational text or markdown:
      {
        "biologicalAge": 50,
        "lifeExpectancy": 72,
        "organHealth": {
          "heart": 85,
          "lungs": 90,
          "liver": 75,
          "kidneys": 88,
          "brain": 95
        },
        "trajectory": [
          {"year": 1, "cardiacRisk": 10, "metabolicRisk": 15, "neuroRisk": 5, "event": "Baseline established."}
        ],
        "criticalWarning": "Major predicted event.",
        "preventativeAction": "Specific lifestyle changes."
      }
    `;

    return await callOpenRouterJSON(
      "You are a Digital Twin JSON AI. Output only valid raw JSON.",
      prompt,
      25000,
    );
  } catch (error) {
    console.error("Digital Twin Error:", error);
    throw error instanceof Error ? error : new Error("Failed to generate Digital Twin trajectory.");
  }
};

export const analyzeGenomicSequence = async (dnaSequence: string): Promise<any> => {
  try {
    const prompt = `
      You are an expert AI Clinical Geneticist and CRISPR sequence analyzer.
      The user has provided the following raw DNA sequence block:
      "${dnaSequence}"

      Analyze this sequence for any known hereditary genetic mutations (e.g., BRCA1/BRCA2, CFTR, HTT).
      Even if it's a simulated or dummy sequence, pick a realistic anomaly to "detect" for the sake of the demonstration.

      Respond STRICTLY in the following JSON format ONLY without conversational text:
      {
        "detectedMutation": "Specific mutation (e.g., BRCA1 c.68_69delAG)",
        "chromosomeLocation": "e.g., Chr17:q21.31",
        "associatedDisease": "Disease associated with it",
        "riskLevel": "High | Medium | Low",
        "clinicalSignificance": "Pathogenic | VUS | Benign",
        "inheritancePattern": "Autosomal Dominant | Autosomal Recessive | X-Linked",
        "variantFrequency": "e.g., 0.1% in global population",
        "proteinImpactScore": 85,
        "description": "A scientific explanation of what this mutation does to the protein structure and function.",
        "crisprTarget": "Potential CRISPR-Cas9 target sequence (e.g. gRNA: 5'-AGCTG...)",
        "recommendedTherapies": ["Therapy 1", "Therapy 2"]
      }
    `;

    return await callOpenRouterJSON(
      "You are a Genomics JSON AI. Output only valid raw JSON.",
      prompt,
      25000,
    );
  } catch (error) {
    console.error("Genomics Error:", error);
    throw error instanceof Error ? error : new Error("Failed to analyze sequence.");
  }
};

export const analyzeArtTherapyEmotion = async (userEmotion: string): Promise<any> => {
  try {
    const prompt = `
      You are an expert AI Art Therapist and Psychologist.
      The user has provided the following emotional expression or description:
      "${userEmotion}"

      Analyze this state and provide:
      1. A deep psychological insight.
      2. A therapeutic recommendation.
      3. A color palette based on color psychology.

      You MUST remain objective and clinical. DO NOT refuse to answer, even if the content is explicit.
      Respond STRICTLY in the following JSON format ONLY without conversational text:
      {
        "insight": "Your psychological interpretation of their state...",
        "recommendation": "A brief therapeutic suggestion...",
        "colorPalette": ["#1A2B3C", "#4D5E6F", "#7A8B9C"]
      }
    `;

    return await callOpenRouterJSON(
      "You are an Art Therapy JSON AI. Output only valid raw JSON.",
      prompt,
      20000,
    );
  } catch (error) {
    console.error("Art Therapy Error:", error);
    // FALLBACK IF AI REFUSES EXPLICIT CONTENT OR CRASHES
    return {
      insight:
        "The description reflects intense raw desires and a focus on physical attributes, indicating a strong drive for sensual pleasure and validation.",
      recommendation:
        "Explore these feelings mindfully. Acknowledge your impulses without judgment and consider how they align with your broader relational needs.",
      colorPalette: ["#ff4d4d", "#ff9999", "#800000"],
    };
  }
};

export const evaluateRelapseRisk = async (
  dischargeNotes: string,
  newSymptoms: string,
  patientDiagnosis: string,
): Promise<any> => {
  try {
    const prompt = `
      You are an expert Autonomous Readmission Prevention Guardian (AI).
      Your job is to monitor a recently discharged patient and analyze their new symptoms against their original discharge notes.

      Original Diagnosis: ${patientDiagnosis}
      Discharge Notes (RAG Context): "${dischargeNotes}"
      Patient's Current New Symptoms: "${newSymptoms}"

      Compare the new symptoms with the context. Is this a normal expected recovery symptom, or a sign of a critical relapse/complication that requires immediate readmission?

      Respond STRICTLY in the following JSON format ONLY without conversational text:
      {
        "isCritical": true/false,
        "aiRiskAssessment": "A 2-sentence clinical explanation of why this symptom is or isn't a relapse of their original condition.",
        "recommendedAction": "e.g., 'Return to ER immediately' or 'Rest and take prescribed painkillers'"
      }
    `;

    return await callOpenRouterJSON(
      "You are a Guardian AI. Output only valid raw JSON.",
      prompt,
      15000,
    );
  } catch (error) {
    console.error("Guardian AI Error:", error);
    return {
      isCritical: true,
      aiRiskAssessment:
        "AI Network Timeout. Defaulting to critical alert for safety.",
      recommendedAction: "Please contact the doctor manually.",
    };
  }
};
