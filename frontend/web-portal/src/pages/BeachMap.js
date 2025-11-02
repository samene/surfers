import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { userAPI, geofenceAPI } from '../services/api';
import { MapPin, Plus, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const BeachMap = () => {
  const [beaches, setBeaches] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedBeach, setSelectedBeach] = useState(null);
  const [isCreatingGeofence, setIsCreatingGeofence] = useState(false);
  const [newGeofenceCenter, setNewGeofenceCenter] = useState(null);
  const [newGeofenceRadius, setNewGeofenceRadius] = useState(500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [beachesResponse, geofencesResponse] = await Promise.all([
        userAPI.getBeaches(),
        geofenceAPI.getAll()
      ]);
      
      setBeaches(beachesResponse.data);
      setGeofences(geofencesResponse.data);
    } catch (error) {
      console.error('Error loading map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (isCreatingGeofence) {
      setNewGeofenceCenter(latlng);
    }
  };

  const startCreatingGeofence = () => {
    setIsCreatingGeofence(true);
    toast.success('Click on the map to set the geofence center');
  };

  const cancelCreatingGeofence = () => {
    setIsCreatingGeofence(false);
    setNewGeofenceCenter(null);
  };

  const createGeofence = async () => {
    if (!newGeofenceCenter || !selectedBeach) {
      toast.error('Please select a beach and click on the map');
      return;
    }

    try {
      const geofenceData = {
        name: `Geofence - ${selectedBeach.name}`,
        latitude: newGeofenceCenter.lat,
        longitude: newGeofenceCenter.lng,
        radius: newGeofenceRadius,
        beachId: selectedBeach._id,
        alertLevel: 'medium'
      };

      await geofenceAPI.create(geofenceData);
      toast.success('Geofence created successfully!');
      loadData();
      cancelCreatingGeofence();
    } catch (error) {
      console.error('Error creating geofence:', error);
      toast.error('Failed to create geofence');
    }
  };

  const deleteGeofence = async (geofenceId) => {
    try {
      await geofenceAPI.deactivate(geofenceId);
      toast.success('Geofence deactivated');
      loadData();
    } catch (error) {
      console.error('Error deleting geofence:', error);
      if (error.response?.status === 400) {
        toast.error('Geofence not found or already deleted');
        // Refresh data to remove stale geofences
        loadData();
      } else {
        toast.error('Failed to delete geofence');
      }
    }
  };

  const getGeofenceColor = (alertLevel) => {
    switch (alertLevel) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Beach Map & Geofences</h1>
        <div className="flex space-x-4">
          <select
            value={selectedBeach?._id || ''}
            onChange={(e) => {
              const beach = beaches.find(b => b._id === e.target.value);
              setSelectedBeach(beach);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Select a beach</option>
            {beaches.map(beach => (
              <option key={beach._id} value={beach._id}>
                {beach.name}
              </option>
            ))}
          </select>
          
          {!isCreatingGeofence ? (
            <button
              onClick={startCreatingGeofence}
              disabled={!selectedBeach}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Geofence</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="number"
                value={newGeofenceRadius}
                onChange={(e) => setNewGeofenceRadius(parseInt(e.target.value))}
                placeholder="Radius (meters)"
                className="border border-gray-300 rounded-lg px-3 py-2 w-32"
              />
              <button
                onClick={createGeofence}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={cancelCreatingGeofence}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-96 w-full">
          <MapContainer
            center={[-33.8688, 151.2093]} // Sydney coordinates
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Beach Markers */}
            {beaches.map(beach => (
              <Marker
                key={beach._id}
                position={[beach.location.latitude, beach.location.longitude]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-lg">{beach.name}</h3>
                    <p className="text-sm text-gray-600">
                      Lat: {beach.location.latitude.toFixed(4)}<br/>
                      Lng: {beach.location.longitude.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Default radius: {beach.radius}m
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Geofence Circles */}
            {geofences.map(geofence => (
              <Circle
                key={geofence._id}
                center={[geofence.center.latitude, geofence.center.longitude]}
                radius={geofence.radius}
                pathOptions={{
                  color: getGeofenceColor(geofence.alertLevel),
                  fillColor: getGeofenceColor(geofence.alertLevel),
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
            ))}
            
            {/* New Geofence Preview */}
            {isCreatingGeofence && newGeofenceCenter && (
              <Circle
                center={[newGeofenceCenter.lat, newGeofenceCenter.lng]}
                radius={newGeofenceRadius}
                pathOptions={{
                  color: 'blue',
                  fillColor: 'blue',
                  fillOpacity: 0.3,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Geofences List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Active Geofences</h2>
        </div>
        <div className="p-6">
          {geofences.length > 0 ? (
            <div className="space-y-4">
              {geofences.map(geofence => (
                <div key={geofence._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full bg-${getGeofenceColor(geofence.alertLevel)}-500`}></div>
                    <div>
                      <p className="font-medium text-gray-800">{geofence.name}</p>
                      <p className="text-sm text-gray-600">
                        Center: {geofence.center.latitude.toFixed(4)}, {geofence.center.longitude.toFixed(4)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Radius: {geofence.radius}m • Alert Level: {geofence.alertLevel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {new Date(geofence.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteGeofence(geofence._id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active geofences</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">High Alert Zone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600">Medium Alert Zone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Low Alert Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeachMap;
