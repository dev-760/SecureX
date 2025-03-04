const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const ModbusRTU = require('modbus-serial');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../platform/src/public')));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://0.0.0.0:27017/industrial';
let db;

MongoClient.connect(mongoUri)
    .then(client => {
        db = client.db();
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    res.json({ token, role: user.role });
});

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected devices
const devices = new Map();

wss.on('connection', (ws) => {
    console.log('New connection established');
    let deviceId = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            if (message.type === 'TELEMETRY') {
                deviceId = message.deviceId;
                devices.set(deviceId, { ws, lastSeen: Date.now(), metrics: message.metrics });

                // Broadcast to monitoring clients
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (deviceId) {
            devices.delete(deviceId);
            console.log(`Device ${deviceId} disconnected`);
        }
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        devices: devices.size,
        uptime: process.uptime()
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`SecureX Industrial Server running on http://0.0.0.0:${PORT}`);
});