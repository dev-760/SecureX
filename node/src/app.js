// SecureX Industrial Security Platform
// Developed by dev-760

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Apply security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Added from original code
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', apiLimiter);

// JWT Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid or expired token'
        });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Device = require('./models/Device');

// API Routes
// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        nodeAccess: user.nodeAccess
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with that username or email'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'worker' // Default role
    });

    await newUser.save();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error'
    });
  }
});

// Device endpoints
app.get('/api/devices', authenticateJWT, async (req, res) => {
  try {
    const devices = await Device.find();
    res.json({
      status: 'success',
      count: devices.length,
      devices
    });
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch devices'
    });
  }
});

app.post('/api/devices', authenticateJWT, async (req, res) => {
  try {
    const device = new Device({
      ...req.body,
      registeredBy: req.user.id
    });

    await device.save();

    res.status(201).json({
      status: 'success',
      message: 'Device added successfully',
      device
    });
  } catch (err) {
    console.error('Error adding device:', err);
    res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to add device'
    });
  }
});

// Node Server connection endpoint
app.get('/api/node-connection', authenticateJWT, (req, res) => {
  res.json({
    status: 'success',
    nodeServerUrl: process.env.NODE_SERVER_URL || 'http://localhost:3000'
  });
});


// Structured logging middleware (from original code)
app.use((req, res, next) => {
  const start = Date.now();

  // Log when the request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }));
  });

  next();
});

//RBAC middleware (from original code)
const rbacMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
  };
};

//Rest of the API routes from original code.  These are largely mock data and would need proper implementation with database interaction in a production environment.
app.get('/api/health', (req, res) => {
  const systemInfo = {
    status: 'ok',
    message: 'SecureX industrial security platform is running',
    version: process.env.APP_VERSION || '1.0.0',
    company: 'dev-760',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    protocols: {
      modbus: industrialProtocols.modbus.enabled,
      dnp3: industrialProtocols.dnp3.enabled,
      opcua: industrialProtocols.opcua.enabled
    }
  };

  res.json(systemInfo);
});

app.post('/api/auth/logout', (req, res) => {
  // In a real app, invalidate the token
  res.json({
    status: 'success',
    message: 'Logout successful'
  });
});

app.get('/api/devices/:id', authenticateJWT, (req, res) => {
  const deviceId = req.params.id;

  // Mock device lookup
  const device = {
    id: deviceId,
    name: 'Control PLC',
    type: 'Siemens S7',
    status: 'active',
    location: 'Factory Floor',
    protocol: 'modbus',
    lastActive: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    firmwareVersion: '3.2.1',
    registeredAt: '2022-08-15T10:30:00Z',
    metrics: {
      cpuLoad: 45,
      memoryUsage: 32,
      temperature: 41,
      uptime: 1209600 // 14 days in seconds
    },
    securityStatus: {
      lastScan: '2023-09-28T14:30:00Z',
      vulnerabilities: 0,
      patchStatus: 'up-to-date',
      encryptionEnabled: true
    }
  };

  res.json({
    status: 'success',
    device: device
  });
});


app.get('/api/alerts', authenticateJWT, (req, res) => {
  // Mock alerts data
  const alerts = [
    {
      id: 'ALT001',
      deviceId: 'DEV002',
      type: 'temperature',
      severity: 'high',
      message: 'Cooling System temperature above threshold',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      status: 'active',
      value: 95,
      threshold: 85
    },
    {
      id: 'ALT002',
      deviceId: 'system',
      type: 'security',
      severity: 'high',
      message: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'active',
      attempts: 5,
      ipAddress: '203.0.113.42'
    },
    {
      id: 'ALT003',
      deviceId: 'DEV004',
      type: 'overload',
      severity: 'medium',
      message: 'Motor Controller reporting overload condition',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'active',
      value: 112,
      threshold: 100
    },
    {
      id: 'ALT004',
      deviceId: 'DEV003',
      type: 'maintenance',
      severity: 'low',
      message: 'Scheduled maintenance for Security Gateway',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'active',
      scheduledDate: new Date(Date.now() + 86400000).toISOString()
    }
  ];

  res.json({
    status: 'success',
    count: alerts.length,
    alerts: alerts
  });
});

