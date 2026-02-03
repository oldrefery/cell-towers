const comm = new TowerCommunication();
let map;
let markersLayer;
let allTowers = [];
let filteredTowers = [];

const COLORS = {
    '5G': '#00ff00',
    '4G': '#0088ff',
    '3G': '#ffaa00',
    '2G': '#ff4444'
};

function initMap() {
    map = L.map('map').setView([52.1326, 5.2913], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    markersLayer = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });

    loadTowers();
    initWindowControls();
}

async function loadTowers() {
    try {
        const response = await fetch('data/towers.geojson');
        const data = await response.json();
        allTowers = data.features;
        filteredTowers = [...allTowers];

        updateStats();
        renderMarkers();
    } catch (error) {
        console.error('Error loading towers:', error);
        document.getElementById('stats').textContent = 'Error loading data';
    }
}

function getStatusColor(status) {
    if (status === '1' || status === 1) return '#4f7d3a'; // ok
    if (status === '2' || status === 2) return '#c9822e'; // alarms
    if (status === '3' || status === 3) return '#b03b32'; // locked
    return null;
}

function createMarkerIcon(networkType, status) {
    const color = COLORS[networkType];
    const statusColor = getStatusColor(status);
    const statusFill = statusColor ? statusColor : 'none';
    const statusStroke = statusColor ? '#534a3f' : '#a9a39a';
    const svg = `
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10.5" fill="${statusFill}" stroke="${statusStroke}" stroke-width="1" opacity="0.5"/>
            <g transform="translate(12 12)">
                <path d="M0 0 L2.8 -6.5 A7 7 0 0 0 -2.8 -6.5 Z" fill="${color}" stroke="#534a3f" stroke-width="0.6" />
                <path d="M0 0 L6.5 2.8 A7 7 0 0 0 6.5 -2.8 Z" fill="${color}" stroke="#534a3f" stroke-width="0.6" />
                <path d="M0 0 L-6.5 2.8 A7 7 0 0 0 -2.8 6.5 Z" fill="${color}" stroke="#534a3f" stroke-width="0.6" />
                <circle cx="0" cy="0" r="1.4" fill="#f7f1e8" stroke="#534a3f" stroke-width="0.6"/>
            </g>
        </svg>
    `;

    return L.divIcon({
        className: 'custom-marker',
        html: svg,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

function renderMarkers() {
    markersLayer.clearLayers();

    filteredTowers.forEach(tower => {
        const { coordinates } = tower.geometry;
        const props = tower.properties;

        const marker = L.marker([coordinates[1], coordinates[0]], {
            icon: createMarkerIcon(props.networkType, props.status)
        });

        const popupContent = `
            <div class="popup-content">
                <h3>${props.id}</h3>
                <p><strong>Operator:</strong> ${props.operator}</p>
                <p><strong>Network:</strong> ${props.networkType}</p>
                <p><strong>Frequency:</strong> ${props.frequency}</p>
                <p><strong>City:</strong> ${props.city}</p>
                <button onclick="openTowerInfo('${props.id}')" class="btn-primary">View Details</button>
            </div>
        `;

        marker.bindPopup(popupContent);

        // If tower info or monitor windows are open, update them on marker click
        marker.on('click', () => {
            comm.updateOpenWindows(props.id);
        });

        markersLayer.addLayer(marker);
    });

    map.addLayer(markersLayer);
}

function updateStats() {
    const stats = {
        total: filteredTowers.length,
        '5G': filteredTowers.filter(t => t.properties.networkType === '5G').length,
        '4G': filteredTowers.filter(t => t.properties.networkType === '4G').length,
        '3G': filteredTowers.filter(t => t.properties.networkType === '3G').length,
        '2G': filteredTowers.filter(t => t.properties.networkType === '2G').length
    };

    document.getElementById('stats').innerHTML = `
        <span><strong>Total:</strong> ${stats.total}</span>
        <span><strong>5G:</strong> ${stats['5G']}</span>
        <span><strong>4G:</strong> ${stats['4G']}</span>
        <span><strong>3G:</strong> ${stats['3G']}</span>
        <span><strong>2G:</strong> ${stats['2G']}</span>
    `;
}

function applyFilters() {
    const networkTypes = Array.from(document.querySelectorAll('.filter-group input[value="5G"], input[value="4G"], input[value="3G"], input[value="2G"]'))
        .filter(input => input.checked)
        .map(input => input.value);

    const operators = Array.from(document.querySelectorAll('.filter-group input[value="KPN"], input[value="Vodafone"], input[value="T-Mobile"]'))
        .filter(input => input.checked)
        .map(input => input.value);

    filteredTowers = allTowers.filter(tower => {
        const props = tower.properties;
        return networkTypes.includes(props.networkType) && operators.includes(props.operator);
    });

    updateStats();
    renderMarkers();
}

function openTowerInfo(towerId) {
    comm.openTowerInfo(towerId);
    comm.send('start_monitoring', { towerId });
}

// Make function globally accessible for popup buttons
window.openTowerInfo = openTowerInfo;

document.getElementById('applyFilters').addEventListener('click', applyFilters);

window.addEventListener('load', initMap);

function initWindowControls() {
    const consoleBtn = document.getElementById('openConsole');
    const preferSecondary = document.getElementById('preferSecondary');

    if (preferSecondary) {
        preferSecondary.checked = comm.getPreference();
        preferSecondary.addEventListener('change', (event) => {
            comm.setPreferSecondary(event.target.checked);
        });
    }

    if (consoleBtn) {
        consoleBtn.addEventListener('click', () => {
            comm.openConsole();
        });
    }
}
