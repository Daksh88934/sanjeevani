import { scanMedicalRecord } from './src/services/VisionService.js';
import { processTriage } from './src/services/AIEngine.js';

// 1x1 transparent PNG base64
const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function runTest() {
  console.log("Testing OCR Vision API...");
  try {
    const ocrData = await scanMedicalRecord(dummyBase64);
    console.log("OCR Extracted Data:", JSON.stringify(ocrData, null, 2));

    console.log("\\nTesting AI Triage with OCR Context...");
    const triageData = await processTriage(
      "Mujhe bohot tezz sir dard ho raha hai aur ulti aa rahi hai.",
      "hi-IN",
      ocrData
    );

    console.log("Final Triage Data:", JSON.stringify(triageData, null, 2));
    
    if (triageData.pastMedicalHistory) {
      console.log("\\nSUCCESS: pastMedicalHistory successfully passed through to Triage Data!");
    } else {
      console.log("\\nFAIL: pastMedicalHistory is missing from Triage Data!");
    }

  } catch (error) {
    console.error("Test Failed:", error);
  }
}

runTest();