app.get('/api/data/:deviceId', authenticateJWT, (req, res) => {
  const deviceId = req.params.deviceId;

  // Mock telemetry data
  const generateData = (count, baseValue, variance) => {
    const data = [];
    let value = baseValue;

    for (let i = 0; i < count; i++) {
      value += (Math.random() - 0.5) * variance;
      data.push({
        timestamp: new Date(Date.now() - (count - i) * 300000).toISOString(),
        value: Math.round(value * 10) / 10
      });
    }

    return data;
  };

  const telemetry = {
    deviceId: deviceId,
    metrics: {
      temperature: generateData(12, 75, 5),
      pressure: generateData(12, 42, 3),
      vibration: generateData(12, 15, 2),
      voltage: generateData(12, 220, 8)
    }
  };

  res.json({
    status: 'success',
    telemetry: telemetry
  });
});

const industrialProtocols = {
  modbus: {
    enabled: true,
    port: 502,
    units: [1, 2, 3],
    registers: {
      '40001': { value: 1024, description: 'Temperature Sensor 1' },
      '40002': { value: 956, description: 'Pressure Sensor 1' },
      '40003': { value: 330, description: 'Flow Rate Meter' }
    }
  },
  dnp3: {
    enabled: false,
    port: 20000,
    outstation: 1
  },
  opcua: {
    enabled: true,
    port: 4840,
    serverId: 'OPCUA-SERVER-1'
  }
};

app.get('/api/protocols', authenticateJWT, rbacMiddleware(['admin', 'manager', 'supervisor']), (req, res) => {
  res.json({
    status: 'success',
    protocols: industrialProtocols
  });
});

app.get('/api/protocols/modbus/registers', authenticateJWT, rbacMiddleware(['admin', 'manager', 'supervisor']), (req, res) => {
  res.json({
    status: 'success',
    registers: industrialProtocols.modbus.registers
  });
});

// Read Modbus register
app.get('/api/protocols/modbus/read/:register', authenticateJWT, (req, res) => {
  const register = req.params.register;

  if (industrialProtocols.modbus.registers[register]) {
    res.json({
      status: 'success',
      register: register,
      value: industrialProtocols.modbus.registers[register].value,
      description: industrialProtocols.modbus.registers[register].description,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      status: 'error',
      message: `Register ${register} not found`
    });
  }
});

// Write Modbus register (admin only)
app.post('/api/protocols/modbus/write/:register', authenticateJWT, rbacMiddleware(['admin']), (req, res) => {
  const register = req.params.register;
  const { value } = req.body;

  if (!value && value !== 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Value is required'
    });
  }

  if (industrialProtocols.modbus.registers[register]) {
    // In a real application, this would communicate with actual Modbus devices
    industrialProtocols.modbus.registers[register].value = parseInt(value);

    res.json({
      status: 'success',
      message: `Register ${register} updated successfully`,
      register: register,
      value: industrialProtocols.modbus.registers[register].value,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      status: 'error',
      message: `Register ${register} not found`
    });
  }
});

// Serve the SPA for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler (from original code)
app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path
  }));

  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`┌───────────────────────────────────────────────────┐`);
  console.log(`│                                                   │`);
  console.log(`│   SecureX Blockchain Security Platform            │`);
  console.log(`│   Version: ${process.env.APP_VERSION || '1.0.0'}                                │`);
  console.log(`│   Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}│`);
  console.log(`│                                                   │`);
  console.log(`│   Server running on port: ${PORT}                      │`);
  console.log(`│   URL: http://0.0.0.0:${PORT}                        │`);
  console.log(`│                                                   │`);
  console.log(`└───────────────────────────────────────────────────┘`);
});

module.exports = app;