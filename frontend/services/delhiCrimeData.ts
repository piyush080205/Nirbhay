// Delhi Crime Dataset — Safe Route Generator
// Source: Mock data grounded in NCRB Crime in India 2023/2025, Numbeo Delhi Index,
// Delhi Police district reports, and published spatial crime research.
// Replace with live NCRB / Delhi Police feeds for production use.

export interface CrimeHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance_from_user_km: number;
  district: string;
  police_station: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  dominant_crimes: string[];
  peak_hours: string[];
  safe_hours: string[];
  incident_density_per_sqkm: number;
  notes: string;
}

export interface SafeCorridor {
  id: string;
  name: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  waypoints: { lat: number; lng: number; label: string }[];
  notes: string;
}

export interface PoliceStation {
  name: string;
  lat: number;
  lng: number;
  phone: string;
  distance_from_user_km: number;
}

export interface EmergencyContacts {
  police: string;
  women_helpline: string;
  ambulance: string;
  fire: string;
  unified_emergency: string;
  delhi_police_pcr: string;
}

export interface DelhiCrimeDataset {
  metadata: {
    title: string;
    source: string;
    coverage_center: { lat: number; lng: number; label: string };
    radius_km: number;
    delhi_crime_index_2025: number;
    delhi_safety_index_2025: number;
    risk_level_guide: Record<string, string>;
  };
  user_location: {
    name: string;
    lat: number;
    lng: number;
    pin: string;
    district: string;
    police_station: string;
    local_risk_score: number;
    risk_level: string;
    notes: string;
  };
  crime_hotspots: CrimeHotspot[];
  safe_corridors: SafeCorridor[];
  police_stations_nearby: PoliceStation[];
  emergency_contacts: EmergencyContacts;
}

