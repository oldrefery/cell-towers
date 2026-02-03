const comm = new TowerCommunication();
let currentTowerId = null;
let monitoringInterval = null;
let isPaused = false;
let startTime = Date.now();

const MAX_DATA_POINTS = 30;
const UPDATE_INTERVAL = 1000;

const metrics = {
    signalStrength: [],
    packetLoss: [],
    latency: [],
    bandwidth: [],
    networkLoad: [],
    connectedDevices: [],
    temperature: []
};

function generateMetrics() {
    return {
        signalStrength: -65 + (Math.random() - 0.5) * 20,
        packetLoss: 1 + Math.random() * 5,
        latency: 15 + Math.random() * 15,
        bandwidth: 50 + (Math.random() - 0.5) * 30,
        networkLoad: 30 + Math.random() * 40,
        connectedDevices: Math.floor(150 + (Math.random() - 0.5) * 60),
        temperature: 45 + (Math.random() - 0.5) * 10
    };
}

function updateMetrics() {
    if (isPaused) return;

    const newMetrics = generateMetrics();

    Object.keys(newMetrics).forEach(key => {
        metrics[key].push(newMetrics[key]);
        if (metrics[key].length > MAX_DATA_POINTS) {
            metrics[key].shift();
        }
    });

    updateDisplay(newMetrics);
    updateCharts();
    updateUptime();
}

function updateDisplay(data) {
    document.getElementById('signalStrength').textContent = `${data.signalStrength.toFixed(1)} dBm`;
    document.getElementById('packetLoss').textContent = `${data.packetLoss.toFixed(2)} %`;
    document.getElementById('latency').textContent = `${data.latency.toFixed(1)} ms`;
    document.getElementById('bandwidth').textContent = `${data.bandwidth.toFixed(1)} Mbps`;
    document.getElementById('networkLoad').textContent = `${data.networkLoad.toFixed(1)} %`;
    document.getElementById('connectedDevices').textContent = data.connectedDevices;
    document.getElementById('temperature').textContent = `${data.temperature.toFixed(1)} °C`;

    updateMetricColor('signalStrength', data.signalStrength, -75, -55);
    updateMetricColor('packetLoss', data.packetLoss, 6, 0, true);
    updateMetricColor('latency', data.latency, 30, 10, true);
    updateMetricColor('temperature', data.temperature, 55, 40, true);
}

function updateMetricColor(elementId, value, bad, good, reverse = false) {
    const element = document.getElementById(elementId);
    let color;

    if (reverse) {
        if (value > bad) color = '#ff4444';
        else if (value > (bad + good) / 2) color = '#ffaa00';
        else color = '#00ff00';
    } else {
        if (value < bad) color = '#ff4444';
        else if (value < (bad + good) / 2) color = '#ffaa00';
        else color = '#00ff00';
    }

    element.style.color = color;
}

function updateCharts() {
    Object.keys(metrics).forEach(key => {
        const chartElement = document.getElementById(`${key}Chart`);
        if (!chartElement) return;

        const data = metrics[key];
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        const bars = data.map(value => {
            const height = ((value - min) / range) * 100;
            return `<div class="chart-bar" style="height: ${height}%"></div>`;
        }).join('');

        chartElement.innerHTML = bars;
    });
}

function updateUptime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    document.getElementById('uptime').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const statusEl = document.getElementById('uptimeStatus');
    if (statusEl) {
        statusEl.textContent = isPaused ? 'Paused' : 'System running';
    }
}

function startMonitoring(towerId) {
    console.debug('[Monitor] startMonitoring', towerId);
    currentTowerId = towerId;
    if (towerId) {
        localStorage.setItem('ios_active_tower', towerId);
    }
    document.getElementById('towerId').innerHTML = `<span>Tower: ${towerId}</span>`;

    // Clear existing interval if any
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }

    // Reset metrics for new tower
    Object.keys(metrics).forEach(key => {
        metrics[key] = [];
    });

    startTime = Date.now();
    isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸️ Pause';

    monitoringInterval = setInterval(updateMetrics, UPDATE_INTERVAL);
    updateMetrics();
}

document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    btn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    Object.keys(metrics).forEach(key => {
        metrics[key] = [];
    });
    startTime = Date.now();
    updateMetrics();
});

// Listen for monitoring requests (including tower changes)
comm.on('start_monitoring', (data) => {
    console.debug('[Monitor] recv start_monitoring', data);
    startMonitoring(data.towerId);
});

// Fallback: if only tower-info events are sent, sync monitoring too.
comm.on('open_tower_info', (data) => {
    console.debug('[Monitor] recv open_tower_info', data);
    startMonitoring(data.towerId);
});

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const towerId = urlParams.get('towerId');
    const storedTower = localStorage.getItem('ios_active_tower');
    if (towerId) {
        startMonitoring(towerId);
    } else if (storedTower) {
        startMonitoring(storedTower);
    }
});
