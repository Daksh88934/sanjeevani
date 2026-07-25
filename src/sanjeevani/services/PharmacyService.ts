/**
 * PharmacyService — ports src/services/PharmacyService.js (logic unchanged).
 * Real Overpass API + simulated stock/order helpers.
 */

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const fetchLivePharmacies = async (
  lat?: number,
  lon?: number,
  fallbackArea = "Sector 62",
): Promise<string[]> => {
  if (!lat || !lon) {
    return [
      `Apollo Pharmacy - ${fallbackArea}`,
      `Netmeds Outlet - ${fallbackArea}`,
      `Tata 1mg Local Hub - ${fallbackArea}`,
      `City Hospital Internal Pharmacy`,
      `Wellness Forever - ${fallbackArea}`,
    ];
  }

  try {
    const query = `
      [out:json];
      node["amenity"="pharmacy"](around:5000,${lat},${lon});
      out 10;
    `;
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      throw new Error("No pharmacies found");
    }

    const pharmaciesList = data.elements.map((el: any) => {
      const name = el.tags?.name || "Local Medical Store";
      const dist = calculateDistance(lat, lon, el.lat, el.lon);
      return { name: `${name} - ${fallbackArea} (${dist} km away)`, dist: parseFloat(dist) };
    });

    pharmaciesList.sort((a: any, b: any) => a.dist - b.dist);
    return pharmaciesList.map((p: any) => p.name);
  } catch (err) {
    console.error("Overpass API failed", err);
    return [`Apollo Pharmacy - ${fallbackArea} (Network Fallback)`];
  }
};

export const checkMedicineStock = async (
  pharmacyName: string,
  medicineName: string,
) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const key = pharmacyName + medicineName.toLowerCase();
  const hash = hashString(key);

  const inStock = hash % 10 !== 0; // 10% chance out of stock
  const quantity = inStock ? (hash % 190) + 10 : 0;
  const price = (hash % 480) + 20;

  const monthsToExpiry = (hash % 24) + 1;
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + monthsToExpiry);

  return {
    medicineName,
    pharmacy: pharmacyName,
    inStock,
    quantity,
    price,
    expiryDate: expiryDate.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    }),
  };
};

export const sendPrescriptionToPharmacy = async (
  pharmacyName: string,
  patientId: string,
  medicines: string[],
) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    success: true,
    orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    message: `Prescription successfully sent to ${pharmacyName}`,
  };
};
