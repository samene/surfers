const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/sharkdetection?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Drone Schema (same as in drone service)
const droneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  range: { type: Number, required: true },
  batteryCapacity: { type: Number, required: true },
  currentBatteryLevel: { type: Number, min: 0, max: 100, default: 100 },
  status: { 
    type: String, 
    enum: ['active', 'charging', 'maintenance', 'offline', 'in_flight'], 
    default: 'offline' 
  },
  hdResolution: { type: String, required: true },
  phoneNumber: { type: String, required: false, unique: true },
  imeiNumber: { type: String, required: true, unique: true },
  ipAddress: { type: String, required: true },
  flightTime: { type: Number, default: 0 },
  maxFlightTime: { type: Number, required: true },
  lastMaintenanceDate: { type: Date, default: Date.now },
  nextMaintenanceDate: { type: Date },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    altitude: { type: Number }
  },
  patrollingBeach: { type: String, required: true },
  sliceInfo: {
    sliceName: { type: String },
    latency: { type: String },
    bandwidth: { type: String },
    priority: { type: String },
    qosClass: { type: String },
    sliceId: { type: String },
    plmn: { type: String }
  },
  lastSharkDetection: {
    timestamp: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    confidence: { type: Number, min: 0, max: 100 },
    imageUrl: { type: String },
    sharkType: { type: String }
  },
  totalSharkDetections: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Drone = mongoose.model('Drone', droneSchema);

