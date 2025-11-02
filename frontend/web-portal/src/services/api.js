import axios from 'axios';

// Use environment variable for API base URL, fallback to localhost for local development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Service URLs for direct access (used in CAMARA geofencing)
// Use environment variables if available, otherwise default to localhost
const GEOFENCE_SERVICE_URL = process.env.REACT_APP_GEOFENCE_SERVICE_URL || 'http://localhost:8003';
const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:8004';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getProfile: (userId) => api.get(`/api/users/profile/${userId}`),
  subscribeBeach: (userId, beachId) => api.post(`/api/users/${userId}/subscribe-beach`, { beachId }),
  getBeaches: () => api.get('/api/beaches'),
  createBeach: (beachData) => api.post('/api/beaches', beachData),
};

// Device API
export const deviceAPI = {
  register: (deviceData) => api.post('/api/devices/register', deviceData),
  getAll: () => api.get('/api/devices'),
  getDevice: (deviceId) => api.get(`/api/devices/${deviceId}`),
  getUserDevices: (userId) => api.get(`/api/devices/user/${userId}`),
  updateLocation: (deviceId, locationData) => api.post(`/api/devices/${deviceId}/location`, locationData),
  updateSettings: (deviceId, settings) => api.put(`/api/devices/${deviceId}/settings`, { settings }),
  subscribeBeach: (deviceId, beachId) => api.post(`/api/devices/${deviceId}/subscribe-beach`, { beachId }),
  unsubscribeBeach: (deviceId, beachId) => api.delete(`/api/devices/${deviceId}/subscribe-beach/${beachId}`),
  getLocationHistory: (deviceId) => api.get(`/api/devices/${deviceId}/locations`),
  updateBattery: (deviceId, batteryLevel) => api.put(`/api/devices/${deviceId}/battery`, { batteryLevel }),
  getStats: () => api.get('/api/devices/stats'),
};

// Geofence API
export const geofenceAPI = {
  create: (geofenceData) => api.post('/api/geofences', geofenceData),
  getAll: () => api.get('/api/geofences'),
  checkLocation: (locationData) => api.post('/api/geofences/check-location', locationData),
  getDeviceLocations: (deviceId) => api.get(`/api/geofences/device/${deviceId}/locations`),
  deactivate: (geofenceId) => api.put(`/api/geofences/${geofenceId}/deactivate`),
  getStats: () => api.get('/api/geofences/stats'),
};

// Notification API
export const notificationAPI = {
  send: (notificationData) => api.post('/api/notifications/send', notificationData),
  getUserNotifications: (userId) => api.get(`/api/notifications/user/${userId}`),
  markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
  registerDevice: (deviceData) => api.post('/api/notifications/register-device', deviceData),
  updateSubscriptions: (deviceId, subscriptions) => api.put(`/api/notifications/device/${deviceId}/subscriptions`, { subscribedBeaches: subscriptions }),
  getStats: () => api.get('/api/notifications/stats'),
  getRecent: (hours) => api.get('/api/notifications', { params: { hours } }),
};

// Shark Detection API
export const sharkAPI = {
  detect: (detectionData) => api.post('/api/sharks/detect', detectionData),
  report: (detectionData) => api.post('/api/sharks/report', detectionData),
  simulate: () => api.post('/api/sharks/simulate'),
  getDetections: (params) => api.get('/api/sharks/detections', { params }),
  getDetectionById: (detectionId) => api.get(`/api/sharks/detections/${detectionId}`),
  getStats: (params) => api.get('/api/sharks/stats', { params }),
  verifyDetection: (detectionId, isVerified) => api.put(`/api/sharks/detections/${detectionId}/verify`, { isVerified }),
};

// Drone API
export const droneAPI = {
  getAll: () => api.get('/api/drones'),
  getById: (droneId) => api.get(`/api/drones/${droneId}`),
  getStats: () => api.get('/api/drones/stats'),
  updateStatus: (droneId, status) => api.put(`/api/drones/${droneId}/status`, { status }),
  updateLocation: (droneId, location) => api.put(`/api/drones/${droneId}/location`, location),
  updateBattery: (droneId, batteryLevel) => api.put(`/api/drones/${droneId}/battery`, { batteryLevel }),
};

// Telstra Location API
const TELSTRA_API_HOST = process.env.REACT_APP_TELSTRA_API_HOST;
const TELSTRA_RAPIDAPI_HOST = process.env.REACT_APP_TELSTRA_RAPIDAPI_HOST;
const TELSTRA_RAPIDAPI_KEY = process.env.REACT_APP_TELSTRA_RAPIDAPI_KEY;

export const telstraLocationAPI = {
  getLocation: (phoneNumber) => {
    if (!TELSTRA_RAPIDAPI_KEY || !TELSTRA_API_HOST || !TELSTRA_RAPIDAPI_HOST) {
      console.error('Telstra API not configured. Please set environment variables.');
      return Promise.reject(new Error('Telstra API not configured'));
    }
    return axios.post(`${TELSTRA_API_HOST}/location-retrieval/v0/retrieve`, 
      { device: { phoneNumber } },
      {
        headers: {
          'x-rapidapi-host': TELSTRA_RAPIDAPI_HOST,
          'x-rapidapi-key': TELSTRA_RAPIDAPI_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export { GEOFENCE_SERVICE_URL, NOTIFICATION_SERVICE_URL };
export default api;
