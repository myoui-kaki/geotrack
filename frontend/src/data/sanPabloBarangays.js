// All 80 barangays of San Pablo City, Laguna (PSA list), shown as "Brgy. <name>".
const NAMES = [
  "Atisan", "Bagong Bayan II-A", "Bagong Pook VI-C",
  "I-A", "I-B", "II-A", "II-B", "II-C", "II-D", "II-E", "II-F",
  "III-A", "III-B", "III-C", "III-D", "III-E", "III-F", "IV-A", "IV-B", "IV-C",
  "V-A", "V-B", "V-C", "V-D", "VI-A", "VI-B", "VI-D", "VI-E",
  "VII-A", "VII-B", "VII-C", "VII-D", "VII-E",
  "Bautista", "Concepcion", "Del Remedio", "Dolores",
  "San Antonio 1", "San Antonio 2", "San Bartolome", "San Buenaventura", "San Crispin", "San Cristobal",
  "San Diego", "San Francisco", "San Gabriel", "San Gregorio", "San Ignacio", "San Isidro", "San Joaquin",
  "San Jose", "San Juan", "San Lorenzo", "San Lucas 1", "San Lucas 2", "San Marcos", "San Mateo",
  "San Miguel", "San Nicolas", "San Pedro", "San Rafael", "San Roque", "San Vicente",
  "Santa Ana", "Santa Catalina", "Santa Cruz", "Santa Elena", "Santa Filomena", "Santa Isabel",
  "Santa Maria", "Santa Maria Magdalena", "Santa Monica", "Santa Veronica",
  "Santiago I", "Santiago II", "Santisimo Rosario", "Santo Angel", "Santo Cristo", "Santo Niño", "Soledad",
];

export const SAN_PABLO_BARANGAYS = NAMES.map(n => `Brgy. ${n}`);
export const SAN_PABLO_CENTER = [14.0683, 121.3256];
