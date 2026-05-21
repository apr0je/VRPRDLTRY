/**
 * Algorithm 2: Tabu Search for VRPRDL
 *
 * Outer loop — calls Algorithm 1 (neighbourhood) and Algorithm 3 (DP) at each iteration.
 *
 * Key features:
 * - Tabu list prevents revisiting recently explored moves
 * - Aspiration criterion: accept tabu move if it improves global best
 * - Diversification: random jump when stuck for maxNoImprove iterations
 */

import type { VrprdlInstance, SolverConfig, Solution, SolverResult, ConvergencePoint, MoveType } from "./types.js";
import { dpCalculateCost } from "./dp.js";
import { generateNeighbourhood, movesEqual } from "./neighborhood.js";

/**
 * Generate a random initial solution by shuffling customer IDs.
 * Pseudocode: GenerateRandomInitialSolution(C)
 */
function generateRandomInitialSolution(customerIds: number[], seed: number): number[] {
  const seq = [...customerIds];
  // Simple seeded Fisher-Yates shuffle
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

/**
 * Random jump for diversification.
 * Pseudocode: RandomJump(s_cur)
 * Performs a random insert move to escape local optima.
 */
function randomJump(solution: Solution, seed: number): Solution {
  const seq = [...solution.sequence];
  const m = seq.length;
  if (m < 2) return solution;

  let s = seed + solution.cost;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const i = Math.floor(rand() * m);
  let j = Math.floor(rand() * m);
  while (j === i) j = Math.floor(rand() * m);

  const newSeq = [...seq];
  const [customer] = newSeq.splice(i, 1);
  newSeq.splice(j, 0, customer);

  return { sequence: newSeq, cost: Infinity, move: ["insert", i, j] };
}

export function runTabuSearch(
  instance: VrprdlInstance,
  config: SolverConfig
): SolverResult {
  const startTime = Date.now();
  const { maxIter, tabuTenure, maxNoImprove } = config;

  const customerIds = instance.customers.map((c) => c.customer_id);

  // Generate initial solution
  const initSeq = generateRandomInitialSolution(customerIds, 42);
  const initDP = dpCalculateCost(initSeq, instance);

  let sCurrent: Solution = { sequence: initSeq, cost: initDP.minCost };
  let sBest: Solution = { ...sCurrent };

  const initialCost = initDP.minCost;

  const tabuList: MoveType[] = [];
  let noImproveCount = 0;
  let iteration = 1;

  const convergenceHistory: ConvergencePoint[] = [
    { iteration: 0, cost: sCurrent.cost, best_cost: sBest.cost },
  ];

  // Algorithm 2: Main Tabu Search loop
  while (iteration <= maxIter) {
    // Algorithm 1: Generate neighbourhood
    const neighbours = generateNeighbourhood(sCurrent);

    // Sort by index-order (all costs are Infinity until evaluated)
    // We evaluate costs and find best admissible neighbour
    let bestNeighbour: Solution | null = null;
    let bestCost = Infinity;

    for (const neighbour of neighbours) {
      // Algorithm 3: Calculate DP cost for this neighbour
      const dpResult = dpCalculateCost(neighbour.sequence, instance);
      neighbour.cost = dpResult.minCost;

      const isTabu = neighbour.move
        ? tabuList.some((tm) => movesEqual(tm, neighbour.move!))
        : false;

      if (!isTabu) {
        // Non-tabu: accept if best so far
        if (neighbour.cost < bestCost) {
          bestNeighbour = neighbour;
          bestCost = neighbour.cost;
        }
      } else {
        // Aspiration criterion: accept tabu move if it improves global best
        if (neighbour.cost < sBest.cost && neighbour.cost < bestCost) {
          bestNeighbour = neighbour;
          bestCost = neighbour.cost;
        }
      }
    }

    if (!bestNeighbour) {
      // No admissible neighbour found — diversify
      sCurrent = randomJump(sCurrent, iteration);
      const jumpDP = dpCalculateCost(sCurrent.sequence, instance);
      sCurrent.cost = jumpDP.minCost;
      noImproveCount = 0;
    } else {
      sCurrent = bestNeighbour;

      if (bestCost < sBest.cost) {
        sBest = { ...bestNeighbour };
        noImproveCount = 0;
      } else {
        noImproveCount += 1;
      }

      // Update tabu list
      if (bestNeighbour.move) {
        tabuList.push(bestNeighbour.move);
        if (tabuList.length > tabuTenure) {
          tabuList.shift();
        }
      }

      // Diversification: random jump if stuck
      if (noImproveCount > maxNoImprove) {
        sCurrent = randomJump(sCurrent, iteration);
        const jumpDP = dpCalculateCost(sCurrent.sequence, instance);
        sCurrent.cost = jumpDP.minCost;
        noImproveCount = 0;
      }
    }

    // Record convergence every 5 iterations or at key points
    if (iteration % 5 === 0 || iteration <= 10 || iteration === maxIter) {
      convergenceHistory.push({
        iteration,
        cost: sCurrent.cost,
        best_cost: sBest.cost,
      });
    }

    iteration++;
  }

  // Compute final assignments for best solution
  const finalDP = dpCalculateCost(sBest.sequence, instance);

  const runtimeMs = Date.now() - startTime;
  const improvementPct = initialCost > 0
    ? Math.round(((initialCost - finalDP.minCost) / initialCost) * 10000) / 100
    : 0;

  return {
    best_cost: finalDP.minCost,
    best_sequence: sBest.sequence,
    assignments: finalDP.assignments,
    convergence_history: convergenceHistory,
    iterations_run: maxIter,
    runtime_ms: runtimeMs,
    initial_cost: initialCost,
    improvement_pct: improvementPct,
  };
}
