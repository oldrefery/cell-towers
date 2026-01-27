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

function createMarkerIcon(networkType) {
    const color = COLORS[networkType];
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
}

function renderMarkers() {
    markersLayer.clearLayers();

    filteredTowers.forEach(tower => {
        const { coordinates } = tower.geometry;
        const props = tower.properties;

        const marker = L.marker([coordinates[1], coordinates[0]], {
            icon: createMarkerIcon(props.networkType)
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
            // Check and update tower info window
            const infoWindow = window.open('', 'tower_info_window');
            if (infoWindow && !infoWindow.closed && infoWindow.location.href !== 'about:blank') {
                console.log('Tower info window is open, updating to:', props.id);
                comm.send('open_tower_info', { towerId: props.id });
            }

            // Check and update monitor window
            const monitorWindow = window.open('', 'monitor_window');
            if (monitorWindow && !monitorWindow.closed && monitorWindow.location.href !== 'about:blank') {
                console.log('Monitor window is open, switching to:', props.id);
                comm.send('start_monitoring', { towerId: props.id });
            }
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
    console.log('Opening tower info for:', towerId);
    comm.openTowerInfo(towerId);
}

// Make function globally accessible for popup buttons
window.openTowerInfo = openTowerInfo;

document.getElementById('applyFilters').addEventListener('click', applyFilters);

window.addEventListener('load', initMap);
