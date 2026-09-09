export const PLACES = [
  { name: "Connaught Place", address: "Connaught Place, New Delhi", coordinates: [77.2167, 28.6333] },
  { name: "India Gate", address: "India Gate, New Delhi", coordinates: [77.2295, 28.6129] },
  { name: "Hauz Khas", address: "Hauz Khas, New Delhi", coordinates: [77.2066, 28.5494] },
  { name: "Karol Bagh", address: "Karol Bagh, New Delhi", coordinates: [77.1907, 28.6517] },
  { name: "Noida Sec 18", address: "Sector 18, Noida", coordinates: [77.326, 28.5708] },
];

export const statusLabel = (status) => status?.replaceAll("_", " ") || "—";
