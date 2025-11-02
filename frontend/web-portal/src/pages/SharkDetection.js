import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sharkAPI } from '../services/api';
import { 
  AlertTriangle, 
  Play, 
  MapPin, 
  Clock, 
  Activity,
  Shield,
  Zap,
  Eye,
  Target,
  Filter,
  Calendar,
  Info,
  Camera,
  Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Using default Leaflet markers (same as beach map)

// Component to fit map bounds to all markers
const FitBounds = ({ detections }) => {
  const map = useMap();
  
  useEffect(() => {
    if (detections.length > 0) {
      const bounds = L.latLngBounds(
        detections.map(detection => [detection.latitude, detection.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, detections]);
  
  return null;
};

const SharkDetection = () => {
  const navigate = useNavigate();
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState({
    totalDetections: 0,
    alertsSent: 0,
    sharkTypeStats: [],
    droneStats: [],
    beachStats: []
  });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const imageIdxRef = useRef(0);

  const getLocalImageByIndex = (idx) => {
    const local = ['/images/shark.jpg', '/images/shark1.jpg', '/images/shark2.jpg'];
    return local[((idx % local.length) + local.length) % local.length];
  };

  const resolveImageUrl = (url, detectionId) => {
    if (!url) return getLocalImageByIndex(detectionId ? detectionId.length : 0);
    // Absolute or data URL stays as-is
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Frontend-bundled assets (e.g., /images/...) should be served by the web app itself
    if (url.startsWith('/images/')) return url;
    // Uploaded images are served via API gateway proxy
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    if (url.startsWith('/uploads')) return `${base}${url}`;
    // Fallback: treat as relative upload path
    return `${base}/${url.replace(/^\//, '')}`;
  };
  const [mapCenter, setMapCenter] = useState([-33.8688, 151.2093]); // Sydney coordinates

  const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: '12h', label: 'Last 12 Hours' },
    { value: '2d', label: 'Last 2 Days' },
    { value: '5d', label: 'Last 5 Days' }
  ];

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [detectionsResponse, statsResponse] = await Promise.all([
        sharkAPI.getDetections({ 
          limit: 100, 
          timeFilter 
        }),
        sharkAPI.getStats({ timeFilter })
      ]);
      
      setDetections(detectionsResponse.data);
      setStats(statsResponse.data);
      
      // Update map center to show detections if any exist
      if (detectionsResponse.data.length > 0) {
        const latestDetection = detectionsResponse.data[0];
        setMapCenter([latestDetection.latitude, latestDetection.longitude]);
      }
    } catch (error) {
      console.error('Error loading shark detection data:', error);
      toast.error('Failed to load shark detection data');
    } finally {
      setLoading(false);
    }
  };

  const fetchImageAsBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob); // includes data URL prefix
    });
  };

  const simulateSharkDetection = async () => {
    setSimulating(true);
    try {
      // Predefined coordinates for shark detection simulation
      const detectionCoordinates = [
        { lat: -33.87005861504898, lng: 151.29555834963804 },
        { lat: -33.793767566659916, lng: 151.29866113050207 },
        { lat: -33.879590206238596, lng: 151.31634697929545 },
        { lat: -34.005718946608205, lng: 151.2822163934464 },
        { lat: -34.07154041306987, lng: 151.18540964138447 },
        { lat: -33.94550935177077, lng: 151.3216217056702 },
        { lat: -34.15015058240651, lng: 151.16182850940058 }
      ];
      
      // Select a random coordinate from the predefined list
      const selectedCoord = detectionCoordinates[Math.floor(Math.random() * detectionCoordinates.length)];
      
      // Simulate a drone reporting a shark detection
      // Load a local bundled image (randomly from /images/shark.jpg, shark1.jpg, shark2.jpg)
      let imageDataUrl = null;
      const localImages = ['/images/shark.jpg', '/images/shark1.jpg', '/images/shark2.jpg'];
      const chosen = localImages[imageIdxRef.current % localImages.length];
      imageIdxRef.current += 1;
      try {
        // add cache-buster to ensure browser fetches each file freshly
        imageDataUrl = await fetchImageAsBase64(`${chosen}?v=${Date.now()}`);
      } catch (e) {
        console.warn(`Local shark image not found at ${chosen}; proceeding without image`);
      }
      const mockDetection = {
        droneName: 'DRONE-001',
        sharkType: ['Great White', 'Tiger', 'Bull', 'Mako'][Math.floor(Math.random() * 4)],
        size: ['Small', 'Medium', 'Large'][Math.floor(Math.random() * 3)],
        latitude: selectedCoord.lat,
        longitude: selectedCoord.lng,
        accuracy: Math.floor(Math.random() * 30) + 70,
        imageUrl: chosen, // ensure UI has a path even if persist fails
        imageBase64: imageDataUrl,
        metadata: JSON.stringify({
          weather: 'Clear',
          waterTemperature: 22,
          visibility: 'Good'
        })
      };

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/sharks/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockDetection)
      });

      if (response.ok) {
        toast.success('Shark detection simulated successfully!');
        loadData();
      } else {
        throw new Error('Failed to simulate detection');
      }
    } catch (error) {
      console.error('Error simulating shark detection:', error);
      toast.error('Failed to simulate shark detection');
    } finally {
      setSimulating(false);
    }
  };


  const getSharkTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'great white':
      case 'white':
        return 'text-red-600 bg-red-100';
      case 'tiger':
        return 'text-orange-600 bg-orange-100';
      case 'bull':
        return 'text-yellow-600 bg-yellow-100';
      case 'mako':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSizeColor = (size) => {
    switch (size.toLowerCase()) {
      case 'large':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'small':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.round((now - past) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shark-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Shark Detection Center</h1>
        <div className="flex items-center space-x-4">
          {/* Time Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shark-500 focus:border-transparent"
            >
              {timeFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={simulateSharkDetection}
            disabled={simulating}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {simulating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Simulate Detection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Detections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDetections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alerts Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alertsSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Navigation className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.droneStats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monitored Beaches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.beachStats.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Shark Detection Map
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on markers to view detection details
          </p>
        </div>
            <div className="h-[500px] w-full">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <FitBounds detections={detections} />
            
                {detections.map((detection) => (
                  <Marker
                    key={detection.detectionId}
                    position={[detection.latitude, detection.longitude]}
                  >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="font-semibold text-red-600 mb-2">
                      🦈 {detection.sharkType} Shark Detected
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Drone:</strong> {detection.droneName}</div>
                      <div><strong>Size:</strong> {detection.size}</div>
                      <div><strong>Accuracy:</strong> {detection.accuracy}%</div>
                      <div><strong>Time:</strong> {formatTimeAgo(detection.detectionDate)}</div>
                      <div><strong>Beach:</strong> {detection.beachName}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>


      {/* Shark Type Statistics */}
      {stats.sharkTypeStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Shark Type Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.sharkTypeStats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSharkTypeColor(stat._id)}`}>
                  {stat._id}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.count}</p>
                <p className="text-sm text-gray-600">detections</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Detections List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Recent Detections</h2>
        </div>
        <div className="p-6">
          {detections.length > 0 ? (
            <div className="space-y-4">
              {detections.slice(0, 10).map((detection) => (
                <div 
                  key={detection.detectionId} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={resolveImageUrl(detection.imageUrl, detection.detectionId)}
                          alt="Shark detection"
                          className="h-16 w-24 object-cover rounded cursor-pointer"
                          onClick={(e) => setImagePreviewUrl(e.currentTarget.src)}
                          onError={(e) => { e.currentTarget.src = getLocalImageByIndex((detection.detectionId || '').length); }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSharkTypeColor(detection.sharkType)}`}>
                            {detection.sharkType}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSizeColor(detection.size)}`}>
                            {detection.size}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {detection.accuracy}% accuracy
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Navigation className="h-4 w-4" />
                            <span>{detection.droneName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{detection.beachName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeAgo(detection.detectionDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>{detection.latitude.toFixed(4)}, {detection.longitude.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {detection.alertSent ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Zap className="h-4 w-4" />
                          <span className="text-xs">Alert Sent</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">No Alert</span>
                        </div>
                      )}
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shark detections found for the selected time period</p>
              <p className="text-sm mt-2">Click "Simulate Detection" to test the system</p>
            </div>
          )}
        </div>
      </div>
      {/* Image Preview Modal */}
      {imagePreviewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setImagePreviewUrl(null)}>
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Detection Image</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setImagePreviewUrl(null)}>Close</button>
            </div>
            <img src={imagePreviewUrl} alt="Detection preview" className="w-full h-auto rounded" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SharkDetection;
