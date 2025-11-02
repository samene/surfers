import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Battery,
  BatteryWarning,
  BatteryFull,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Wifi,
  WifiOff,
  Calendar,
  Hash,
  Globe
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { deviceAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SubscriberDetails = () => {
  const { phoneNumber } = useParams();
  const navigate = useNavigate();
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Telstra location moved to Drone Management page
  const [beaches, setBeaches] = useState([]);

  useEffect(() => {
    fetchSubscriberDetails();
  }, [phoneNumber]);

  // Telstra location retrieval moved to Drone Management

  const fetchSubscriberDetails = async () => {
    try {
      setLoading(true);
      const [subscribersResponse, beachesResponse] = await Promise.all([
        deviceAPI.getAll(),
        userAPI.getBeaches()
      ]);
      
      const decodedPhoneNumber = decodeURIComponent(phoneNumber);
      const foundSubscriber = subscribersResponse.data.find(sub => sub.phoneNumber === decodedPhoneNumber);
      
      if (foundSubscriber) {
        setSubscriber(foundSubscriber);
      } else {
        setError('Subscriber not found');
      }
      
      setBeaches(beachesResponse.data);
    } catch (error) {
      console.error('Error fetching subscriber details:', error);
      setError('Failed to load subscriber details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBeach = async (beachId) => {
    try {
      await deviceAPI.subscribeBeach(subscriber.deviceId, beachId);
      toast.success('Successfully subscribed to beach');
      fetchSubscriberDetails(); // Refresh data
    } catch (error) {
      console.error('Error subscribing to beach:', error);
      toast.error('Failed to subscribe to beach');
    }
  };

  const unsubscribeFromBeach = async (beachId) => {
    try {
      await deviceAPI.unsubscribeBeach(subscriber.deviceId, beachId);
      toast.success('Successfully unsubscribed from beach');
      fetchSubscriberDetails(); // Refresh data
    } catch (error) {
      console.error('Error unsubscribing from beach:', error);
      toast.error('Failed to unsubscribe from beach');
    }
  };

  const getSubscribedBeaches = () => {
    if (!subscriber?.subscribedBeaches || !beaches.length) return [];
    return beaches.filter(beach => 
      subscriber.subscribedBeaches.some(subBeachId => 
        subBeachId.toString() === beach._id.toString()
      )
    );
  };

  const getAvailableBeaches = () => {
    if (!beaches.length) return [];
    const subscribedBeachIds = subscriber?.subscribedBeaches?.map(id => id.toString()) || [];
    return beaches.filter(beach => !subscribedBeachIds.includes(beach._id.toString()));
  };

  // Telstra fetch removed from subscribers page

  const getBatteryIcon = (level) => {
    if (level > 75) return <BatteryFull className="w-5 h-5 text-green-500" />;
    if (level > 25) return <Battery className="w-5 h-5 text-yellow-500" />;
    return <BatteryWarning className="w-5 h-5 text-red-500" />;
  };

  const getStatusIcon = (isOnline) => {
    return isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-gray-400" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'N/A';
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.round((now - past) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const LocationMap = ({ location }) => {
    if (!location) return null;

    const center = location;
    if (!center) return null;

    return (
      <div className="mt-4 h-64 w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Subscriber location marker */}
          <Marker position={[center.latitude, center.longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{subscriber?.fullName}</p>
                <p className="text-sm text-gray-600">{subscriber?.phoneNumber}</p>
                {/* Network last updated removed */}
              </div>
            </Popup>
          </Marker>

          {/* Telstra location display removed */}
        </MapContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shark-600"></div>
      </div>
    );
  }

  if (error || !subscriber) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscriber Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/subscribers')}
          className="bg-shark-600 text-white px-4 py-2 rounded-lg hover:bg-shark-700 transition-colors"
        >
          Back to Subscribers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/subscribers')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Subscribers</span>
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Subscriber Details</h1>
        <div className="flex items-center space-x-2">
          {getStatusIcon(subscriber.isOnline)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscriber.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {subscriber.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Subscriber Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Basic Information</span>
          </h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Full Name</dt>
              <dd className="text-sm text-gray-900">{subscriber.fullName || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Phone Number</dt>
              <dd className="text-sm text-gray-900 font-mono">{subscriber.phoneNumber || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Device ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{subscriber.deviceId || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Phone Model</dt>
              <dd className="text-sm text-gray-900">{subscriber.phoneModel || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Device Type</dt>
              <dd className="text-sm text-gray-900 capitalize">{subscriber.deviceType || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Registration Date</dt>
              <dd className="text-sm text-gray-900">{formatDate(subscriber.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Device Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Device Information</span>
          </h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">IMEI</dt>
              <dd className="text-sm text-gray-900 font-mono">{subscriber.imei || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">IMSI</dt>
              <dd className="text-sm text-gray-900 font-mono">{subscriber.imsi || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">SIM Card Number</dt>
              <dd className="text-sm text-gray-900 font-mono">{subscriber.simCardNumber || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Battery Level</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {getBatteryIcon(subscriber.batteryLevel)}
                <span>{subscriber.batteryLevel}%</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Last Seen</dt>
              <dd className="text-sm text-gray-900">{formatTimeAgo(subscriber.lastSeen)}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Last Update</dt>
              <dd className="text-sm text-gray-900">{formatDate(subscriber.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Beach Subscriptions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Beach Subscriptions</span>
        </h2>
        
        {/* Subscribed Beaches */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Subscribed Beaches</h3>
          {getSubscribedBeaches().length > 0 ? (
            <div className="space-y-2">
              {getSubscribedBeaches().map((beach) => (
                <div key={beach._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{beach.name}</p>
                      <p className="text-sm text-gray-600">
                        {beach.location?.latitude?.toFixed(4)}, {beach.location?.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => unsubscribeFromBeach(beach._id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No beach subscriptions</p>
          )}
        </div>

        {/* Available Beaches */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Available Beaches</h3>
          {getAvailableBeaches().length > 0 ? (
            <div className="space-y-2">
              {getAvailableBeaches().map((beach) => (
                <div key={beach._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{beach.name}</p>
                      <p className="text-sm text-gray-600">
                        {beach.location?.latitude?.toFixed(4)}, {beach.location?.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => subscribeToBeach(beach._id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">All beaches are already subscribed</p>
          )}
        </div>
      </div>

      {/* Location and Geofencing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Information</span>
          </h2>

          {/* Telstra Location Data removed */}


          {/* Local Location Data */}
          {subscriber.lastKnownLocation && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Local Device Location</h3>
              <dl className="space-y-3">
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600">Latitude</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {subscriber.lastKnownLocation.latitude?.toFixed(6) || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600">Longitude</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {subscriber.lastKnownLocation.longitude?.toFixed(6) || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {formatTimeAgo(subscriber.lastKnownLocation.timestamp)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Map Display */}
          <LocationMap 
            location={subscriber.lastKnownLocation}
          />

          {!subscriber.lastKnownLocation && (
            <p className="text-gray-500 text-sm">No location data available.</p>
          )}
        </div>

        {/* Geofencing Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Geofencing</span>
          </h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Subscribed to Geofencing</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {subscriber.geofencingSubscribed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{subscriber.geofencingSubscribed ? 'Yes' : 'No'}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Subscribed Beaches</dt>
              <dd className="text-sm text-gray-900">
                {subscriber.subscribedBeaches?.length || 0} beach(es)
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Alerts Sent</dt>
              <dd className="text-sm text-gray-900">{subscriber.alertsSent || 0}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Last Alert Sent</dt>
              <dd className="text-sm text-gray-900">
                {subscriber.lastAlertSent ? formatTimeAgo(subscriber.lastAlertSent) : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Hash className="h-5 w-5" />
          <span>Device Settings</span>
        </h2>
        {subscriber.settings ? (
          <dl className="space-y-4">
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Alert Sound</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {subscriber.settings.alertSound ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{subscriber.settings.alertSound ? 'Enabled' : 'Disabled'}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Vibration</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {subscriber.settings.vibration ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{subscriber.settings.vibration ? 'Enabled' : 'Disabled'}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Location Tracking</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {subscriber.settings.locationTracking ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{subscriber.settings.locationTracking ? 'Enabled' : 'Disabled'}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm font-medium text-gray-600">Emergency Mode</dt>
              <dd className="text-sm text-gray-900 flex items-center space-x-2">
                {subscriber.settings.emergencyMode ? (
                  <CheckCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-green-500" />
                )}
                <span>{subscriber.settings.emergencyMode ? 'Active' : 'Inactive'}</span>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-500 text-sm">No settings data available</p>
        )}
      </div>
    </div>
  );
};

export default SubscriberDetails;
