import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Battery, 
  BatteryWarning, 
  BatteryFull,
  MapPin,
  Camera,
  Clock,
  Activity,
  ChevronDown,
  ChevronRight,
  Plane,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { droneAPI, telstraLocationAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet (same as other pages)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DroneManagement = () => {
  const [searchParams] = useSearchParams();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDrone, setExpandedDrone] = useState(null);
  const [stats, setStats] = useState({});
  const [telstraLocation, setTelstraLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchDrones();
    fetchStats();
  }, []);

  useEffect(() => {
    // Check if there's an expand parameter in the URL
    const expandDroneId = searchParams.get('expand');
    if (expandDroneId) {
      // Find the drone by name (since detection.droneId is the drone name)
      const droneToExpand = drones.find(drone => drone.name === expandDroneId);
      if (droneToExpand) {
        setExpandedDrone(droneToExpand._id);
      }
    }
  }, [searchParams, drones]);

  useEffect(() => {
    if (!expandedDrone) return;
    const selected = drones.find(d => d._id === expandedDrone);
    if (selected?.phoneNumber) {
      fetchTelstraLocation(selected.phoneNumber);
    } else {
      setTelstraLocation(null);
    }
  }, [expandedDrone, drones]);

  const fetchDrones = async () => {
    try {
      const response = await droneAPI.getAll();
      setDrones(response.data);
    } catch (error) {
      console.error('Error fetching drones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await droneAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTelstraLocation = async (phoneNumber) => {
    try {
      setLocationLoading(true);
      const response = await telstraLocationAPI.getLocation(phoneNumber);
      setTelstraLocation(response.data);
    } catch (e) {
      // silent fail as requested pattern
      setTelstraLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_flight':
        return <Plane className="w-4 h-4 text-blue-500" />;
      case 'charging':
        return <Battery className="w-4 h-4 text-yellow-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_flight':
        return 'bg-blue-100 text-blue-800';
      case 'charging':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryIcon = (level) => {
    if (level > 75) return <BatteryFull className="w-4 h-4 text-green-500" />;
    if (level > 25) return <Battery className="w-4 h-4 text-yellow-500" />;
    return <BatteryWarning className="w-4 h-4 text-red-500" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drone fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Drone Fleet Management</h1>
          <p className="mt-2 text-gray-600">Monitor and manage your shark detection drone fleet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Plane className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Drones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDrones || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Plane className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Flight</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inFlightDrones || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drones List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Drone Fleet</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {drones.map((drone) => (
              <div key={drone._id} className="p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => setExpandedDrone(expandedDrone === drone._id ? null : drone._id)}
                >
                  <div className="flex items-center space-x-4">
                    {expandedDrone === drone._id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(drone.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{drone.name}</h3>
                        <p className="text-sm text-gray-600">{drone.brand} {drone.model}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      {getBatteryIcon(drone.currentBatteryLevel)}
                      <span className="text-sm text-gray-600">{drone.currentBatteryLevel}%</span>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(drone.status)}`}>
                      {drone.status.replace('_', ' ')}
                    </span>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Patrolling</p>
                      <p className="text-sm font-medium text-gray-900">{drone.patrollingBeach}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Last Detection</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTimeAgo(drone.lastSharkDetection?.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedDrone === drone._id && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Drone Specifications</h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Range</dt>
                          <dd className="text-sm font-medium text-gray-900">{drone.range} km</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Battery Capacity</dt>
                          <dd className="text-sm font-medium text-gray-900">{drone.batteryCapacity} mAh</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Max Flight Time</dt>
                          <dd className="text-sm font-medium text-gray-900">{drone.maxFlightTime} min</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Resolution</dt>
                          <dd className="text-sm font-medium text-gray-900">{drone.hdResolution}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">IMEI</dt>
                          <dd className="text-sm font-medium text-gray-900 font-mono">{drone.imeiNumber}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">IP Address</dt>
                          <dd className="text-sm font-medium text-gray-900 font-mono">{drone.ipAddress}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    {/* 5G Slice Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">5G Slice Information</h4>
                      {drone.sliceInfo ? (
                        <dl className="space-y-3">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Slice Name</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.sliceName || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Latency</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.latency || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Bandwidth</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.bandwidth || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Priority</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.priority || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">QoS Class</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.qosClass || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">Slice ID</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.sliceId || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">PLMN</dt>
                            <dd className="text-sm font-medium text-gray-900">{drone.sliceInfo.plmn || 'N/A'}</dd>
                          </div>
                        </dl>
                      ) : (
                        <p className="text-sm text-gray-500">No slice information available.</p>
                      )}
                    </div>

                    {/* Location and Detection Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Current Status</h4>
                      
                      {/* Only show live (Telstra) location; drone local location map removed per request */}
                      
                      {drone.lastSharkDetection && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Camera className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Last Shark Detection</span>
                          </div>
                          <div className="text-sm text-gray-600 ml-6">
                            <p className="flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(drone.lastSharkDetection.timestamp)}</span>
                            </p>
                            <p>Type: {drone.lastSharkDetection.sharkType}</p>
                            <p>Confidence: {drone.lastSharkDetection.confidence}%</p>
                            <p>Total Detections: {drone.totalSharkDetections}</p>
                          </div>
                        </div>
                      )}

                      {/* Telstra Location Map (moved from subscribers) */}
                      {locationLoading && !telstraLocation && (
                        <div className="mt-4 h-64 w-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          <div className="flex items-center text-gray-600">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                            <span>Fetching network location...</span>
                          </div>
                        </div>
                      )}

                      {telstraLocation?.area?.center && (
                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Network Location</span>
                            {locationLoading && (
                              <span className="text-xs text-gray-500">updating...</span>
                            )}
                          </div>
                          <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
                            <MapContainer
                              center={[telstraLocation.area.center.latitude, telstraLocation.area.center.longitude]}
                              zoom={13}
                              style={{ height: '100%', width: '100%' }}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              />
                              <Marker position={[telstraLocation.area.center.latitude, telstraLocation.area.center.longitude]} />
                              {telstraLocation.area.areaType === 'CIRCLE' && (
                                <Circle
                                  center={[telstraLocation.area.center.latitude, telstraLocation.area.center.longitude]}
                                  radius={telstraLocation.area.radius}
                                  pathOptions={{ color: '#2563eb', fillColor: '#93c5fd', fillOpacity: 0.2 }}
                                />
                              )}
                            </MapContainer>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            <p>Last updated: {new Date(telstraLocation.lastLocationTime).toLocaleString()}</p>
                            <p>Lat: {telstraLocation.area.center.latitude.toFixed(6)}, Lng: {telstraLocation.area.center.longitude.toFixed(6)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneManagement;
