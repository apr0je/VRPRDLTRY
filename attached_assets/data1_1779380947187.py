import math
import json
import random
from pathlib import Path
from datetime import datetime

# ============================================================
# BASIC DISTANCE FUNCTION
# ============================================================

def euclidean_distance(p1, p2):
    """
    Calculates Euclidean distance between two coordinate points.
    In the paper, travel time/cost is represented spatially, so this is
    a simple and consistent way to create the travel-time/cost matrix.
    """
    return round(math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2), 3)


def build_distance_matrix(locations):
    """
    Creates a complete distance matrix between all generated locations.
    locations: dictionary -> {location_id: (x, y)}
    """
    matrix = {}

    for loc_i, coord_i in locations.items():
        matrix[loc_i] = {}
        for loc_j, coord_j in locations.items():
            matrix[loc_i][loc_j] = euclidean_distance(coord_i, coord_j)

    return matrix


# ============================================================
# VALIDATION FUNCTION
# ============================================================

def validate_instance(instance):
    """
    Validates the generated instance for feasibility:
    - Time windows are ordered and non-overlapping for each customer
    - Travel times between consecutive locations are feasible
    - Demands do not exceed vehicle capacity
    - All time windows are within planning horizon
    """
    customers = instance["customers"]
    planning_horizon = instance["planning_horizon"]
    vehicle_capacity = instance["vehicle_capacity"]
    
    print("\n" + "=" * 60)
    print("VALIDATING INSTANCE...")
    print("=" * 60)
    
    all_valid = True
    
    for cust in customers:
        locs = cust["locations"]
        prev_end = 0
        
        # Check if demand exceeds capacity
        if cust["demand"] > vehicle_capacity:
            print(f"  ❌ Customer {cust['customer_id']}: demand {cust['demand']} > capacity {vehicle_capacity}")
            all_valid = False
        
        # Check time windows
        for i, loc in enumerate(locs):
            start, end = loc["time_window"]
            
            if start < prev_end - 0.001:
                print(f"  ❌ Customer {cust['customer_id']}: time window overlap at {loc['location_id']}")
                all_valid = False
            if start > end + 0.001:
                print(f"  ❌ Customer {cust['customer_id']}: start > end at {loc['location_id']}")
                all_valid = False
            if end > planning_horizon + 0.001:
                print(f"  ❌ Customer {cust['customer_id']}: end {end} > horizon {planning_horizon}")
                all_valid = False
            if start < -0.001:
                print(f"  ❌ Customer {cust['customer_id']}: start {start} < 0")
                all_valid = False
            
            prev_end = end
    
    if all_valid:
        print("  ✅ All validation checks passed!")
    
    return all_valid


# ============================================================
# GENERAL INSTANCE GENERATOR
# ============================================================

