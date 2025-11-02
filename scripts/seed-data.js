const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/sharkdetection?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  phone: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  subscribedBeaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
  createdAt: { type: Date, default: Date.now }
});

const beachSchema = new mongoose.Schema({
  name: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  radius: { type: Number, default: 500 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceType: String,
  deviceName: String,
  simCardNumber: String,
  batteryLevel: { type: Number, default: 100 },
  isOnline: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  subscribedBeaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beach' }],
  settings: {
    alertSound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
    locationTracking: { type: Boolean, default: true },
    emergencyMode: { type: Boolean, default: false }
  },
  // New subscriber fields
  phoneNumber: String,
  fullName: String,
  imei: String,
  imsi: String,
  phoneModel: String,
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: { type: Date, default: Date.now }
  },
  geofencingSubscribed: { type: Boolean, default: false },
  subscribedGeofences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }],
  alertsSent: { type: Number, default: 0 },
  lastAlertSent: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Beach = mongoose.model('Beach', beachSchema);
const Device = mongoose.model('Device', deviceSchema);
// Alerts/Notifications schema and model for Alerts page
const notificationSchema = new mongoose.Schema({
  persona: String,
  deviceType: String,
  message: String,
  beachName: String,
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

// Demo data
const demoBeaches = [
  {
    name: 'Bondi Beach',
    location: { latitude: -33.8915, longitude: 151.2767 },
    radius: 500
  },
  {
    name: 'Manly Beach',
    location: { latitude: -33.7969, longitude: 151.2843 },
    radius: 600
  },
  {
    name: 'Cronulla Beach',
    location: { latitude: -34.0544, longitude: 151.1556 },
    radius: 400
  },
  {
    name: 'Coogee Beach',
    location: { latitude: -33.9209, longitude: 151.2603 },
    radius: 450
  },
  {
    name: 'Maroubra Beach',
    location: { latitude: -33.9500, longitude: 151.2594 },
    radius: 550
  }
];

const demoUsers = [
  {
    name: 'Admin',
    username: 'admin',
    email: 'admin@surfers.com',
    password: '$2a$10$HSJ7uBj.Voqbgro4suuR.uwiKAzDFUimY8o9vINX1RZLPlW4d366K', // bcrypt hash for admin password
    phone: '+61400123456',
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+61400123457',
      relationship: 'support'
    }
  },
];

// Generate subscriber data with phone numbers in range +61400500800 to +61400500999
const generateSubscribers = () => {
  const phoneModels = [
    'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro',
    'Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy S22',
    'Google Pixel 8', 'Google Pixel 7', 'Google Pixel 6',
    'OnePlus 12', 'OnePlus 11', 'OnePlus 10',
    'Xiaomi 14', 'Xiaomi 13', 'Xiaomi 12',
    'Huawei P60', 'Huawei P50', 'Huawei Mate 50',
    'Oppo Find X6', 'Oppo Find X5', 'Oppo Reno 10',
    'Vivo X90', 'Vivo X80', 'Vivo V29'
  ];

  const smartWatchModels = [
    'Apple Watch Series 9', 'Apple Watch Series 8', 'Apple Watch SE',
    'Samsung Galaxy Watch 6', 'Samsung Galaxy Watch 5', 'Samsung Galaxy Watch 4',
    'Google Pixel Watch 2', 'Google Pixel Watch',
    'Garmin Venu 3', 'Garmin Forerunner 965', 'Garmin Fenix 7',
    'Fitbit Versa 4', 'Fitbit Sense 2', 'Fitbit Charge 5',
    'Amazfit GTR 4', 'Amazfit GTS 4', 'Amazfit T-Rex Ultra',
    'Huawei Watch GT 4', 'Huawei Watch 3', 'Huawei Band 8',
    'Xiaomi Watch S3', 'Xiaomi Watch S2', 'Xiaomi Band 8',
    'OnePlus Watch 2', 'OnePlus Watch',
    'Fossil Gen 6', 'Fossil Gen 5', 'Fossil Hybrid HR'
  ];

  const firstNames = [
    'James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'John', 'Sophia',
    'Robert', 'Isabella', 'William', 'Charlotte', 'Richard', 'Amelia', 'Joseph',
    'Mia', 'Thomas', 'Harper', 'Christopher', 'Evelyn', 'Daniel', 'Abigail',
    'Matthew', 'Emily', 'Anthony', 'Elizabeth', 'Mark', 'Sofia', 'Donald',
    'Avery', 'Steven', 'Ella', 'Paul', 'Madison', 'Andrew', 'Scarlett',
    'Joshua', 'Victoria', 'Kenneth', 'Aria', 'Kevin', 'Grace', 'Brian', 'Chloe'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  const subscribers = [];
  const startPhone = 500800;
  const endPhone = 500999;
  
  for (let i = 0; i < 50; i++) {
    const phoneNumber = `+61400${String(startPhone + i).padStart(6, '0')}`;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Randomly choose device type (70% smartphones, 30% smart watches)
    const deviceType = Math.random() < 0.7 ? 'smartphone' : 'smartwatch';
    const deviceModel = deviceType === 'smartphone' 
      ? phoneModels[Math.floor(Math.random() * phoneModels.length)]
      : smartWatchModels[Math.floor(Math.random() * smartWatchModels.length)];
    
    // Generate random IMEI (15 digits)
    const imei = Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
    
    // Generate random IMSI (15 digits starting with 505)
    const imsi = '505' + Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
    
    // Random location around Sydney beaches
    const latitude = -33.8 + (Math.random() - 0.5) * 0.3;
    const longitude = 151.2 + (Math.random() - 0.5) * 0.3;
    
    subscribers.push({
      deviceId: `SUB-${String(i + 1).padStart(3, '0')}`,
      phoneNumber,
      fullName: `${firstName} ${lastName}`,
      imei,
      imsi,
      phoneModel: deviceModel,
      deviceType,
      deviceName: deviceModel,
      simCardNumber: phoneNumber,
      batteryLevel: Math.floor(Math.random() * 100) + 1,
      isOnline: Math.random() > 0.2, // 80% online
      lastKnownLocation: {
        latitude,
        longitude,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24h
      },
      geofencingSubscribed: Math.random() > 0.3, // 70% subscribed to geofencing
      alertsSent: Math.floor(Math.random() * 20),
      lastAlertSent: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
      lastSeen: new Date(Date.now() - Math.random() * 60 * 60 * 1000) // Random time in last hour
    });
  }
  
  return subscribers;
};

const demoSubscribers = generateSubscribers();

async function seedData() {
  try {
    console.log('🌊 Starting Shark Detection System data seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Beach.deleteMany({});
    await Device.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Create beaches
    const createdBeaches = await Beach.insertMany(demoBeaches);
    console.log(`✅ Created ${createdBeaches.length} beaches`);
    
    // Create users
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Create subscribers (devices) and associate with beaches
    const subscribersWithBeaches = demoSubscribers.map((subscriber, index) => {
      // Assign 1-3 random beaches to each subscriber
      const numBeaches = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 beaches
      const shuffledBeaches = [...createdBeaches].sort(() => 0.5 - Math.random());
      const selectedBeaches = shuffledBeaches.slice(0, numBeaches).map(beach => beach._id);
      
      return {
        ...subscriber,
        subscribedBeaches: selectedBeaches
      };
    });
    
    const createdSubscribers = await Device.insertMany(subscribersWithBeaches);
    console.log(`✅ Created ${createdSubscribers.length} subscribers`);

    // Create dummy alerts/notifications
    const personas = [
      'Surfers/Tourists','Life Guards','Public Safety','Communities',
      'Surf Instructors','Surf Shop Owners','Marine Biologist'
    ];
    const deviceTypeFromSub = (s) => {
      const t = (s.deviceType || '').toLowerCase();
      if (t.includes('watch')) return 'smartwatch';
      if (t.includes('band')) return 'fitness_band';
      if (t.includes('phone') || t.includes('smart')) return 'smartphone';
      return 'sms';
    };
    const messages = [
      'Shark detected near your area. Please exit water immediately.',
      'High alert: Shark activity detected near the beach boundary.',
      'Caution: Confirmed shark sighting. Follow safety instructions.',
      'Shark alert drill notification.',
    ];
    const alertCount = 150;
    const notifications = [];
    for (let i = 0; i < alertCount; i++) {
      const sub = createdSubscribers[Math.floor(Math.random() * createdSubscribers.length)];
      const beach = createdBeaches[Math.floor(Math.random() * createdBeaches.length)];
      notifications.push({
        persona: personas[Math.floor(Math.random() * personas.length)],
        deviceType: deviceTypeFromSub(sub),
        message: messages[Math.floor(Math.random() * messages.length)],
        beachName: beach.name,
        createdAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000)
      });
    }
    if (typeof Notification !== 'undefined') {
      await Notification.deleteMany({});
      await Notification.insertMany(notifications);
      console.log(`✅ Seeded ${notifications.length} alerts/notifications`);
    }

    // Update users with subscribed beaches
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      // Assign 1-2 random beaches to each user
      const numBeaches = Math.floor(Math.random() * 2) + 1; // 1 or 2 beaches
      const shuffledBeaches = [...createdBeaches].sort(() => 0.5 - Math.random());
      const selectedBeaches = shuffledBeaches.slice(0, numBeaches);
      
      user.subscribedBeaches = selectedBeaches.map(beach => beach._id);
      await user.save();
    }
    console.log('✅ Updated user beach subscriptions');
    
    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Admin Account:');
    console.log('   Username: admin | Password: (see README.md for credentials)');
    console.log('\n📋 Demo User Accounts:');
    console.log('   Username: john.smith | Password: password');
    console.log('   Username: sarah.johnson | Password: password');
    console.log('   Username: alex.chen | Password: password');
    console.log('\n🏖️  Demo Beaches:');
    createdBeaches.forEach(beach => {
      console.log(`   ${beach.name}: ${beach.location.latitude}, ${beach.location.longitude}`);
    });
    console.log('\n📱 Demo Subscribers:');
    createdSubscribers.slice(0, 5).forEach(subscriber => {
        console.log(`   ${subscriber.fullName} (${subscriber.phoneNumber}) - ${subscriber.phoneModel} (${subscriber.deviceType}) - ${subscriber.subscribedBeaches.length} beaches`);
    });
    console.log(`   ... and ${createdSubscribers.length - 5} more subscribers`);
    
    // Show device type distribution
    const smartphoneCount = createdSubscribers.filter(s => s.deviceType === 'smartphone').length;
    const smartwatchCount = createdSubscribers.filter(s => s.deviceType === 'smartwatch').length;
    console.log(`\n📊 Device Type Distribution:`);
    console.log(`   📱 Smartphones: ${smartphoneCount}`);
    console.log(`   ⌚ Smart Watches: ${smartwatchCount}`);
    
    // Show beach subscription distribution
    const beachSubscriptions = createdSubscribers.reduce((acc, subscriber) => {
      const count = subscriber.subscribedBeaches.length;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\n🏖️  Beach Subscription Distribution:`);
    Object.keys(beachSubscriptions).sort().forEach(count => {
      console.log(`   ${count} beach${count > 1 ? 'es' : ''}: ${beachSubscriptions[count]} subscribers`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
