
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Please enter a valid IP address']
  },
  protocol: {
    type: String,
    enum: ['modbus', 'dnp3', 'opcua', 'ethernet-ip', 'profinet', 'other'],
    default: 'modbus'
  },
  firmwareVersion: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'inactive'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  metrics: {
    cpuLoad: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    memoryUsage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    temperature: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 0
    }
  },
  securitySettings: {
    encryptionEnabled: {
      type: Boolean,
      default: false
    },
    authenticationRequired: {
      type: Boolean,
      default: true
    },
    lastSecurityScan: {
      type: Date,
      default: null
    },
    vulnerabilitiesFound: {
      type: Number,
      default: 0
    },
    patchStatus: {
      type: String,
      enum: ['up-to-date', 'pending', 'outdated', 'critical'],
      default: 'pending'
    }
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
DeviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;