def generate_general_instance(
    n_customers=30,
    max_locations_per_customer=5,
    max_roaming_distance=15,
    planning_horizon=12,
    vehicle_capacity=100,
    min_demand=1,
    max_demand=10,
    seed=42
):
    """
    Generates a general/random VRPRDL instance.

    Paper-based logic:
    - Depot is located at the center: (0, 0)
    - Each customer has a home location
    - Each customer may visit several roaming locations during the day
    - The home location appears at the beginning and end of the planning horizon
    - Time not spent traveling is assigned as time windows
    - Planning horizon is 12 hours for general instances
    """
    random.seed(seed)

    depot = {
        "location_id": "DEPOT",
        "x": 0.0,
        "y": 0.0
    }

    all_locations = {
        "DEPOT": (0.0, 0.0)
    }

    customers = []
    
    # Track statistics
    total_demand = 0
    total_locations = 0

    for c in range(1, n_customers + 1):

        # Demand capped by vehicle capacity
        demand = random.randint(min_demand, min(max_demand, vehicle_capacity))
        total_demand += demand

        # Home location around the depot
        home_x = round(random.uniform(-40, 40), 3)
        home_y = round(random.uniform(-40, 40), 3)
        home_coord = (home_x, home_y)

        # Number of locations visited during the planning period.
        # If this equals 1, the customer stays at home.
        m_c = random.randint(1, max_locations_per_customer)

        locations = []

        # Case 1: customer stays at home during the whole horizon
        if m_c == 1:
            loc_id = f"C{c}_HOME"
            locations.append({
                "location_id": loc_id,
                "type": "home",
                "x": home_x,
                "y": home_y,
                "time_window": [0.0, planning_horizon]
            })
            all_locations[loc_id] = home_coord
            total_locations += 1

        # Case 2: customer has home + roaming locations + home again
        else:
            # Number of intermediate roaming locations
            n_roaming = m_c - 2 if m_c >= 2 else 0
            total_locations += (n_roaming + 2)

            # Morning home window
            morning_home_id = f"C{c}_HOME_MORNING"
            locations.append({
                "location_id": morning_home_id,
                "type": "home_morning",
                "x": home_x,
                "y": home_y,
                "time_window": None
            })
            all_locations[morning_home_id] = home_coord

            # Roaming locations generated around home
            roaming_coords = []
            for r in range(1, n_roaming + 1):
                angle = random.uniform(0, 2 * math.pi)
                radius = max_roaming_distance * math.sqrt(random.uniform(0, 1))
                radius = min(radius, max_roaming_distance)
                
                x = round(home_x + radius * math.cos(angle), 3)
                y = round(home_y + radius * math.sin(angle), 3)

                roaming_coords.append((x, y))

                loc_id = f"C{c}_ROAMING_{r}"
                locations.append({
                    "location_id": loc_id,
                    "type": f"roaming_{r}",
                    "x": x,
                    "y": y,
                    "time_window": None
                })
                all_locations[loc_id] = (x, y)

            # Evening home window
            evening_home_id = f"C{c}_HOME_EVENING"
            locations.append({
                "location_id": evening_home_id,
                "type": "home_evening",
                "x": home_x,
                "y": home_y,
                "time_window": None
            })
            all_locations[evening_home_id] = home_coord

            # Create ordered travel path: home -> roaming locations -> home
            ordered_coords = [home_coord] + roaming_coords + [home_coord]

            # Calculate travel time between consecutive customer locations
            travel_times = []
            for idx in range(len(ordered_coords) - 1):
                travel_times.append(euclidean_distance(ordered_coords[idx], ordered_coords[idx + 1]))

            total_travel_time = sum(travel_times)

            # Scale if travel time is too large for the planning horizon
            if total_travel_time >= planning_horizon:
                scale = (planning_horizon * 0.4) / total_travel_time
                travel_times = [t * scale for t in travel_times]
                total_travel_time = sum(travel_times)

            available_time = max(0.1, planning_horizon - total_travel_time)

            # Randomly split available time among all visited locations
            raw_weights = [random.random() for _ in locations]
            total_weight = sum(raw_weights)
            stay_times = [(w / total_weight) * available_time for w in raw_weights]

            # Assign time windows sequentially
            current_time = 0.0
            for idx, loc in enumerate(locations):
                start = round(current_time, 3)
                end = round(current_time + stay_times[idx], 3)

                loc["time_window"] = [start, end]

                if idx < len(travel_times):
                    current_time = end + travel_times[idx]

            # Final check: ensure last time window ends exactly at horizon
            if locations and locations[-1]["time_window"][1] != planning_horizon:
                locations[-1]["time_window"][1] = planning_horizon

        customers.append({
            "customer_id": c,
            "demand": demand,
            "locations": locations
        })

    distance_matrix = build_distance_matrix(all_locations)

    # Build instance with metadata
    instance = {
        "instance_type": "general",
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "seed": seed,
            "n_customers": n_customers,
            "planning_horizon": planning_horizon,
            "vehicle_capacity": vehicle_capacity,
            "total_demand": total_demand,
            "total_locations": total_locations,
            "max_locations_per_customer": max_locations_per_customer,
            "max_roaming_distance": max_roaming_distance
        },
        "planning_horizon": planning_horizon,
        "vehicle_capacity": vehicle_capacity,
        "depot": depot,
        "customers": customers,
        "distance_matrix": distance_matrix
    }
    
    return instance


# ============================================================
# REALISTIC INSTANCE GENERATOR (FIXED - NO OVERLAP)
# ============================================================