// Mock drone data
const mockDrones = [
  {
    name: "DRONE-001",
    brand: "DJI",
    model: "Matrice 300 RTK",
    range: 15,
    batteryCapacity: 5000,
    currentBatteryLevel: 85,
    status: "in_flight",
    hdResolution: "4K",
    phoneNumber: "+61400500800",
    imeiNumber: "357123456789001",
    ipAddress: "192.168.1.101",
    maxFlightTime: 55,
    location: {
      latitude: -33.8915,
      longitude: 151.2767,
      altitude: 120
    },
    patrollingBeach: "Bondi Beach",
    sliceInfo: {
      sliceName: "Slice-URLLC-01",
      latency: "<10ms",
      bandwidth: "100Mbps UL / 200Mbps DL",
      priority: "critical video",
      qosClass: "5QI-85",
      sliceId: "001-URLLC",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      location: {
        latitude: -33.8920,
        longitude: 151.2770
      },
      confidence: 92,
      sharkType: "Great White Shark"
    },
    totalSharkDetections: 3
  },
  {
    name: "DRONE-002",
    brand: "Parrot",
    model: "Anafi USA",
    range: 12,
    batteryCapacity: 3200,
    currentBatteryLevel: 45,
    status: "charging",
    hdResolution: "4K",
    phoneNumber: "+61400500801",
    imeiNumber: "357123456789002",
    ipAddress: "192.168.1.102",
    maxFlightTime: 32,
    location: {
      latitude: -33.8900,
      longitude: 151.2750,
      altitude: 0
    },
    patrollingBeach: "Manly Beach",
    sliceInfo: {
      sliceName: "Slice-eMBB-02",
      latency: "<20ms",
      bandwidth: "50Mbps UL / 500Mbps DL",
      priority: "standard streaming",
      qosClass: "5QI-9",
      sliceId: "002-eMBB",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      location: {
        latitude: -33.8905,
        longitude: 151.2755
      },
      confidence: 88,
      sharkType: "Tiger Shark"
    },
    totalSharkDetections: 2
  },
  {
    name: "DRONE-003",
    brand: "Autel",
    model: "EVO II Pro",
    range: 9,
    batteryCapacity: 7100,
    currentBatteryLevel: 92,
    status: "in_flight",
    hdResolution: "6K",
    phoneNumber: "+61400500802",
    imeiNumber: "357123456789003",
    ipAddress: "192.168.1.103",
    maxFlightTime: 40,
    location: {
      latitude: -33.8930,
      longitude: 151.2780,
      altitude: 150
    },
    patrollingBeach: "Coogee Beach",
    sliceInfo: {
      sliceName: "Slice-URLLC-02",
      latency: "<8ms",
      bandwidth: "120Mbps UL / 250Mbps DL",
      priority: "critical control",
      qosClass: "5QI-82",
      sliceId: "003-URLLC",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      location: {
        latitude: -33.8935,
        longitude: 151.2785
      },
      confidence: 95,
      sharkType: "Bull Shark"
    },
    totalSharkDetections: 4
  },
  {
    name: "DRONE-004",
    brand: "DJI",
    model: "Mavic 3 Enterprise",
    range: 8,
    batteryCapacity: 5000,
    currentBatteryLevel: 78,
    status: "charging",
    hdResolution: "4K",
    phoneNumber: "+61400500803",
    imeiNumber: "357123456789004",
    ipAddress: "192.168.1.104",
    maxFlightTime: 45,
    location: {
      latitude: -33.8890,
      longitude: 151.2740,
      altitude: 0
    },
    patrollingBeach: "Cronulla Beach",
    sliceInfo: {
      sliceName: "Slice-mMTC-01",
      latency: "<50ms",
      bandwidth: "10Mbps UL / 10Mbps DL",
      priority: "telemetry",
      qosClass: "5QI-6",
      sliceId: "004-mMTC",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      location: {
        latitude: -33.8895,
        longitude: 151.2745
      },
      confidence: 76,
      sharkType: "Hammerhead Shark"
    },
    totalSharkDetections: 1
  },
  {
    name: "DRONE-005",
    brand: "Skydio",
    model: "X2",
    range: 6,
    batteryCapacity: 4000,
    currentBatteryLevel: 15,
    status: "charging",
    hdResolution: "4K",
    phoneNumber: "+61400500804",
    imeiNumber: "357123456789005",
    ipAddress: "192.168.1.105",
    maxFlightTime: 35,
    location: {
      latitude: -33.8880,
      longitude: 151.2730,
      altitude: 0
    },
    patrollingBeach: "Maroubra Beach",
    sliceInfo: {
      sliceName: "Slice-eMBB-03",
      latency: "<25ms",
      bandwidth: "40Mbps UL / 400Mbps DL",
      priority: "mapping payload",
      qosClass: "5QI-8",
      sliceId: "005-eMBB",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      location: {
        latitude: -33.8885,
        longitude: 151.2735
      },
      confidence: 82,
      sharkType: "Mako Shark"
    },
    totalSharkDetections: 2
  },
  {
    name: "DRONE-006",
    brand: "DJI",
    model: "Inspire 2",
    range: 7,
    batteryCapacity: 4280,
    currentBatteryLevel: 60,
    status: "charging",
    hdResolution: "5.2K",
    phoneNumber: "+61400500805",
    imeiNumber: "357123456789006",
    ipAddress: "192.168.1.106",
    maxFlightTime: 27,
    location: {
      latitude: -33.8870,
      longitude: 151.2720,
      altitude: 0
    },
    patrollingBeach: "Bondi Beach",
    sliceInfo: {
      sliceName: "Slice-URLLC-03",
      latency: "<12ms",
      bandwidth: "90Mbps UL / 180Mbps DL",
      priority: "critical video",
      qosClass: "5QI-84",
      sliceId: "006-URLLC",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      location: {
        latitude: -33.8875,
        longitude: 151.2725
      },
      confidence: 89,
      sharkType: "Great White Shark"
    },
    totalSharkDetections: 1
  },
  {
    name: "DRONE-007",
    brand: "Parrot",
    model: "Bebop 2 Power",
    range: 4,
    batteryCapacity: 2700,
    currentBatteryLevel: 95,
    status: "charging",
    hdResolution: "1080p",
    phoneNumber: "+61400500806",
    imeiNumber: "357123456789007",
    ipAddress: "192.168.1.107",
    maxFlightTime: 25,
    location: {
      latitude: -33.8860,
      longitude: 151.2710,
      altitude: 0
    },
    patrollingBeach: "Manly Beach",
    sliceInfo: {
      sliceName: "Slice-eMBB-04",
      latency: "<30ms",
      bandwidth: "30Mbps UL / 300Mbps DL",
      priority: "non-critical video",
      qosClass: "5QI-7",
      sliceId: "007-eMBB",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      location: {
        latitude: -33.8865,
        longitude: 151.2715
      },
      confidence: 91,
      sharkType: "Bull Shark"
    },
    totalSharkDetections: 0
  },
  {
    name: "DRONE-008",
    brand: "Autel",
    model: "EVO Lite+",
    range: 10,
    batteryCapacity: 4500,
    currentBatteryLevel: 35,
    status: "charging",
    hdResolution: "4K",
    phoneNumber: "+61400500807",
    imeiNumber: "357123456789008",
    ipAddress: "192.168.1.108",
    maxFlightTime: 40,
    location: {
      latitude: -33.8850,
      longitude: 151.2700,
      altitude: 0
    },
    patrollingBeach: "Cronulla Beach",
    sliceInfo: {
      sliceName: "Slice-mMTC-02",
      latency: "<60ms",
      bandwidth: "8Mbps UL / 8Mbps DL",
      priority: "sensors",
      qosClass: "5QI-5",
      sliceId: "008-mMTC",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      location: {
        latitude: -33.8855,
        longitude: 151.2705
      },
      confidence: 85,
      sharkType: "Tiger Shark"
    },
    totalSharkDetections: 0
  },
  {
    name: "DRONE-009",
    brand: "DJI",
    model: "Mini 3 Pro",
    range: 12,
    batteryCapacity: 2453,
    currentBatteryLevel: 88,
    status: "maintenance",
    hdResolution: "4K",
    phoneNumber: "+61400500808",
    imeiNumber: "357123456789009",
    ipAddress: "192.168.1.109",
    maxFlightTime: 47,
    location: {
      latitude: -33.8840,
      longitude: 151.2690,
      altitude: 0
    },
    patrollingBeach: "Coogee Beach",
    sliceInfo: {
      sliceName: "Slice-eMBB-05",
      latency: "<22ms",
      bandwidth: "60Mbps UL / 350Mbps DL",
      priority: "maintenance diagnostics",
      qosClass: "5QI-8",
      sliceId: "009-eMBB",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      location: {
        latitude: -33.8845,
        longitude: 151.2695
      },
      confidence: 93,
      sharkType: "Hammerhead Shark"
    },
    totalSharkDetections: 0
  },
  {
    name: "DRONE-010",
    brand: "Skydio",
    model: "2+",
    range: 5,
    batteryCapacity: 3500,
    currentBatteryLevel: 25,
    status: "charging",
    hdResolution: "4K",
    phoneNumber: "+61400500809",
    imeiNumber: "357123456789010",
    ipAddress: "192.168.1.110",
    maxFlightTime: 23,
    location: {
      latitude: -33.8830,
      longitude: 151.2680,
      altitude: 0
    },
    patrollingBeach: "Maroubra Beach",
    sliceInfo: {
      sliceName: "Slice-eMBB-06",
      latency: "<28ms",
      bandwidth: "35Mbps UL / 280Mbps DL",
      priority: "video backup",
      qosClass: "5QI-9",
      sliceId: "010-eMBB",
      plmn: "505-01"
    },
    lastSharkDetection: {
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
      location: {
        latitude: -33.8835,
        longitude: 151.2685
      },
      confidence: 87,
      sharkType: "Mako Shark"
    },
    totalSharkDetections: 0
  }
];

async function seedDrones() {
  try {
    console.log('Starting drone data seeding...');
    
    // Clear existing drones
    await Drone.deleteMany({});
    console.log('Cleared existing drone data');
    
    // Insert mock drones
    const createdDrones = await Drone.insertMany(mockDrones);
    console.log(`Successfully created ${createdDrones.length} drones`);
    
    // Display summary
    console.log('\nDrone Fleet Summary:');
    console.log('==================');
    
    const statusCounts = await Drone.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count} drones`);
    });
    
    const totalDetections = await Drone.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSharkDetections' } } }
    ]);
    
    console.log(`\nTotal shark detections: ${totalDetections[0]?.total || 0}`);
    console.log('\nDrone seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding drone data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDrones();
