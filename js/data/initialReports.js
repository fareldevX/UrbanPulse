// Data simulasi wilayah Yogyakarta. Deterministik: tidak memakai Date.now()/Math.random().
const L = { pending: "Report Received", "in-progress": "In Progress", resolved: "Resolved" };
const ORDER = ["pending", "in-progress", "resolved"];
const BASE = Date.parse("2026-11-09T00:00:00Z");
const rows = [
  ["Pothole on Jl. Kaliurang", "road", "high", "pending", -7.7482, 110.384, 0],
  ["Road collapse on Jl. Solo", "road", "medium", "in-progress", -7.7822, 110.399, 6],
  ["Sunken sidewalk, Malioboro", "road", "low", "resolved", -7.7929, 110.3659, 12],
  ["Streetlights out, Gejayan", "streetlight", "high", "pending", -7.7714, 110.3905, 2],
  ["Flickering park lights, Alun-Alun Kidul", "streetlight", "low", "in-progress", -7.812, 110.364, 5],
  ["Leaning lamp post, Jl. Magelang", "streetlight", "medium", "resolved", -7.756, 110.36, 15],
  ["Garbage pile at Beringharjo Market", "waste", "high", "pending", -7.7986, 110.3657, 1],
  ["Overflowing bins, Taman Pintar", "waste", "medium", "in-progress", -7.8009, 110.368, 4],
  ["Illegal dump in a Condongcatur alley", "waste", "medium", "resolved", -7.7608, 110.402, 10],
  ["Clogged drainage, Sleman", "flood", "high", "pending", -7.716, 110.355, 0],
  ["Flooding at Lempuyangan underpass", "flood", "medium", "in-progress", -7.7893, 110.3752, 3],
  ["Waterlogged walkway, Jl. Kusumanegara", "flood", "low", "resolved", -7.8, 110.388, 9],
];
export const initialReports = rows.map(([title, category, urgency, status, lat, lng, days], i) => {
  const t = BASE - days * 864e5 - i * 36e5;
  const timeline = ORDER.slice(0, ORDER.indexOf(status) + 1).map((s, k) => ({
    status: s, label: L[s], timestamp: new Date(t + k * 1728e5).toISOString(),
    note: k ? "Updated by an officer (simulated data)." : "Report submitted (simulated data).",
  }));
  return {
    id: `UP-2026-${String(i + 1).padStart(5, "0")}`, title, category, urgency,
    description: `Simulated data: ${title.toLowerCase()}. Not a verified citizen report.`,
    coordinates: { lat, lng }, image: null, status, upvotes: (i * 7) % 23,
    createdAt: timeline[0].timestamp, updatedAt: timeline.at(-1).timestamp, timeline,
  };
});
