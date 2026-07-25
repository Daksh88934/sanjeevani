/**
 * EpidemicService — ports src/services/EpidemicService.js (logic unchanged).
 * Pure in-memory tracker, no data-layer changes.
 */

interface EpidemicCase {
  id: string;
  location: string;
  category: string;
  timestamp: Date;
}

interface OutbreakResult {
  isOutbreak: true;
  location: string;
  category: string;
  caseCount: number;
}

class EpidemicTracker {
  private cases: EpidemicCase[] = [];

  addCase(patientData: any): OutbreakResult | null {
    const { id, epidemicCategory, suspectedCondition } = patientData;
    const location = patientData.location?.toLowerCase().trim() || "unknown";
    const category = epidemicCategory || suspectedCondition || "Unknown Disease";

    // Prevent duplicate cases from being added (React StrictMode fix)
    if (id && this.cases.some((c) => c.id === id)) {
      return null;
    }

    this.cases.push({
      id,
      location,
      category,
      timestamp: new Date(),
    });

    const casesInLocation = this.cases.filter(
      (c) => c.location === location && c.category === category,
    );

    if (casesInLocation.length >= 2) {
      return {
        isOutbreak: true,
        location: location.toUpperCase(),
        category: category.toUpperCase(),
        caseCount: casesInLocation.length,
      };
    }

    return null;
  }
}

export const epidemicService = new EpidemicTracker();
