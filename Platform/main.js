
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login');
    const dashboard = document.getElementById('dashboard');
    const deviceData = document.getElementById('deviceData');
    let ws = null;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://0.0.0.0:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                document.getElementById('loginForm').style.display = 'none';
                dashboard.style.display = 'block';
                connectWebSocket();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    });

    function connectWebSocket() {
        ws = new WebSocket('ws://0.0.0.0:3000');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    function updateDashboard(data) {
        const deviceElement = document.getElementById(`device-${data.deviceId}`) || 
            createDeviceElement(data.deviceId);
        
        deviceElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">Device ${data.deviceId}</h5>
                <p>CPU: ${(data.metrics.cpu * 100).toFixed(2)}%</p>
                <p>Memory: ${(data.metrics.memory * 100).toFixed(2)}%</p>
                <p>Temperature: ${data.metrics.temperature.toFixed(2)}°C</p>
                <p>Last Update: ${new Date(data.timestamp).toLocaleString()}</p>
            </div>
        `;
    }

    function createDeviceElement(deviceId) {
        const div = document.createElement('div');
        div.id = `device-${deviceId}`;
        div.className = 'col-md-4 mb-4';
        div.innerHTML = '<div class="card"></div>';
        deviceData.appendChild(div);
        return div;
    }
});
