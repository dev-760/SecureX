
# SecureX Industrial Control System

## 🛡️ Overview
SecureX is a comprehensive industrial control and security platform divided into three main components:
- **Node**: Core server component handling industrial protocols and security
- **Platform**: User interface for system management and monitoring
- **Device**: Code for industrial machine integration

## 🚀 Quick Start
1. Start the node server:
```bash
cd node/src && npm start
```

2. Access the platform interface:
- Default URL: https://[your-repl-url]
- Login: dev
- Password: Thedev7845

## 🔐 Security Features
- Role-based access control
- Industrial protocol security
- Real-time monitoring
- Blockchain-based audit trails

## 📂 Project Structure
```
securex/
├── node/             # Server component
│   └── src/          # Source code
├── platform/         # Web interface
│   └── src/          # Source code
└── device/           # Machine integration
    └── src/          # Source code
```

## 📚 Documentation
See individual README files in each component folder for detailed documentation:
- [Node Documentation](node/src/README.md)
- [Platform Documentation](platform/src/README.md)
- [Device Documentation](device/src/README.md)

## 👨‍💻 Getting Started

### Prerequisites
- Node.js v16.0.0 or higher
- NPM package manager
- Stable internet connection

### Installation
1. Clone or download the project
2. Install dependencies for each component:
```bash
cd node/src && npm install
cd ../../platform/src && npm install
```

### Configuration
1. Copy example.env to .env in node/src
2. Update environment variables as needed
3. Configure industrial protocol settings

## 🔧 Usage
1. Start the node server:
```bash
cd node/src && npm start
```
2. Access the web interface through your Replit URL
3. Log in with provided credentials
4. Configure devices and start monitoring

## 👥 Support
For issues and support, please use the Replit community forums or contact the development team.

## 📝 License
Licensed under MIT License. See LICENSE file for details.
