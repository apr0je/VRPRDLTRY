/**
 * Algorithm 3: DP_CalculateCost
 *
 * Inner loop — finds optimal location and time assignments for a fixed customer sequence.
 * Uses dynamic programming to compute minimum total travel distance.
 *
 * z[c][tau_key][j] = min cost to serve customers 1..c,
 *                     arriving at location j of customer c at time tau
 *
 * Time is discretized into TIME_STEPS steps over the planning horizon.
 */

import type { VrprdlInstance, DeliveryAssignment } from "./types.js";

const TIME_STEPS = 50;

interface DPState {
  cost: number;
  prevCustomer: number;
  prevLocIdx: number;
  prevTimeIdx: number;
}

export interface DPResult {
  minCost: number;
  assignments: DeliveryAssignment[];
}

export function dpCalculateCost(
  sequence: number[],
  instance: VrprdlInstance
): DPResult {
  const { customers, distance_matrix, planning_horizon } = instance;
  const m = sequence.length;

  if (m === 0) {
    return { minCost: 0, assignments: [] };
  }

  const dt = planning_horizon / TIME_STEPS;

  // Build time grid
  function timeToIdx(t: number): number {
    return Math.min(TIME_STEPS - 1, Math.max(0, Math.round(t / dt)));
  }
  function idxToTime(idx: number): number {
    return idx * dt;
  }

  // Get customer objects in sequence order
  const seqCustomers = sequence.map((cid) => {
    const c = customers.find((cu) => cu.customer_id === cid);
    if (!c) throw new Error(`Customer ${cid} not found`);
    return c;
  });

  // dp[c][locIdx][timeIdx] = DPState | null
  // c=0 means depot (virtual)
  // c=1..m means sequence[c-1]
  const INF = Infinity;

  // Use Maps for sparse representation
  // Key: `${c},${locIdx},${timeIdx}`
  const dpMap = new Map<string, DPState>();

  const key = (c: number, l: number, t: number) => `${c},${l},${t}`;

  // Initial state: at depot at time 0
  // Depot is treated as customer 0 with single location idx 0 at time 0
  dpMap.set(key(0, 0, 0), { cost: 0, prevCustomer: -1, prevLocIdx: -1, prevTimeIdx: -1 });

  const depotId = instance.depot.location_id;

  for (let c = 1; c <= m; c++) {
    const cust = seqCustomers[c - 1];
    const custLocs = cust.locations;

    for (let j = 0; j < custLocs.length; j++) {
      const loc = custLocs[j];
      const locId = loc.location_id;
      const [twStart, twEnd] = loc.time_window;

      const twStartIdx = timeToIdx(twStart);
      const twEndIdx = timeToIdx(twEnd);

      for (let tauIdx = twStartIdx; tauIdx <= twEndIdx; tauIdx++) {
        const tau = idxToTime(tauIdx);

        // Previous customer's locations
        let prevLocs: { id: string; locations: { location_id: string; time_window: [number, number] }[] };

        if (c === 1) {
          // Coming from depot
          prevLocs = {
            id: depotId,
            locations: [{ location_id: depotId, time_window: [0, planning_horizon] as [number, number] }],
          };
        } else {
          const prevCust = seqCustomers[c - 2];
          prevLocs = {
            id: `cust_${prevCust.customer_id}`,
            locations: prevCust.locations,
          };
        }

        const prevLocsArr = prevLocs.locations;

        for (let i = 0; i < prevLocsArr.length; i++) {
          const prevLoc = prevLocsArr[i];
          const prevLocId = prevLoc.location_id;

          const travelTime = distance_matrix[prevLocId]?.[locId] ?? 0;

          // prevTau range: [twStart_prev, min(twEnd_prev, tau - travelTime)]
          const [prevTwStart, prevTwEnd] = prevLoc.time_window;
          const maxPrevTau = tau - travelTime;

          if (maxPrevTau < prevTwStart - 0.001) continue;

          const prevTwStartIdx = timeToIdx(prevTwStart);
          const prevTwEndIdx = timeToIdx(Math.min(prevTwEnd, maxPrevTau));

          if (prevTwStartIdx > prevTwEndIdx) continue;

          for (let tPrimeIdx = prevTwStartIdx; tPrimeIdx <= prevTwEndIdx; tPrimeIdx++) {
            let prevState: DPState | undefined;

            if (c === 1) {
              // Coming from depot
              if (tPrimeIdx === 0) {
                prevState = dpMap.get(key(0, 0, 0));
              }
            } else {
              prevState = dpMap.get(key(c - 1, i, tPrimeIdx));
            }

            if (!prevState) continue;

            const cost = prevState.cost + travelTime;
            const existing = dpMap.get(key(c, j, tauIdx));

            if (!existing || cost < existing.cost) {
              dpMap.set(key(c, j, tauIdx), {
                cost,
                prevCustomer: c - 1,
                prevLocIdx: i,
                prevTimeIdx: tPrimeIdx,
              });
            }
          }
        }
      }
    }
  }

  // Find best return to depot from last customer
  const lastCust = seqCustomers[m - 1];
  let minCost = INF;
  let bestLastLocIdx = -1;
  let bestLastTimeIdx = -1;

  for (let j = 0; j < lastCust.locations.length; j++) {
    const lastLoc = lastCust.locations[j];
    const lastLocId = lastLoc.location_id;
    const travelToDepot = distance_matrix[lastLocId]?.[depotId] ?? 0;

    const [twStart, twEnd] = lastLoc.time_window;
    const twStartIdx = timeToIdx(twStart);
    const twEndIdx = timeToIdx(twEnd);

    for (let tauIdx = twStartIdx; tauIdx <= twEndIdx; tauIdx++) {
      const state = dpMap.get(key(m, j, tauIdx));
      if (!state) continue;

      const tau = idxToTime(tauIdx);
      const returnTime = tau + travelToDepot;

      if (returnTime <= planning_horizon + 0.001) {
        const totalCost = state.cost + travelToDepot;
        if (totalCost < minCost) {
          minCost = totalCost;
          bestLastLocIdx = j;
          bestLastTimeIdx = tauIdx;
        }
      }
    }
  }

  if (minCost === INF) {
    // Fallback: greedy approach if DP found no feasible solution
    let greedyCost = 0;
    let prevId = depotId;
    const assignments: DeliveryAssignment[] = [];

    for (let c = 0; c < m; c++) {
      const cust = seqCustomers[c];
      const loc = cust.locations[0];
      const d = distance_matrix[prevId]?.[loc.location_id] ?? 0;
      greedyCost += d;
      prevId = loc.location_id;
      assignments.push({
        customer_id: cust.customer_id,
        location_id: loc.location_id,
        arrival_time: loc.time_window[0],
        x: loc.x,
        y: loc.y,
      });
    }
    greedyCost += distance_matrix[prevId]?.[depotId] ?? 0;

    return { minCost: greedyCost, assignments };
  }

  // Backtrack to recover assignments
  const assignments: DeliveryAssignment[] = [];
  let curLocIdx = bestLastLocIdx;
  let curTimeIdx = bestLastTimeIdx;
  let curC = m;

  while (curC >= 1) {
    const state = dpMap.get(key(curC, curLocIdx, curTimeIdx));
    if (!state) break;

    const cust = seqCustomers[curC - 1];
    const loc = cust.locations[curLocIdx];

    assignments.push({
      customer_id: cust.customer_id,
      location_id: loc.location_id,
      arrival_time: idxToTime(curTimeIdx),
      x: loc.x,
      y: loc.y,
    });

    curLocIdx = state.prevLocIdx;
    curTimeIdx = state.prevTimeIdx;
    curC = state.prevCustomer;
  }

  assignments.reverse();

  return { minCost, assignments };
}
