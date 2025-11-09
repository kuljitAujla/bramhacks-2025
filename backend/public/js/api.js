// API utility functions
const API_BASE_URL = window.location.origin + '/api';

class DashboardAPI {
  static async getOverview() {
    const response = await fetch(`${API_BASE_URL}/dashboard/overview`);
    return response.json();
  }

  static async getDrones() {
    const response = await fetch(`${API_BASE_URL}/dashboard/drones`);
    return response.json();
  }

  static async getMissions() {
    const response = await fetch(`${API_BASE_URL}/dashboard/missions`);
    return response.json();
  }

  static async getAnalytics() {
    const response = await fetch(`${API_BASE_URL}/dashboard/analytics`);
    return response.json();
  }

  static async getAlerts() {
    const response = await fetch(`${API_BASE_URL}/dashboard/alerts`);
    return response.json();
  }

  static async getLiveMissions() {
    const response = await fetch(`${API_BASE_URL}/dashboard/live-missions`);
    return response.json();
  }

  static async getMissionUpdates(missionId) {
    const response = await fetch(`${API_BASE_URL}/dashboard/mission/${missionId}/updates`);
    return response.json();
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toLocaleString();
}

// Format percentage
function formatPercent(num) {
  return num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
}

// Format date/time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

