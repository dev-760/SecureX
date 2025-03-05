
const ModbusRTU = require('modbus-serial');
const WebSocket = require('ws');
const crypto = require('crypto');

class IndustrialDevice {
    constructor(deviceId, serverUrl) {
        this.deviceId = deviceId;
        this.serverUrl = serverUrl;
        this.client = new ModbusRTU();
        this.ws = null;
        this.connected = false;
        this.metrics = {
            cpu: 0,
            memory: 0,
            temperature: 0
        };
    }

    async connect() {
        // Connect to PLC via Modbus
        try {
            await this.client.connectTCP("192.168.1.100", { port: 502 });
            this.client.setID(1);
            this.connected = true;
            console.log('Connected to PLC');
            this.connectWebSocket();
        } catch (err) {
            console.error('Failed to connect to PLC:', err);
        }
    }

    connectWebSocket() {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.on('open', () => {
            console.log('Connected to control server');
            this.startMonitoring();
        });

        this.ws.on('message', async (data) => {
            const command = JSON.parse(data);
            if (command.type === 'CONTROL') {
                await this.handleControl(command);
            }
        });

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            setTimeout(() => this.connectWebSocket(), 5000);
        });
    }

    async startMonitoring() {
        setInterval(async () => {
            if (!this.connected) return;

            try {
                // Read PLC registers
                const registers = await this.client.readHoldingRegisters(0, 3);
                
                this.metrics = {
                    cpu: registers.data[0] / 100,
                    memory: registers.data[1] / 100,
                    temperature: registers.data[2] / 10
                };

                // Send data to server
                this.ws.send(JSON.stringify({
                    type: 'TELEMETRY',
                    deviceId: this.deviceId,
                    metrics: this.metrics,
                    timestamp: Date.now(),
                    signature: this.signData(this.metrics)
                }));
            } catch (err) {
                console.error('Monitoring error:', err);
            }
        }, 1000);
    }

    async handleControl(command) {
        try {
            await this.client.writeRegister(command.register, command.value);
            console.log(`Control command executed: Register ${command.register} = ${command.value}`);
        } catch (err) {
            console.error('Control command failed:', err);
        }
    }

    signData(data) {
        const hmac = crypto.createHmac('sha256', process.env.DEVICE_SECRET || 'device-secret');
        hmac.update(JSON.stringify(data));
        return hmac.digest('hex');
    }
}

// Start device
const device = new IndustrialDevice(
    process.env.DEVICE_ID || 'DEV001',
    process.env.SERVER_URL || 'ws://0.0.0.0:3000'
);

const connectWithRetry = async () => {
    try {
        await device.connect();
        console.log('Device connected successfully');
    } catch (error) {
        console.error('Connection error:', error);
        console.log('Retrying in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

connectWithRetry();
