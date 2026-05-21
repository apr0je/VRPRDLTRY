import type { VrprdlInstance, Customer, LocationEntry, InstanceConfig } from "./types.js";

function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function euclideanDistance(p1: [number, number], p2: [number, number]): number {
  return Math.round(Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) * 1000) / 1000;
}

function buildDistanceMatrix(locations: Record<string, [number, number]>): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const [locI, coordI] of Object.entries(locations)) {
    matrix[locI] = {};
    for (const [locJ, coordJ] of Object.entries(locations)) {
      matrix[locI][locJ] = euclideanDistance(coordI, coordJ);
    }
  }
  return matrix;
}

export function generateGeneralInstance(config: InstanceConfig): VrprdlInstance {
  const {
    nCustomers,
    seed = 42,
    vehicleCapacity = 100,
    planningHorizon = 12,
    maxLocationsPerCustomer = 5,
    maxRoamingDistance = 15,
  } = config;

  const rand = seededRandom(seed);

  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const randFloat = (min: number, max: number) => rand() * (max - min) + min;
  const roundTo = (v: number, d: number) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);

  const allLocations: Record<string, [number, number]> = {
    DEPOT: [0.0, 0.0],
  };

  const customers: Customer[] = [];
  let totalDemand = 0;
  let totalLocations = 0;

  for (let c = 1; c <= nCustomers; c++) {
    const demand = randInt(1, Math.min(10, vehicleCapacity));
    totalDemand += demand;

    const homeX = roundTo(randFloat(-40, 40), 3);
    const homeY = roundTo(randFloat(-40, 40), 3);
    const homeCoord: [number, number] = [homeX, homeY];

    const mC = randInt(1, maxLocationsPerCustomer);
    const locations: LocationEntry[] = [];

    if (mC === 1) {
      const locId = `C${c}_HOME`;
      locations.push({
        location_id: locId,
        type: "home",
        x: homeX,
        y: homeY,
        time_window: [0.0, planningHorizon],
      });
      allLocations[locId] = homeCoord;
      totalLocations += 1;
    } else {
      const nRoaming = mC >= 2 ? mC - 2 : 0;
      totalLocations += nRoaming + 2;

      const morningHomeId = `C${c}_HOME_MORNING`;
      locations.push({
        location_id: morningHomeId,
        type: "home_morning",
        x: homeX,
        y: homeY,
        time_window: [0, 0],
      });
      allLocations[morningHomeId] = homeCoord;

      const roamingCoords: [number, number][] = [];
      for (let r = 1; r <= nRoaming; r++) {
        const angle = rand() * 2 * Math.PI;
        const radius = Math.min(maxRoamingDistance * Math.sqrt(rand()), maxRoamingDistance);
        const x = roundTo(homeX + radius * Math.cos(angle), 3);
        const y = roundTo(homeY + radius * Math.sin(angle), 3);
        roamingCoords.push([x, y]);

        const locId = `C${c}_ROAMING_${r}`;
        locations.push({
          location_id: locId,
          type: `roaming_${r}`,
          x,
          y,
          time_window: [0, 0],
        });
        allLocations[locId] = [x, y];
      }

      const eveningHomeId = `C${c}_HOME_EVENING`;
      locations.push({
        location_id: eveningHomeId,
        type: "home_evening",
        x: homeX,
        y: homeY,
        time_window: [0, 0],
      });
      allLocations[eveningHomeId] = homeCoord;

      const orderedCoords: [number, number][] = [homeCoord, ...roamingCoords, homeCoord];
      let travelTimes: number[] = [];
      for (let idx = 0; idx < orderedCoords.length - 1; idx++) {
        travelTimes.push(euclideanDistance(orderedCoords[idx], orderedCoords[idx + 1]));
      }

      const totalTravel = travelTimes.reduce((a, b) => a + b, 0);
      if (totalTravel >= planningHorizon) {
        const scale = (planningHorizon * 0.4) / totalTravel;
        travelTimes = travelTimes.map((t) => t * scale);
      }

      const availableTime = Math.max(0.1, planningHorizon - travelTimes.reduce((a, b) => a + b, 0));
      const rawWeights = locations.map(() => rand());
      const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
      const stayTimes = rawWeights.map((w) => (w / totalWeight) * availableTime);

      let currentTime = 0.0;
      for (let idx = 0; idx < locations.length; idx++) {
        const start = roundTo(currentTime, 3);
        const end = roundTo(currentTime + stayTimes[idx], 3);
        locations[idx].time_window = [start, end];
        if (idx < travelTimes.length) {
          currentTime = end + travelTimes[idx];
        }
      }

      if (locations.length > 0) {
        locations[locations.length - 1].time_window[1] = planningHorizon;
      }
    }

    customers.push({ customer_id: c, demand, locations });
  }

  const distanceMatrix = buildDistanceMatrix(allLocations);

  return {
    instance_type: "general",
    planning_horizon: planningHorizon,
    vehicle_capacity: vehicleCapacity,
    depot: { location_id: "DEPOT", x: 0.0, y: 0.0 },
    customers,
    distance_matrix: distanceMatrix,
    metadata: {
      generated_at: new Date().toISOString(),
      seed,
      n_customers: nCustomers,
      planning_horizon: planningHorizon,
      vehicle_capacity: vehicleCapacity,
      total_demand: totalDemand,
      total_locations: totalLocations,
      max_locations_per_customer: maxLocationsPerCustomer,
      max_roaming_distance: maxRoamingDistance,
    },
  };
}

