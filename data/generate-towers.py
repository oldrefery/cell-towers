#!/usr/bin/env python3
"""
Generate realistic cell tower data for Netherlands with non-uniform distribution.
More towers in cities, fewer in rural areas.
"""

import json
import random
from datetime import datetime, timedelta

# Major cities in Netherlands with coordinates and relative tower density
CITIES = [
    {"name": "Amsterdam", "lat": 52.3702, "lon": 4.8952, "density": 150},
    {"name": "Rotterdam", "lat": 51.9225, "lon": 4.4792, "density": 100},
    {"name": "The Hague", "lat": 52.0705, "lon": 4.3007, "density": 80},
    {"name": "Utrecht", "lat": 52.0907, "lon": 5.1214, "density": 70},
    {"name": "Eindhoven", "lat": 51.4416, "lon": 5.4697, "density": 60},
    {"name": "Tilburg", "lat": 51.5555, "lon": 5.0913, "density": 40},
    {"name": "Groningen", "lat": 53.2194, "lon": 6.5665, "density": 50},
    {"name": "Almere", "lat": 52.3508, "lon": 5.2647, "density": 35},
    {"name": "Breda", "lat": 51.5719, "lon": 4.7683, "density": 30},
    {"name": "Nijmegen", "lat": 51.8126, "lon": 5.8372, "density": 30},
]

OPERATORS = ["KPN", "Vodafone", "T-Mobile"]
NETWORK_TYPES = ["2G", "3G", "4G", "5G"]
FREQUENCIES = {
    "2G": ["900 MHz", "1800 MHz"],
    "3G": ["900 MHz", "2100 MHz"],
    "4G": ["800 MHz", "1800 MHz", "2600 MHz"],
    "5G": ["700 MHz", "3500 MHz", "26 GHz"]
}

def generate_tower_id(index):
    """Generate tower ID"""
    return f"NL-{index:04d}"

def random_offset(base, radius_km):
    """Generate random coordinate offset in km"""
    # 1 degree lat ≈ 111 km, 1 degree lon ≈ 111 * cos(lat) km
    lat_offset = random.uniform(-radius_km, radius_km) / 111
    lon_offset = random.uniform(-radius_km, radius_km) / (111 * 0.7)  # Netherlands ≈ 52°N
    return lat_offset, lon_offset

def generate_towers(total_count=750):
    """Generate tower data with non-uniform distribution"""
    towers = []
    tower_id = 1

    # Calculate total density
    total_density = sum(city["density"] for city in CITIES)

    # Generate towers for each city
    for city in CITIES:
        # Calculate number of towers for this city
        city_towers = int((city["density"] / total_density) * total_count)

        for _ in range(city_towers):
            # Random position around city center (0-10km radius)
            lat_offset, lon_offset = random_offset(0, random.uniform(2, 10))
            lat = city["lat"] + lat_offset
            lon = city["lon"] + lon_offset

            # Random characteristics
            operator = random.choice(OPERATORS)
            network_type = random.choices(
                NETWORK_TYPES,
                weights=[5, 10, 50, 35]  # More 4G/5G, less 2G/3G
            )[0]
            frequency = random.choice(FREQUENCIES[network_type])

            # Coverage radius depends on network type
            coverage_radius = {
                "2G": random.randint(3000, 8000),
                "3G": random.randint(2000, 5000),
                "4G": random.randint(1500, 3500),
                "5G": random.randint(500, 2000)
            }[network_type]

            # Random installation date (last 10 years)
            days_ago = random.randint(0, 3650)
            installed = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

            tower = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [round(lon, 6), round(lat, 6)]
                },
                "properties": {
                    "id": generate_tower_id(tower_id),
                    "operator": operator,
                    "networkType": network_type,
                    "frequency": frequency,
                    "coverageRadius": coverage_radius,
                    "maxCapacity": random.randint(200, 1000),
                    "city": city["name"],
                    "installed": installed,
                    "status": random.choice(["active"] * 95 + ["maintenance"] * 5)
                }
            }

            towers.append(tower)
            tower_id += 1

    # Add some rural towers
    rural_count = total_count - len(towers)
    for _ in range(rural_count):
        # Random position in Netherlands (roughly)
        lat = random.uniform(50.8, 53.5)
        lon = random.uniform(3.4, 7.2)

        operator = random.choice(OPERATORS)
        network_type = random.choices(
            NETWORK_TYPES,
            weights=[10, 20, 50, 20]  # Rural areas have less 5G
        )[0]
        frequency = random.choice(FREQUENCIES[network_type])

        coverage_radius = {
            "2G": random.randint(5000, 15000),  # Rural coverage is larger
            "3G": random.randint(3000, 10000),
            "4G": random.randint(2000, 6000),
            "5G": random.randint(1000, 3000)
        }[network_type]

        days_ago = random.randint(0, 3650)
        installed = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

        tower = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, 6), round(lat, 6)]
            },
            "properties": {
                "id": generate_tower_id(tower_id),
                "operator": operator,
                "networkType": network_type,
                "frequency": frequency,
                "coverageRadius": coverage_radius,
                "maxCapacity": random.randint(100, 500),
                "city": "Rural",
                "installed": installed,
                "status": random.choice(["active"] * 90 + ["maintenance"] * 10)
            }
        }

        towers.append(tower)
        tower_id += 1

    return {
        "type": "FeatureCollection",
        "features": towers
    }

if __name__ == "__main__":
    print("Generating cell tower data for Netherlands...")
    data = generate_towers(750)

    output_file = "towers.geojson"
    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✓ Generated {len(data['features'])} towers")
    print(f"✓ Saved to {output_file}")

    # Statistics
    by_type = {}
    by_operator = {}
    for tower in data['features']:
        net_type = tower['properties']['networkType']
        operator = tower['properties']['operator']
        by_type[net_type] = by_type.get(net_type, 0) + 1
        by_operator[operator] = by_operator.get(operator, 0) + 1

    print(f"\nNetwork types: {by_type}")
    print(f"Operators: {by_operator}")
