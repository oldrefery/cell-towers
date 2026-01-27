# Cell Tower Map - Netherlands

Interactive map showing cell tower locations in Netherlands with real-time monitoring capabilities.

## Features

- **Interactive Map**: Leaflet-based map with 20,914 real cell towers
- **Smart Clustering**: Automatic marker clustering based on zoom level
- **Filtering**: Filter by network type (2G/3G/4G/5G) and operator (KPN, Vodafone, T-Mobile)
- **Tower Details**: View detailed information about each tower
- **Live Monitoring**: Real-time simulation of tower metrics
- **Multi-Window**: Open multiple monitoring windows simultaneously

## Data

Real antenna data from **antenneregister.nl** (official Dutch antenna register):
- **20,914 towers** across Netherlands
- **Actual locations**: Real cell tower positions from official government data
- **Network types**: 5G (68.8%), 4G (30.3%), 2G (0.9%), 3G (0.02%)
- **Operators**: KPN, Vodafone, T-Mobile (randomly assigned to real locations)
- **Top cities**: Amsterdam (742), Rotterdam (530), Utrecht (281), Eindhoven (228), The Hague (220)

## Installation

No installation required - just start the HTTP server.

## Running

Start HTTP server:

```bash
cd cell-towers
python3 -m http.server 8005
```

Open browser: `http://localhost:8005/index.html`

## Usage

### 1. Map View

- **Zoom in/out**: Clusters automatically split into individual towers
- **Click cluster**: Zoom to show towers inside
- **Click tower**: See popup with basic info
- **Filter**: Use checkboxes to filter by network type or operator

### 2. Tower Information Window

- Click **"View Details"** button in popup
- Opens window with complete tower specifications (or updates existing window):
  - Basic info (ID, operator, network type, status)
  - Technical specs (frequency, coverage, capacity)
  - Location details
- **Click another tower**: Info updates in the same window (no new window)

### 3. Live Monitoring Window

- Click **"Open Live Monitoring"** in tower info window
- Opens monitoring window (or updates existing window):
- **Switch towers**: Monitoring automatically switches to new tower
  - Signal Strength (dBm)
  - Packet Loss (%)
  - Latency (ms)
  - Bandwidth (Mbps)
  - Network Load (%)
  - Connected Devices
  - Temperature (°C)
  - Uptime

**Controls:**
- **Pause/Resume**: Stop/start live updates
- **Reset**: Clear charts and restart uptime counter

## Technology Stack

- **Map**: Leaflet 1.9.4
- **Clustering**: Leaflet.markercluster 1.5.3
- **Tiles**: OpenStreetMap
- **Communication**: BroadcastChannel API
- **Data Format**: GeoJSON

## Architecture

```
┌─────────────┐
│   Map       │ Click tower
│   Window    │─────────────┐
└─────────────┘             │
                            ↓
                     ┌─────────────┐
                     │ Tower Info  │ (singleton - reuses same window)
                     │   Window    │─────────────┐
                     └─────────────┘             │
                                                 ↓
                                          ┌─────────────┐
                                          │  Monitor    │ (singleton - reuses same window)
                                          │   Window    │
                                          └─────────────┘
```

**Singleton Pattern:**
- Tower Info window: Opens once, updates when you click different towers
- Monitor window: Opens once, switches to new tower when you change selection

All windows communicate via BroadcastChannel API.

## Files Structure

```
cell-towers/
├── index.html              # Main map view
├── tower-info.html         # Tower details window
├── monitor.html            # Live monitoring window
├── data/
│   ├── towers.geojson        # Real tower data (20,914 towers)
│   ├── generate-towers.py    # Legacy: random data generator
│   └── convert-real-data.py  # Converts antenneregister.nl data to our format
├── js/
│   ├── communication.js   # BroadcastChannel wrapper
│   ├── map.js            # Map logic + clustering
│   ├── tower-info.js     # Tower details logic
│   └── monitor.js        # Live monitoring logic
├── css/
│   └── style.css         # All styles
└── README.md
```

## Data Source & Conversion

The application uses real cell tower data from **antenneregister.nl** (Dutch Antenna Register).

### Converting Real Data

To convert fresh data from the antenna register:

```bash
cd data
python3 convert-real-data.py
```

This script:
1. Reads data from `antenneregister_nl_mobile_normalized.geojson`
2. Converts it to our application format
3. Adds missing fields (operator, frequency, coverage, etc.)
4. Creates `towers.geojson` with all real tower locations

### Generate Random Data (Legacy)

To generate synthetic data instead:

```bash
cd data
python3 generate-towers.py  # Creates 750 random towers
```

## Customization

### Change number of towers

Edit `generate-towers.py`:
```python
data = generate_towers(1000)  # Change from 750 to 1000
```

### Change update interval

Edit `monitor.js`:
```javascript
const UPDATE_INTERVAL = 2000;  // Change from 1000ms to 2000ms
```

### Change color scheme

Edit `css/style.css` color variables.

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (15.4+)

## Performance

- **20,914 towers**: Excellent performance thanks to clustering
- **Clustering**: Efficiently handles large datasets (tested with 20K+ markers)
- **Live updates**: 1 second interval, negligible CPU usage
- **Load time**: ~1-2 seconds for initial data load (11MB GeoJSON file)

## Stopping

Press `Ctrl+C` in terminal to stop HTTP server.

## Future Enhancements

Planned features:
- Coverage circles (show tower radius)
- Heatmap view (signal strength)
- Historical data charts
- Tower comparison mode
- Export filtered data
- Search by tower ID

## License

MIT - Free to use and modify
