#!/usr/bin/env python3
"""
Convert real antenna data from antenneregister.nl to towers.geojson format
"""

import json
import random
from datetime import datetime, timedelta

# Operators in Netherlands
OPERATORS = ["KPN", "Vodafone", "T-Mobile"]

# Frequencies by network type
FREQUENCIES = {
    "2G": ["900 MHz", "1800 MHz"],
    "3G": ["900 MHz", "2100 MHz"],
    "4G": ["800 MHz", "1800 MHz", "2600 MHz"],
    "5G": ["700 MHz", "3500 MHz", "26 GHz"]
}

def determine_network_type(technology_list):
    """
    Determine the best network type from technology list
    Priority: 5G > 4G > 3G > 2G
    """
    if not technology_list:
        return "4G"  # Default

    # Check for each type in priority order
    if "5G" in technology_list:
        return "5G"
    elif "4G" in technology_list:
        return "4G"
    elif "3G" in technology_list:
        return "3G"
    elif "2G" in technology_list:
        return "2G"
    else:
        return "4G"

def get_coverage_radius(network_type, small_cell=False):
    """
    Get realistic coverage radius based on network type and cell size
    """
    if small_cell:
        # Small cells have much smaller coverage
        base_radius = {
            "2G": random.randint(200, 500),
            "3G": random.randint(150, 400),
            "4G": random.randint(100, 300),
            "5G": random.randint(50, 150)
        }
    else:
        # Regular macro cells
        base_radius = {
            "2G": random.randint(3000, 8000),
            "3G": random.randint(2000, 5000),
            "4G": random.randint(1500, 3500),
            "5G": random.randint(500, 2000)
        }

    return base_radius.get(network_type, 2000)

def get_max_capacity(network_type, antenna_count):
    """
    Get realistic max capacity based on network type and antenna count
    """
    base_capacity = {
        "2G": random.randint(100, 300),
        "3G": random.randint(200, 500),
        "4G": random.randint(300, 800),
        "5G": random.randint(500, 1500)
    }

    capacity = base_capacity.get(network_type, 500)
    # Multiply by antenna count (more antennas = more capacity)
    return int(capacity * (antenna_count / 3.0))

def generate_random_date():
    """Generate random installation date in last 10 years"""
    days_ago = random.randint(0, 3650)
    date = datetime.now() - timedelta(days=days_ago)
    return date.strftime("%Y-%m-%d")

def convert_tower(feature, index):
    """
    Convert real antenna data to our format
    """
    props = feature["properties"]
    coords = feature["geometry"]["coordinates"]

    # Determine network type from technology list
    network_type = determine_network_type(props.get("technology", []))

    # Get or generate missing data
    operator = random.choice(OPERATORS)
    frequency = random.choice(FREQUENCIES[network_type])
    small_cell = props.get("small_cell", False)
    antenna_count = props.get("antenna_count", 3.0)

    coverage_radius = get_coverage_radius(network_type, small_cell)
    max_capacity = get_max_capacity(network_type, antenna_count)
    installed = generate_random_date()

    # Status: 95% active, 5% maintenance
    status = random.choice(["active"] * 95 + ["maintenance"] * 5)

    # City name (use city or municipality as fallback)
    city = props.get("city") or props.get("municipality") or "Unknown"

    # Generate tower ID
    tower_id = f"NL-{index:05d}"

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [round(coords[0], 6), round(coords[1], 6)]
        },
        "properties": {
            "id": tower_id,
            "operator": operator,
            "networkType": network_type,
            "frequency": frequency,
            "coverageRadius": coverage_radius,
            "maxCapacity": max_capacity,
            "city": city,
            "installed": installed,
            "status": status,
            # Keep some original data for reference
            "originalId": props.get("source_id"),
            "antennaCount": int(antenna_count),
            "smallCell": small_cell
        }
    }

def convert_data(input_file, output_file):
    """
    Convert the entire dataset
    """
    print(f"Reading {input_file}...")
    with open(input_file, 'r') as f:
        data = json.load(f)

    total = len(data["features"])
    print(f"Found {total} towers")

    print("Converting towers...")
    converted_features = []

    for i, feature in enumerate(data["features"], start=1):
        if i % 1000 == 0:
            print(f"  Processed {i}/{total}...")

        converted_feature = convert_tower(feature, i)
        converted_features.append(converted_feature)

    result = {
        "type": "FeatureCollection",
        "features": converted_features
    }

    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"✓ Successfully converted {len(converted_features)} towers")

    # Statistics
    by_type = {}
    by_operator = {}
    by_city = {}

    for tower in converted_features:
        props = tower["properties"]

        net_type = props["networkType"]
        operator = props["operator"]
        city = props["city"]

        by_type[net_type] = by_type.get(net_type, 0) + 1
        by_operator[operator] = by_operator.get(operator, 0) + 1
        by_city[city] = by_city.get(city, 0) + 1

    print(f"\nStatistics:")
    print(f"  Network types: {dict(sorted(by_type.items()))}")
    print(f"  Operators: {dict(sorted(by_operator.items()))}")
    print(f"  Top 10 cities:")
    for city, count in sorted(by_city.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    {city}: {count}")

if __name__ == "__main__":
    input_file = "/Users/devrush/code/fls/scribd_download/geojson_netherlands/antenneregister_nl_mobile_normalized.geojson"
    output_file = "towers.geojson"

    convert_data(input_file, output_file)
    print("\n✓ Done! Reload the map to see real tower data.")