def generate_realistic_instance(
    n_customers=30,
    planning_horizon=14,
    vehicle_capacity=100,
    min_demand=1,
    max_demand=10,
    seed=42
):
    """
    Generates a realistic VRPRDL instance.
    
    FIXED: No time window overlaps.
    
    Paper-based logic:
    - Planning horizon: 14 hours, from 06:00 to 20:00
    - Customer types:
        10% home-only
        40% home-work
        50% home-work-afterwork
    - Work locations are generated around predefined work clusters
    - Working customers are assigned one of three work schedules:
        10% part-time
        10% almost full-time
        80% full-time
    - After-work customers visit the closest after-work location to home
    """
    random.seed(seed)

    # Time constants (in hours, 0 = 06:00)
    MORNING_END = 2.0      # 08:00
    EVENING_START = 12.0   # 18:00
    
    depot = {
        "location_id": "DEPOT",
        "x": 0.0,
        "y": 0.0
    }

    all_locations = {
        "DEPOT": (0.0, 0.0)
    }

    # Paper-inspired work clusters
    work_clusters = {
        "Downtown": (0, 0),
        "Buckhead": (0, 15),
        "Airport": (0, -15),
        "Alpharetta": (0, 30),
        "Marietta": (-25, 15),
        "Doraville": (25, 15),
        "Decatur": (25, 0),
        "Douglasville": (-25, 0)
    }

    # 30 after-work locations across the region
    after_work_locations = []
    for a in range(1, 31):
        coord = (
            round(random.uniform(-35, 35), 3),
            round(random.uniform(-35, 35), 3)
        )
        after_work_locations.append(coord)

    customers = []
    
    total_demand = 0
    total_locations = 0
    type_counts = {"home_only": 0, "home_work": 0, "home_work_afterwork": 0}

    for c in range(1, n_customers + 1):

        # Demand capped by vehicle capacity
        demand = random.randint(min_demand, min(max_demand, vehicle_capacity))
        total_demand += demand

        home_x = round(random.uniform(-40, 40), 3)
        home_y = round(random.uniform(-40, 40), 3)
        home_coord = (home_x, home_y)

        r = random.random()

        if r < 0.10:
            customer_type = "home_only"
        elif r < 0.50:
            customer_type = "home_work"
        else:
            customer_type = "home_work_afterwork"
        
        type_counts[customer_type] += 1

        locations = []

        # ----------------------------------------------------
        # HOME-ONLY CUSTOMER
        # ----------------------------------------------------
        if customer_type == "home_only":
            loc_id = f"C{c}_HOME"
            locations.append({
                "location_id": loc_id,
                "type": "home",
                "x": home_x,
                "y": home_y,
                "time_window": [0.0, planning_horizon]
            })
            all_locations[loc_id] = home_coord
            total_locations += 1

        # ----------------------------------------------------
        # HOME-WORK OR HOME-WORK-AFTERWORK CUSTOMER
        # ----------------------------------------------------
        else:
            # Home morning (06:00 to 08:00)
            home_morning_id = f"C{c}_HOME_MORNING"
            locations.append({
                "location_id": home_morning_id,
                "type": "home_morning",
                "x": home_x,
                "y": home_y,
                "time_window": [0.0, MORNING_END]
            })
            all_locations[home_morning_id] = home_coord
            total_locations += 1

            # Work location around one work cluster
            cluster_name, cluster_coord = random.choice(list(work_clusters.items()))
            work_x = round(cluster_coord[0] + random.uniform(-5, 5), 3)
            work_y = round(cluster_coord[1] + random.uniform(-5, 5), 3)

            # Work schedule type
            schedule_type = random.choices(
                ["part_time", "almost_full_time", "full_time"],
                weights=[0.10, 0.10, 0.80],
                k=1
            )[0]

            if schedule_type == "part_time":
                work_start = random.choice([2.0, 6.0])
                work_duration = 4.0
            elif schedule_type == "almost_full_time":
                work_start = random.uniform(2.0, 4.0)
                work_duration = random.uniform(4.0, 7.0)
            else:
                work_start = random.uniform(2.0, 3.0)
                work_duration = random.uniform(7.0, 8.0)

            work_end = min(work_start + work_duration, EVENING_START - 0.5)

            work_id = f"C{c}_WORK"
            locations.append({
                "location_id": work_id,
                "type": "work",
                "work_cluster": cluster_name,
                "schedule_type": schedule_type,
                "x": work_x,
                "y": work_y,
                "time_window": [round(work_start, 3), round(work_end, 3)]
            })
            all_locations[work_id] = (work_x, work_y)
            total_locations += 1

            # Track previous end time for overlap prevention
            prev_end = work_end

            # Optional after-work location
            if customer_type == "home_work_afterwork":
                closest_after_work = min(
                    after_work_locations,
                    key=lambda p: euclidean_distance(home_coord, p)
                )

                after_start = max(prev_end + 0.25, MORNING_END + 0.5)
                after_start = min(after_start, EVENING_START - 0.5)
                remaining_time = planning_horizon - after_start

                if remaining_time > 1.0:
                    after_duration = random.uniform(0.5, min(2.0, remaining_time - 0.5))
                    after_end = min(after_start + after_duration, planning_horizon - 0.5)

                    after_id = f"C{c}_AFTERWORK"
                    locations.append({
                        "location_id": after_id,
                        "type": "after_work",
                        "x": closest_after_work[0],
                        "y": closest_after_work[1],
                        "time_window": [round(after_start, 3), round(after_end, 3)]
                    })
                    all_locations[after_id] = closest_after_work
                    total_locations += 1
                    prev_end = after_end

            # Home evening - FIXED: start after previous location ends
            home_evening_start = max(EVENING_START, prev_end + 0.1)
            home_evening_start = min(home_evening_start, planning_horizon - 0.5)
            
            home_evening_id = f"C{c}_HOME_EVENING"
            locations.append({
                "location_id": home_evening_id,
                "type": "home_evening",
                "x": home_x,
                "y": home_y,
                "time_window": [round(home_evening_start, 3), planning_horizon]
            })
            all_locations[home_evening_id] = home_coord
            total_locations += 1

        customers.append({
            "customer_id": c,
            "customer_type": customer_type,
            "demand": demand,
            "locations": locations
        })

    distance_matrix = build_distance_matrix(all_locations)

    # Build instance with metadata
    instance = {
        "instance_type": "realistic",
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "seed": seed,
            "n_customers": n_customers,
            "planning_horizon": planning_horizon,
            "vehicle_capacity": vehicle_capacity,
            "time_mapping": "0 = 06:00, 14 = 20:00",
            "total_demand": total_demand,
            "total_locations": total_locations,
            "customer_type_distribution": type_counts
        },
        "planning_horizon": planning_horizon,
        "time_mapping": "0 = 06:00, 14 = 20:00",
        "vehicle_capacity": vehicle_capacity,
        "depot": depot,
        "customers": customers,
        "distance_matrix": distance_matrix
    }
    
    return instance