export const DELHI_CRIME_DATA: DelhiCrimeDataset = {
  metadata: {
    title: 'Delhi Crime Dataset — Safe Route Generator',
    source:
      'Mock data grounded in NCRB Crime in India 2023/2025, Numbeo Delhi Index, Delhi Police district reports, and published spatial crime research',
    coverage_center: { lat: 28.5035, lng: 77.1833, label: 'Satbari, New Delhi, 110074' },
    radius_km: 25,
    delhi_crime_index_2025: 59.03,
    delhi_safety_index_2025: 40.97,
    risk_level_guide: {
      LOW: 'Score 0–39 — Generally safe, standard precautions advised',
      MEDIUM: 'Score 40–59 — Exercise caution, especially at night',
      HIGH: 'Score 60–79 — Avoid isolated routes, stay alert',
      VERY_HIGH: 'Score 80–100 — Avoid if possible, especially after dark',
    },
  },
  user_location: {
    name: 'Satbari',
    lat: 28.5035,
    lng: 77.1833,
    pin: '110074',
    district: 'South West Delhi',
    police_station: 'Chattarpur',
    local_risk_score: 32,
    risk_level: 'LOW',
    notes:
      'Satbari is a semi-rural village near the Aravalli Ridge. Lower density, farmhouses, relatively low crime. Nearest high-risk zones are Mehrauli (~4km) and Sangam Vihar (~6km).',
  },
  crime_hotspots: [
    {
      id: 'HS001',
      name: 'Mehrauli',
      lat: 28.5212,
      lng: 77.1851,
      distance_from_user_km: 2.0,
      district: 'South West Delhi',
      police_station: 'Mehrauli PS',
      risk_score: 68,
      risk_level: 'HIGH',
      dominant_crimes: ['snatching', 'theft', 'eve_teasing', 'robbery'],
      peak_hours: ['20:00–02:00'],
      safe_hours: ['07:00–19:00'],
      incident_density_per_sqkm: 14.2,
      notes:
        'Dense market and heritage area. Narrow lanes reduce escape routes. High snatching incidents near Qutub Minar tourist zone.',
    },
    {
      id: 'HS002',
      name: 'Chattarpur Mandir Road',
      lat: 28.4998,
      lng: 77.1743,
      distance_from_user_km: 1.2,
      district: 'South West Delhi',
      police_station: 'Chattarpur PS',
      risk_score: 38,
      risk_level: 'LOW',
      dominant_crimes: ['theft', 'minor_scuffles'],
      peak_hours: ['22:00–04:00'],
      safe_hours: ['06:00–21:00'],
      incident_density_per_sqkm: 5.1,
      notes:
        'Primarily residential and temple-visiting area. Relatively safe during daytime. Street lighting is poor on side lanes at night.',
    },
    {
      id: 'HS003',
      name: 'Sangam Vihar',
      lat: 28.5127,
      lng: 77.2393,
      distance_from_user_km: 5.8,
      district: 'South Delhi',
      police_station: 'Sangam Vihar PS',
      risk_score: 72,
      risk_level: 'HIGH',
      dominant_crimes: ['snatching', 'robbery', 'assault', 'eve_teasing', 'drug_activity'],
      peak_hours: ['21:00–05:00'],
      safe_hours: ['08:00–19:00'],
      incident_density_per_sqkm: 18.7,
      notes:
        "One of Delhi's most densely populated unauthorised colonies. High snatching and assault rates. Poor lighting and unplanned lanes.",
    },
    {
      id: 'HS004',
      name: 'Saket / Malviya Nagar Market',
      lat: 28.5274,
      lng: 77.2167,
      distance_from_user_km: 4.3,
      district: 'South Delhi',
      police_station: 'Malviya Nagar PS',
      risk_score: 45,
      risk_level: 'MEDIUM',
      dominant_crimes: ['pickpocketing', 'vehicle_theft', 'eve_teasing'],
      peak_hours: ['18:00–23:00'],
      safe_hours: ['09:00–17:00'],
      incident_density_per_sqkm: 8.4,
      notes:
        'Commercial hub. Crowds at Select Citywalk. Vehicle theft from parking lots is common. Generally manageable with awareness.',
    },
    {
      id: 'HS005',
      name: 'Vasant Kunj Sector D / Slum Pocket',
      lat: 28.5196,
      lng: 77.1563,
      distance_from_user_km: 3.9,
      district: 'South West Delhi',
      police_station: 'Vasant Kunj PS',
      risk_score: 55,
      risk_level: 'MEDIUM',
      dominant_crimes: ['snatching', 'theft', 'eve_teasing'],
      peak_hours: ['20:00–01:00'],
      safe_hours: ['07:00–19:00'],
      incident_density_per_sqkm: 9.8,
      notes:
        'Mix of affluent and informal settlement zones. Boundary areas between sectors are higher risk especially after dark.',
    },
    {
      id: 'HS006',
      name: 'Neb Sarai',
      lat: 28.5005,
      lng: 77.2101,
      distance_from_user_km: 2.8,
      district: 'South Delhi',
      police_station: 'Neb Sarai PS',
      risk_score: 60,
      risk_level: 'HIGH',
      dominant_crimes: ['robbery', 'snatching', 'theft'],
      peak_hours: ['21:00–04:00'],
      safe_hours: ['08:00–20:00'],
      incident_density_per_sqkm: 11.3,
      notes:
        'Village settlement integrated into urban fabric. Unplanned narrow lanes. Moderate-to-high robbery risk at night.',
    },
    {
      id: 'HS007',
      name: 'Deoli / Devli',
      lat: 28.5366,
      lng: 77.228,
      distance_from_user_km: 5.1,
      district: 'South Delhi',
      police_station: 'Devli PS',
      risk_score: 65,
      risk_level: 'HIGH',
      dominant_crimes: ['assault', 'snatching', 'drug_activity', 'robbery'],
      peak_hours: ['22:00–05:00'],
      safe_hours: ['08:00–18:00'],
      incident_density_per_sqkm: 13.6,
      notes:
        'Dense urban village. Drug activity flagged in police reports. Avoid isolated inner lanes after dark.',
    },
    {
      id: 'HS008',
      name: 'Sultanpur / Ghitorni',
      lat: 28.4862,
      lng: 77.149,
      distance_from_user_km: 3.5,
      district: 'South West Delhi',
      police_station: 'Vasant Kunj North PS',
      risk_score: 42,
      risk_level: 'MEDIUM',
      dominant_crimes: ['vehicle_theft', 'theft', 'minor_snatching'],
      peak_hours: ['20:00–23:00'],
      safe_hours: ['06:00–19:00'],
      incident_density_per_sqkm: 6.2,
      notes:
        'Near Ghitorni Metro. Mostly safe. Vehicle theft from roadside parking is the primary concern.',
    },
    {
      id: 'HS009',
      name: 'Ambedkar Nagar / Ignou Road',
      lat: 28.544,
      lng: 77.2066,
      distance_from_user_km: 6.8,
      district: 'South Delhi',
      police_station: 'Ambedkar Nagar PS',
      risk_score: 58,
      risk_level: 'MEDIUM',
      dominant_crimes: ['snatching', 'theft', 'molestation'],
      peak_hours: ['19:00–23:00'],
      safe_hours: ['08:00–18:00'],
      incident_density_per_sqkm: 9.1,
      notes:
        'Transitional zone near IGNOU campus. Snatching reported on stretches with low lighting and sparse foot traffic.',
    },
    {
      id: 'HS010',
      name: 'Sarita Vihar',
      lat: 28.5283,
      lng: 77.2891,
      distance_from_user_km: 11.4,
      district: 'South East Delhi',
      police_station: 'Sarita Vihar PS',
      risk_score: 48,
      risk_level: 'MEDIUM',
      dominant_crimes: ['vehicle_theft', 'theft', 'snatching'],
      peak_hours: ['20:00–00:00'],
      safe_hours: ['07:00–19:00'],
      incident_density_per_sqkm: 7.9,
      notes:
        'Planned residential colony. Moderate risk. Snatching near DND Flyway service roads reported.',
    },
    {
      id: 'HS011',
      name: 'Tughlaqabad / Badarpur Border',
      lat: 28.4793,
      lng: 77.2683,
      distance_from_user_km: 10.8,
      district: 'South East Delhi',
      police_station: 'Tughlaqabad PS',
      risk_score: 75,
      risk_level: 'HIGH',
      dominant_crimes: ['robbery', 'assault', 'kidnapping', 'drug_activity'],
      peak_hours: ['21:00–05:00'],
      safe_hours: ['09:00–18:00'],
      incident_density_per_sqkm: 16.4,
      notes:
        'Delhi–Faridabad border corridor. High-risk zone due to inter-state criminal activity. Avoid night transit.',
    },
    {
      id: 'HS012',
      name: 'Jamia Nagar / Okhla',
      lat: 28.56,
      lng: 77.2982,
      distance_from_user_km: 13.9,
      district: 'South East Delhi',
      police_station: 'Jamia Nagar PS',
      risk_score: 66,
      risk_level: 'HIGH',
      dominant_crimes: ['theft', 'snatching', 'molestation', 'robbery'],
      peak_hours: ['21:00–04:00'],
      safe_hours: ['08:00–19:00'],
      incident_density_per_sqkm: 12.8,
      notes:
        'Dense residential with unplanned pockets. Elevated molestation and snatching per district police data.',
    },
    {
      id: 'HS013',
      name: 'Paharganj',
      lat: 28.6448,
      lng: 77.2167,
      distance_from_user_km: 16.4,
      district: 'Central Delhi',
      police_station: 'Paharganj PS',
      risk_score: 82,
      risk_level: 'VERY_HIGH',
      dominant_crimes: ['snatching', 'theft', 'robbery', 'drug_activity', 'scams'],
      peak_hours: ['22:00–04:00'],
      safe_hours: ['10:00–17:00'],
      incident_density_per_sqkm: 24.5,
      notes:
        'Dense transit zone near NDLS. Highest snatching density in Central Delhi. Tourist scams common. Avoid solo walking at night.',
    },
    {
      id: 'HS014',
      name: 'Lajpat Nagar Market',
      lat: 28.57,
      lng: 77.243,
      distance_from_user_km: 9.8,
      district: 'South Delhi',
      police_station: 'Lajpat Nagar PS',
      risk_score: 50,
      risk_level: 'MEDIUM',
      dominant_crimes: ['pickpocketing', 'vehicle_theft', 'eve_teasing'],
      peak_hours: ['17:00–22:00'],
      safe_hours: ['10:00–16:00'],
      incident_density_per_sqkm: 8.6,
      notes:
        'Busy market area. High foot traffic creates pickpocket opportunity. Vehicle break-ins in parking areas.',
    },
    {
      id: 'HS015',
      name: 'Dwarka Sector 3 / Uttam Nagar',
      lat: 28.5894,
      lng: 77.0419,
      distance_from_user_km: 18.2,
      district: 'South West Delhi',
      police_station: 'Dwarka PS',
      risk_score: 53,
      risk_level: 'MEDIUM',
      dominant_crimes: ['theft', 'vehicle_theft', 'snatching'],
      peak_hours: ['20:00–00:00'],
      safe_hours: ['07:00–19:00'],
      incident_density_per_sqkm: 9.0,
      notes:
        'Outer Delhi planned township. Mostly residential. Theft and vehicle crime primary concern.',
    },
  ],
  safe_corridors: [
    {
      id: 'SC001',
      name: 'Satbari → Saket via MG Road',
      risk_score: 28,
      risk_level: 'LOW',
      waypoints: [
        { lat: 28.5035, lng: 77.1833, label: 'Satbari (Origin)' },
        { lat: 28.5085, lng: 77.195, label: 'Dera Mandi' },
        { lat: 28.518, lng: 77.205, label: 'Pushp Vihar' },
        { lat: 28.5274, lng: 77.2167, label: 'Saket Metro' },
      ],
      notes: 'Well-lit arterial road. CCTV coverage. Avoid after 01:00 AM.',
    },
    {
      id: 'SC002',
      name: 'Satbari → Vasant Kunj via NH48 service road',
      risk_score: 22,
      risk_level: 'LOW',
      waypoints: [
        { lat: 28.5035, lng: 77.1833, label: 'Satbari (Origin)' },
        { lat: 28.5012, lng: 77.17, label: 'Andheria More' },
        { lat: 28.5196, lng: 77.1563, label: 'Vasant Kunj Sector A' },
      ],
      notes: 'NH48 well-patrolled. Stay on main carriageway. Avoid service lanes after dark.',
    },
    {
      id: 'SC003',
      name: 'Satbari → AIIMS via Outer Ring Road',
      risk_score: 30,
      risk_level: 'LOW',
      waypoints: [
        { lat: 28.5035, lng: 77.1833, label: 'Satbari (Origin)' },
        { lat: 28.5274, lng: 77.2167, label: 'Saket' },
        { lat: 28.548, lng: 77.2095, label: 'IIT Gate' },
        { lat: 28.5665, lng: 77.21, label: 'AIIMS' },
      ],
      notes: 'Outer Ring Road is a major arterial with good police presence. Well lit.',
    },
  ],
  police_stations_nearby: [
    {
      name: 'Chattarpur Police Station',
      lat: 28.4976,
      lng: 77.1765,
      phone: '011-24135151',
      distance_from_user_km: 1.5,
    },
    {
      name: 'Mehrauli Police Station',
      lat: 28.5205,
      lng: 77.1842,
      phone: '011-26645190',
      distance_from_user_km: 2.2,
    },
    {
      name: 'Vasant Kunj North Police Station',
      lat: 28.523,
      lng: 77.1585,
      phone: '011-26124436',
      distance_from_user_km: 3.7,
    },
    {
      name: 'Malviya Nagar Police Station',
      lat: 28.5337,
      lng: 77.2098,
      phone: '011-29533100',
      distance_from_user_km: 5.4,
    },
  ],
  emergency_contacts: {
    police: '100',
    women_helpline: '1091',
    ambulance: '102',
    fire: '101',
    unified_emergency: '112',
    delhi_police_pcr: '011-23490000',
  },
};

/** Returns hotspots sorted by distance from given coordinates, within maxKm radius */
export function getNearbyHotspots(
  lat: number,
  lng: number,
  maxKm = 10
): CrimeHotspot[] {
  return DELHI_CRIME_DATA.crime_hotspots
    .map((h) => {
      const dist = haversineKm(lat, lng, h.lat, h.lng);
      return { ...h, distance_from_user_km: dist };
    })
    .filter((h) => h.distance_from_user_km <= maxKm)
    .sort((a, b) => a.distance_from_user_km - b.distance_from_user_km);
}

/** Haversine formula – distance in km between two lat/lng points */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Color for a risk level string */
export function riskColor(level: string): string {
  switch (level) {
    case 'LOW':      return '#2ed573';
    case 'MEDIUM':   return '#f39c12';
    case 'HIGH':     return '#ff6b35';
    case 'VERY_HIGH':return '#ff4757';
    default:         return '#888';
  }
}

/** Color for a numeric risk score (0-100, higher = more dangerous) */
export function riskScoreColor(score: number): string {
  if (score < 40) return '#2ed573';
  if (score < 60) return '#f39c12';
  if (score < 80) return '#ff6b35';
  return '#ff4757';
}