export function generateRealisticInstance(config: InstanceConfig): VrprdlInstance {
  const {
    nCustomers,
    seed = 42,
    vehicleCapacity = 100,
    planningHorizon = 14,
  } = config;

  const rand = seededRandom(seed);
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const randFloat = (min: number, max: number) => rand() * (max - min) + min;
  const roundTo = (v: number, d: number) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);

  const MORNING_END = 2.0;
  const EVENING_START = 12.0;

  const workClusters: Record<string, [number, number]> = {
    Downtown: [0, 0],
    Buckhead: [0, 15],
    Airport: [0, -15],
    Alpharetta: [0, 30],
    Marietta: [-25, 15],
    Doraville: [25, 15],
    Decatur: [25, 0],
    Douglasville: [-25, 0],
  };

  const afterWorkLocations: [number, number][] = [];
  for (let a = 0; a < 30; a++) {
    afterWorkLocations.push([roundTo(randFloat(-35, 35), 3), roundTo(randFloat(-35, 35), 3)]);
  }

  const allLocations: Record<string, [number, number]> = { DEPOT: [0.0, 0.0] };
  const customers: Customer[] = [];
  let totalDemand = 0;
  let totalLocations = 0;
  const typeCounts: Record<string, number> = { home_only: 0, home_work: 0, home_work_afterwork: 0 };

  for (let c = 1; c <= nCustomers; c++) {
    const demand = randInt(1, Math.min(10, vehicleCapacity));
    totalDemand += demand;

    const homeX = roundTo(randFloat(-40, 40), 3);
    const homeY = roundTo(randFloat(-40, 40), 3);
    const homeCoord: [number, number] = [homeX, homeY];

    const r = rand();
    let customerType: string;
    if (r < 0.1) customerType = "home_only";
    else if (r < 0.5) customerType = "home_work";
    else customerType = "home_work_afterwork";

    typeCounts[customerType]++;

    const locations: LocationEntry[] = [];

    if (customerType === "home_only") {
      const locId = `C${c}_HOME`;
      locations.push({ location_id: locId, type: "home", x: homeX, y: homeY, time_window: [0.0, planningHorizon] });
      allLocations[locId] = homeCoord;
      totalLocations += 1;
    } else {
      const homeMorningId = `C${c}_HOME_MORNING`;
      locations.push({ location_id: homeMorningId, type: "home_morning", x: homeX, y: homeY, time_window: [0.0, MORNING_END] });
      allLocations[homeMorningId] = homeCoord;
      totalLocations += 1;

      const clusterNames = Object.keys(workClusters);
      const clusterName = clusterNames[Math.floor(rand() * clusterNames.length)];
      const clusterCoord = workClusters[clusterName];
      const workX = roundTo(clusterCoord[0] + randFloat(-5, 5), 3);
      const workY = roundTo(clusterCoord[1] + randFloat(-5, 5), 3);

      const scheduleRand = rand();
      let workStart: number, workEnd: number;
      if (scheduleRand < 0.1) {
        workStart = rand() < 0.5 ? 2.0 : 6.0;
        workEnd = Math.min(workStart + 4.0, EVENING_START - 0.5);
      } else if (scheduleRand < 0.2) {
        workStart = randFloat(2.0, 4.0);
        workEnd = Math.min(workStart + randFloat(4.0, 7.0), EVENING_START - 0.5);
      } else {
        workStart = randFloat(2.0, 3.0);
        workEnd = Math.min(workStart + randFloat(7.0, 8.0), EVENING_START - 0.5);
      }

      const workId = `C${c}_WORK`;
      locations.push({
        location_id: workId,
        type: "work",
        work_cluster: clusterName,
        schedule_type: scheduleRand < 0.1 ? "part_time" : scheduleRand < 0.2 ? "almost_full_time" : "full_time",
        x: workX,
        y: workY,
        time_window: [roundTo(workStart, 3), roundTo(workEnd, 3)],
      });
      allLocations[workId] = [workX, workY];
      totalLocations += 1;

      let prevEnd = workEnd;

      if (customerType === "home_work_afterwork") {
        const closest = afterWorkLocations.reduce((best, p) =>
          euclideanDistance(homeCoord, p) < euclideanDistance(homeCoord, best) ? p : best
        );

        const afterStart = Math.min(Math.max(prevEnd + 0.25, MORNING_END + 0.5), EVENING_START - 0.5);
        const remainingTime = planningHorizon - afterStart;

        if (remainingTime > 1.0) {
          const afterDuration = randFloat(0.5, Math.min(2.0, remainingTime - 0.5));
          const afterEnd = Math.min(afterStart + afterDuration, planningHorizon - 0.5);

          const afterId = `C${c}_AFTERWORK`;
          locations.push({
            location_id: afterId,
            type: "after_work",
            x: closest[0],
            y: closest[1],
            time_window: [roundTo(afterStart, 3), roundTo(afterEnd, 3)],
          });
          allLocations[afterId] = closest;
          totalLocations += 1;
          prevEnd = afterEnd;
        }
      }

      const homeEveningStart = Math.min(Math.max(EVENING_START, prevEnd + 0.1), planningHorizon - 0.5);
      const homeEveningId = `C${c}_HOME_EVENING`;
      locations.push({
        location_id: homeEveningId,
        type: "home_evening",
        x: homeX,
        y: homeY,
        time_window: [roundTo(homeEveningStart, 3), planningHorizon],
      });
      allLocations[homeEveningId] = homeCoord;
      totalLocations += 1;
    }

    customers.push({ customer_id: c, demand, customer_type: customerType, locations });
  }

  const distanceMatrix = buildDistanceMatrix(allLocations);

  return {
    instance_type: "realistic",
    planning_horizon: planningHorizon,
    vehicle_capacity: vehicleCapacity,
    time_mapping: "0 = 06:00, 14 = 20:00",
    depot: { location_id: "DEPOT", x: 0.0, y: 0.0 },
    customers,
    distance_matrix: distanceMatrix,
    metadata: {
      generated_at: new Date().toISOString(),
      seed,
      n_customers: nCustomers,
      planning_horizon: planningHorizon,
      vehicle_capacity: vehicleCapacity,
      time_mapping: "0 = 06:00, 14 = 20:00",
      total_demand: totalDemand,
      total_locations: totalLocations,
      customer_type_distribution: typeCounts,
    },
  };
}
