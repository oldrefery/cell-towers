const comm = new TowerCommunication();
let currentTower = null;

async function loadTowerInfo(towerId) {
    try {
        const response = await fetch('data/towers.geojson');
        const data = await response.json();

        const tower = data.features.find(t => t.properties.id === towerId);

        if (!tower) {
            console.error('Tower not found:', towerId);
            document.getElementById('towerDetails').innerHTML = '<p>Tower not found</p>';
            return;
        }

        currentTower = tower;
        displayTowerInfo(tower);
    } catch (error) {
        console.error('Error loading tower:', error);
        document.getElementById('towerDetails').innerHTML = '<p>Error loading tower data</p>';
    }
}

function displayTowerInfo(tower) {
    const props = tower.properties;
    const coords = tower.geometry.coordinates;

    const detailsHTML = `
        <div class="info-grid">
            <div class="info-section">
                <h3>Basic Information</h3>
                <div class="info-row">
                    <span class="label">Tower ID:</span>
                    <span class="value">${props.id}</span>
                </div>
                <div class="info-row">
                    <span class="label">Operator:</span>
                    <span class="value">${props.operator}</span>
                </div>
                <div class="info-row">
                    <span class="label">Network Type:</span>
                    <span class="value badge badge-${props.networkType.toLowerCase()}">${props.networkType}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="value badge ${props.status === 'active' ? 'badge-active' : 'badge-maintenance'}">
                        ${props.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div class="info-section">
                <h3>Technical Specifications</h3>
                <div class="info-row">
                    <span class="label">Frequency:</span>
                    <span class="value">${props.frequency}</span>
                </div>
                <div class="info-row">
                    <span class="label">Coverage Radius:</span>
                    <span class="value">${(props.coverageRadius / 1000).toFixed(1)} km</span>
                </div>
                <div class="info-row">
                    <span class="label">Max Capacity:</span>
                    <span class="value">${props.maxCapacity} devices</span>
                </div>
                <div class="info-row">
                    <span class="label">Installed:</span>
                    <span class="value">${props.installed}</span>
                </div>
            </div>

            <div class="info-section">
                <h3>Location</h3>
                <div class="info-row">
                    <span class="label">City:</span>
                    <span class="value">${props.city}</span>
                </div>
                <div class="info-row">
                    <span class="label">Coordinates:</span>
                    <span class="value">${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('towerDetails').innerHTML = detailsHTML;
    document.getElementById('startMonitoring').disabled = false;
}

document.getElementById('startMonitoring').addEventListener('click', () => {
    if (currentTower) {
        comm.openMonitor(currentTower.properties.id);
    }
});

// Listen for tower changes from map
comm.on('open_tower_info', (data) => {
    loadTowerInfo(data.towerId);
});

window.addEventListener('load', () => {
    // Check if towerId was passed via URL
    const urlParams = new URLSearchParams(window.location.search);
    const towerId = urlParams.get('towerId');
    if (towerId) {
        loadTowerInfo(towerId);
    }
});