# ============================================================
# SAVE INSTANCE SETS
# ============================================================

def save_json(data, filename):
    """Saves instance to JSON file with timestamp and metadata."""
    Path("generated_instances").mkdir(exist_ok=True)
    
    # Add timestamp to filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name, ext = filename.rsplit(".", 1)
    filename_with_time = f"{name}_{timestamp}.{ext}"
    
    file_path = Path("generated_instances") / filename_with_time

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

    print(f"Saved: {file_path}")
    return file_path


def generate_instance_sets(customer_sizes=None, save=True, validate=True):
    """
    Generates multiple instances for testing.
    
    Returns instances for programmatic use.
    Optional validation and saving to disk.
    """
    if customer_sizes is None:
        customer_sizes = [15, 30, 60]

    all_instances = {
        "general": [],
        "realistic": []
    }

    print("=" * 70)
    print("VRPRDL INSTANCE GENERATION")
    print("=" * 70)
    print(f"Customer sizes: {customer_sizes}")
    print()

    instance_id = 1

    for n in customer_sizes:
        print(f"\n--- Generating GENERAL instance with {n} customers ---")
        general = generate_general_instance(
            n_customers=n,
            max_locations_per_customer=5,
            max_roaming_distance=15,
            planning_horizon=12,
            vehicle_capacity=100,
            seed=100 + instance_id
        )
        
        all_instances["general"].append(general)
        
        if validate:
            validate_instance(general)
        
        if save:
            save_json(general, f"general_n{n}_id{instance_id}.json")
        
        instance_id += 1

    instance_id = 1

    for n in customer_sizes:
        print(f"\n--- Generating REALISTIC instance with {n} customers ---")
        realistic = generate_realistic_instance(
            n_customers=n,
            planning_horizon=14,
            vehicle_capacity=100,
            seed=200 + instance_id
        )
        
        all_instances["realistic"].append(realistic)
        
        if validate:
            validate_instance(realistic)
        
        if save:
            save_json(realistic, f"realistic_n{n}_id{instance_id}.json")
        
        instance_id += 1

    print("\n" + "=" * 70)
    print("GENERATION COMPLETE")
    print("=" * 70)
    
    return all_instances


# ============================================================
# HELPER FUNCTION TO READ AND USE INSTANCES
# ============================================================

def load_instance(filepath):
    """Loads a previously saved JSON instance."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_instance_summary(instance):
    """Prints a summary of the instance."""
    print("\n" + "=" * 60)
    print(f"INSTANCE SUMMARY: {instance['instance_type'].upper()}")
    print("=" * 60)
    print(f"  Customers:        {len(instance['customers'])}")
    print(f"  Planning horizon: {instance['planning_horizon']} hours")
    print(f"  Vehicle capacity: {instance['vehicle_capacity']}")
    print(f"  Total demand:     {instance['metadata']['total_demand']}")
    print(f"  Total locations:  {instance['metadata']['total_locations']}")
    
    if instance['instance_type'] == "realistic":
        print(f"  Type distribution: {instance['metadata']['customer_type_distribution']}")
    
    # Sample first customer
    first_cust = instance['customers'][0]
    print(f"\n  Sample customer (ID={first_cust['customer_id']}):")
    print(f"    Demand: {first_cust['demand']}")
    for loc in first_cust['locations'][:2]:
        print(f"    Location: {loc['location_id']}, window: {loc['time_window']}")


# ============================================================
# MAIN EXECUTION
# ============================================================

if __name__ == "__main__":
    # Generate all instances
    instances = generate_instance_sets(customer_sizes=[15, 30, 60], save=True, validate=True)
    
    # Load and display summary of first instance
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)
    
    # Find and load the first saved instance
    instance_dir = Path("generated_instances")
    if instance_dir.exists():
        files = list(instance_dir.glob("general*.json"))
        if files:
            example = load_instance(files[0])
            get_instance_summary(example)
    
    print("\n✅ All instances generated successfully!")