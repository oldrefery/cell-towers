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
        <details open class="explorer-section">
            <summary>Basic Information</summary>
            <div class="explorer-body">
                <div class="status-strip"><span class="field-label">Tower ID</span> ${props.id}</div>
                <div class="status-strip"><span class="field-label">Operator</span> ${props.operator}</div>
                <div class="status-strip"><span class="field-label">Network Type</span> ${props.networkType}</div>
                <div class="status-strip"><span class="field-label">Status</span> ${props.status.toUpperCase()}</div>
            </div>
        </details>

        <details open class="explorer-section">
            <summary>Technical Specifications</summary>
            <div class="explorer-body">
                <div class="status-strip"><span class="field-label">Frequency</span> ${props.frequency}</div>
                <div class="status-strip"><span class="field-label">Coverage Radius</span> ${(props.coverageRadius / 1000).toFixed(1)} km</div>
                <div class="status-strip"><span class="field-label">Max Capacity</span> ${props.maxCapacity} devices</div>
                <div class="status-strip"><span class="field-label">Installed</span> ${props.installed}</div>
            </div>
        </details>

        <details open class="explorer-section">
            <summary>Location</summary>
            <div class="explorer-body">
                <div class="status-strip"><span class="field-label">City</span> ${props.city}</div>
                <div class="status-strip"><span class="field-label">Coordinates</span> ${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E</div>
            </div>
        </details>
    `;

    document.getElementById('towerDetails').innerHTML = detailsHTML;
    document.getElementById('towerMeta').innerHTML = `
        <span>${props.networkType}</span>
        <span>${props.operator}</span>
        <span>${props.status.toUpperCase()}</span>
    `;
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
