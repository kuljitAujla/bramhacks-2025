/**
 * Service for fetching mission data from the backend API
 */

export interface Mission {
  id: number;
  coordinates: number[][];
  center: [number, number]; // [longitude, latitude]
  reason: "near_trail" | "near_water" | "small_grouped";
  description: string;
}

export interface MissionsResponse {
  missions: Mission[];
}

const API_BASE_URL = "/api";

export async function getAllMissions(): Promise<Mission[]> {
  try {
    console.log(`Fetching from: ${API_BASE_URL}/missions/all`);
    const response = await fetch(`${API_BASE_URL}/missions/all`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch missions: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    const data: MissionsResponse = await response.json();
    console.log("Missions response:", data);
    
    if (!data.missions || !Array.isArray(data.missions)) {
      console.warn("Invalid missions data:", data);
      return [];
    }
    
    // Limit to first 10 missions
    return data.missions.slice(0, 10);
  } catch (error: any) {
    console.error("Error fetching missions:", error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend server. Please make sure it's running on http://localhost:5000");
    }
    throw error;
  }
}

export async function getDecreaseMissions(): Promise<Mission[]> {
  try {
    console.log(`Fetching from: ${API_BASE_URL}/missions/decrease`);
    const response = await fetch(`${API_BASE_URL}/missions/decrease`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch decrease missions: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    const data: MissionsResponse = await response.json();
    console.log("Decrease missions response:", data);
    
    if (!data.missions || !Array.isArray(data.missions)) {
      console.warn("Invalid missions data:", data);
      return [];
    }
    
    return data.missions;
  } catch (error: any) {
    console.error("Error fetching decrease missions:", error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend server. Please make sure it's running on http://localhost:5000");
    }
    throw error;
  }
}

export async function getIncreaseMissions(): Promise<Mission[]> {
  try {
    console.log(`Fetching from: ${API_BASE_URL}/missions/increase`);
    const response = await fetch(`${API_BASE_URL}/missions/increase`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch increase missions: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    const data: MissionsResponse = await response.json();
    console.log("Increase missions response:", data);
    
    if (!data.missions || !Array.isArray(data.missions)) {
      console.warn("Invalid missions data:", data);
      return [];
    }
    
    return data.missions;
  } catch (error: any) {
    console.error("Error fetching increase missions:", error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Cannot connect to backend server. Please make sure it's running on http://localhost:5000");
    }
    throw error;
  }
}

