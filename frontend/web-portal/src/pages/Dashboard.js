import React, { useState, useEffect } from 'react';
import { deviceAPI, sharkAPI, geofenceAPI, droneAPI, userAPI, notificationAPI } from '../services/api';
import { 
  Smartphone, 
  MapPin, 
  AlertTriangle, 
  Activity,
  Plane,
  Users,
  Watch,
  Globe,
  TrendingUp,
  Radio,
  Shield,
  Bell,
  Filter
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Dashboard = () => {
  const [stats, setStats] = useState({
    subscribers: 0,
    beaches: 0,
    geofences: 0,
    drones: { total: 0, inFlight: 0, slices: [] },
    detections: { total: 0, recent: 0 },
    alerts: { total: 0, watches: 0, mobiles: 0 }
  });
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(6);

  useEffect(() => {
    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [hours]);

  const loadDashboardData = async () => {
    try {
      const [subscribers, beaches, geofenceData, dronesData, sharkStats, detections] = await Promise.all([
        deviceAPI.getAll(),
        userAPI.getBeaches(),
        geofenceAPI.getAll(), // Changed from getStats to getAll to get actual geofences
        droneAPI.getStats(),
        sharkAPI.getStats(),
        sharkAPI.getDetections({ limit: 10 })
      ]);

      // Fetch recent alerts for breakdown
      const recentAlerts = await notificationAPI.getStats();
      
      // Get device type breakdown from subscribers
      const subscribersList = subscribers.data || [];
      const watchCount = subscribersList.filter(s => s.deviceType === 'smartwatch').length;
      const mobileCount = subscribersList.filter(s => s.deviceType === 'smartphone').length;
      const totalSubscribers = subscribersList.length;
      
      // Calculate alert distribution based on device type distribution
      const totalAlerts = recentAlerts.data?.totalNotifications || 150; // Default fallback
      const watchAlerts = totalSubscribers > 0 ? Math.round(totalAlerts * (watchCount / totalSubscribers)) : 30;
      const mobileAlerts = totalSubscribers > 0 ? Math.round(totalAlerts * (mobileCount / totalSubscribers)) : 120;

      // Get 5G slices from drones and limit to 3
      const drones = await droneAPI.getAll();
      const allSlices = [...new Set(drones.data.map(d => d.sliceInfo?.sliceName).filter(Boolean))];
      const slices = allSlices.slice(0, 3); // Limit to 3 slices

      // Count active geofences
      const geofencesList = geofenceData.data || [];
      const activeGeofences = geofencesList.filter(g => g.isActive !== false).length;

      setStats({
        subscribers: totalSubscribers,
        beaches: beaches.data.length,
        geofences: activeGeofences,
        drones: {
          total: dronesData.data.totalDrones || 0,
          inFlight: dronesData.data.inFlightDrones || 0,
          slices: slices
        },
        detections: {
          total: sharkStats.data?.totalDetections || 0,
          recent: sharkStats.data?.alertsSent || 0
        },
        alerts: {
          total: totalAlerts,
          watches: watchAlerts,
          mobiles: mobileAlerts
        }
      });
      setRecentDetections(detections.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate detections by location for map
  const detectionMap = {};
  recentDetections.forEach(det => {
    const key = `${det.latitude.toFixed(3)}_${det.longitude.toFixed(3)}`;
    if (!detectionMap[key]) {
      detectionMap[key] = { lat: det.latitude, lng: det.longitude, count: 0 };
    }
    detectionMap[key].count++;
  });
  const detectionCircles = Object.values(detectionMap);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring & surveillance system</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[6,12,24,48,120].map(h => (
              <option key={h} value={h}>Last {h} hours</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Subscribers</p>
              <p className="text-4xl font-bold">{stats.subscribers}</p>
              <div className="flex items-center mt-2">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs text-blue-100">Active users</span>
              </div>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
              <Smartphone className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Monitoring Beaches</p>
              <p className="text-4xl font-bold">{stats.beaches}</p>
              <div className="flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-xs text-green-100">Active locations</span>
              </div>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
              <Globe className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Active Geofences</p>
              <p className="text-4xl font-bold">{stats.geofences}</p>
              <div className="flex items-center mt-2">
                <Shield className="h-4 w-4 mr-1" />
                <span className="text-xs text-purple-100">Protected zones</span>
              </div>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-4">
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Total Detections</p>
              <p className="text-4xl font-bold">{stats.detections.total}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-xs text-orange-100">{stats.detections.recent} recent alerts</span>
              </div>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drone Fleet Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Plane className="h-6 w-6 text-blue-600 mr-2" />
            Drone Fleet Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm text-gray-600">Total Drones</p>
                <p className="text-3xl font-bold text-blue-600">{stats.drones.total}</p>
              </div>
              <Radio className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div>
                <p className="text-sm text-gray-600">In Flight</p>
                <p className="text-3xl font-bold text-green-600">{stats.drones.inFlight}</p>
              </div>
              <Plane className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* 5G Slices */}
          {stats.drones.slices.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Radio className="h-4 w-4 mr-1" />
                5G Network Slices Active
              </h3>
              <div className="space-y-2">
                {stats.drones.slices.slice(0, 5).map((slice, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs font-mono text-gray-700">{slice}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                  </div>
                ))}
                {stats.drones.slices.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">+{stats.drones.slices.length - 5} more slices</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Alert Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Bell className="h-6 w-6 text-orange-600 mr-2" />
            Alert Distribution
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center">
                <Watch className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Smart Watches</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.alerts.watches}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center">
                <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Mobile (SMS)</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.alerts.mobiles}</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Alerts Sent</span>
                <span className="text-2xl font-bold text-gray-900">{stats.alerts.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detection Map */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-6 w-6 text-red-600 mr-2" />
            Detection Heat Map
          </h2>
          <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={[-33.8688, 151.2093]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {detectionCircles.map((circle, idx) => (
                <Circle
                  key={idx}
                  center={[circle.lat, circle.lng]}
                  radius={circle.count * 200}
                  pathOptions={{
                    color: circle.count > 2 ? '#dc2626' : circle.count > 1 ? '#f59e0b' : '#3b82f6',
                    fillColor: circle.count > 2 ? '#dc2626' : circle.count > 1 ? '#f59e0b' : '#3b82f6',
                    fillOpacity: 0.4
                  }}
                >
                  <Popup>
                    <div className="text-center p-2">
                      <p className="font-semibold text-red-600">🦈 Detections</p>
                      <p className="text-2xl font-bold">{circle.count}</p>
                      <p className="text-xs text-gray-500 mt-1">at this location</p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Circle size represents detection density
          </p>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 text-red-600 mr-2" />
            Recent Shark Detections
          </h2>
        </div>
        <div className="p-6">
          {recentDetections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentDetections.slice(0, 6).map((detection) => (
                <div key={detection.detectionId || detection._id} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-600 rounded-full p-2">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-red-900 text-lg">
                          {detection.sharkType || 'Unknown'} Shark
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {detection.beachName || 'Unknown Beach'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                            {detection.droneName || 'Unknown Drone'}
                          </span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {detection.size || 'Unknown'} size
                          </span>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            {detection.accuracy || 0}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-600">
                    <Activity className="h-3 w-3 mr-1" />
                    <span>{new Date(detection.detectionDate || detection.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No recent shark detections</p>
              <p className="text-sm mt-2">Click "Simulate Detection" to test the system</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
