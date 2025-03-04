# SecureX Node Component

## 🖥️ Core Server Component
This component handles all industrial protocols, security, and data processing.

## 🛠️ Features
- Industrial protocol support (Modbus, DNP3, OPC UA)
- Real-time monitoring
- Security incident detection
- Blockchain integration
- User management

## ⚙️ Configuration
Environment variables in `.env`:
```
PORT=3000
JWT_SECRET=your-secret
MONGODB_URI=your-mongodb-uri
```

## 🚀 Running
```bash
npm install
npm start
```

## 📡 API Endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/devices/*` - Device management
- `/api/protocols/*` - Industrial protocol interface

## Getting Started
1. Install dependencies:
   ```
   npm install
   ```
2. Configure environment variables:
   Copy `.env.example` to `.env` and update as needed
3. Start the server:
   ```
   npm start
   ```
4. For development with auto-reload:
   ```
   npm run dev
