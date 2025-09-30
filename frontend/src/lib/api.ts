// Simple API client for backend endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Types aligned with backend/schemas.py (subset we use)
export type AssessmentCreate = {
  name: string;
  location: string;
  dwellers: number;
  roof_area: number;
  open_space: number;
  roof_type: string;
  roof_age: number;
};

export type Assessment = AssessmentCreate & {
  id: number;
  latitude?: number | null;
  longitude?: number | null;
  soil_type?: string | null;
  aquifer_type?: string | null;
  water_depth?: number | null;
  annual_rainfall?: number | null;
  runoff_coefficient?: number | null;
  recommended_structure?: string | null;
  annual_harvestable_water?: number | null;
  installation_cost?: number | null;
  payback_period?: number | null;
};

export type RainfallResponse = {
  annual_rainfall: number;
  monthly_breakdown: number[];
  success: boolean;
};

export type GroundwaterResponse = {
  depth_to_water: number;
  aquifer_type: string;
  water_quality: string;
  success: boolean;
};

export type AquiferInfoResponse = {
  description: string;
  recharge_potential: string;
  suitable_structures: string[];
  success: boolean;
};

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createAssessment: (payload: AssessmentCreate) =>
    http<Assessment>(`/assessments/`, { method: 'POST', body: JSON.stringify(payload) }),
  getAssessment: (id: number) => http<Assessment>(`/assessments/${id}`),
  getRainfall: (latitude: number, longitude: number) =>
    http<RainfallResponse>(`/api/rainfall`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  getGroundwater: (latitude: number, longitude: number) =>
    http<GroundwaterResponse>(`/api/groundwater`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  getAquiferInfo: (aquifer_type: string) =>
    http<AquiferInfoResponse>(`/api/aquifer?aquifer_type=${encodeURIComponent(aquifer_type)}`),
};
