import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { deviceAPI, userAPI } from '../services/api';
import { 
  Smartphone, 
  Plus, 
  Battery, 
  MapPin, 
  Settings, 
  Trash2,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const DeviceManagement = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [beaches, setBeaches] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    deviceType: 'smartwatch',
    deviceName: '',
    simCardNumber: '',
    subscribedBeaches: []
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [devicesResponse, beachesResponse] = await Promise.all([
        deviceAPI.getUserDevices(user.id),
        userAPI.getBeaches()
      ]);
      
      setDevices(devicesResponse.data);
      setBeaches(beachesResponse.data);
    } catch (error) {
      console.error('Error loading device data:', error);
      toast.error('Failed to load device data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    
    try {
      const deviceData = {
        ...newDevice,
        userId: user.id
      };
      
      await deviceAPI.register(deviceData);
      toast.success('Device registered successfully!');
      setShowAddDevice(false);
      setNewDevice({
        deviceId: '',
        deviceType: 'smartwatch',
        deviceName: '',
        simCardNumber: '',
        subscribedBeaches: []
      });
      loadData();
    } catch (error) {
      console.error('Error registering device:', error);
      toast.error('Failed to register device');
    }
  };

  const handleBeachSubscription = async (deviceId, beachId, isSubscribed) => {
    try {
      if (isSubscribed) {
        await deviceAPI.unsubscribeBeach(deviceId, beachId);
        toast.success('Unsubscribed from beach');
      } else {
        await deviceAPI.subscribeBeach(deviceId, beachId);
        toast.success('Subscribed to beach');
      }
      loadData();
    } catch (error) {
      console.error('Error updating beach subscription:', error);
      toast.error('Failed to update beach subscription');
    }
  };

  const getBatteryColor = (level) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeviceTypeIcon = (type) => {
    switch (type) {
      case 'smartwatch':
        return <Smartphone className="h-6 w-6" />;
      case 'fitness_band':
        return <Battery className="h-6 w-6" />;
      case 'phone':
        return <Smartphone className="h-6 w-6" />;
      default:
        return <Smartphone className="h-6 w-6" />;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please login to manage your devices.</p>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-800">Device Management</h1>
        <button
          onClick={() => setShowAddDevice(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Device</h2>
            
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device ID
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., DEVICE-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type
                </label>
                <select
                  value={newDevice.deviceType}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="smartwatch">Smart Watch</option>
                  <option value="fitness_band">Fitness Band</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.deviceName}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Apple Watch Series 9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIM Card Number
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.simCardNumber}
                  onChange={(e) => setNewDevice({ ...newDevice, simCardNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., +1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscribe to Beaches
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {beaches.map(beach => (
                    <label key={beach._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newDevice.subscribedBeaches.includes(beach._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDevice({
                              ...newDevice,
                              subscribedBeaches: [...newDevice.subscribedBeaches, beach._id]
                            });
                          } else {
                            setNewDevice({
                              ...newDevice,
                              subscribedBeaches: newDevice.subscribedBeaches.filter(id => id !== beach._id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{beach.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Device
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDevice(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devices Grid */}
      {devices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <div key={device.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getDeviceTypeIcon(device.deviceType)}
                  <div>
                    <h3 className="font-semibold text-gray-800">{device.deviceName}</h3>
                    <p className="text-sm text-gray-600">{device.deviceId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {device.isOnline ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    {device.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Battery Level</span>
                  <div className="flex items-center space-x-2">
                    <Battery className="h-4 w-4" />
                    <span className={`text-sm font-medium ${getBatteryColor(device.batteryLevel)}`}>
                      {device.batteryLevel}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Seen</span>
                  <span className="text-sm text-gray-800">
                    {new Date(device.lastSeen).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SIM Card</span>
                  <span className="text-sm text-gray-800">{device.simCardNumber}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Subscribed Beaches</h4>
                <div className="space-y-1">
                  {beaches.map(beach => {
                    const isSubscribed = device.subscribedBeaches.some(sub => sub._id === beach._id);
                    return (
                      <div key={beach._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{beach.name}</span>
                        <button
                          onClick={() => handleBeachSubscription(device.deviceId, beach._id, isSubscribed)}
                          className={`p-1 rounded ${
                            isSubscribed 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {isSubscribed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Devices Registered</h3>
          <p className="text-gray-600 mb-4">Register your first wearable device to start receiving shark alerts.</p>
          <button
            onClick={() => setShowAddDevice(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Register Device
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
