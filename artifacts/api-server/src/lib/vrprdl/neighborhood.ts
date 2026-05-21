/**
 * Algorithm 1: Generate Neighbourhood
 *
 * Produces all candidate neighbours using three move operators:
 * 1. Swap: exchange positions of two customers
 * 2. Insert: remove customer at i, insert at j
 * 3. 2-opt: reverse subsequence from i to j
 */

import type { Solution, MoveType } from "./types.js";

/**
 * Swap Operator:
 * Creates a new sequence with customers at positions i and j swapped.
 * Flowchart: newSeq = copy(seq) → swap[i] and [j] → save move → return
 */
export function generateSwapNeighbours(solution: Solution): Solution[] {
  const { sequence } = solution;
  const m = sequence.length;
  const neighbours: Solution[] = [];

  for (let i = 0; i < m - 1; i++) {
    for (let j = i + 1; j < m; j++) {
      const newSeq = [...sequence];
      // Swap elements at positions i and j
      [newSeq[i], newSeq[j]] = [newSeq[j], newSeq[i]];
      const move: MoveType = ["swap", i, j];
      neighbours.push({ sequence: newSeq, cost: Infinity, move });
    }
  }

  return neighbours;
}

/**
 * Insert Operator:
 * Remove customer at position i, insert at position j.
 * Flowchart: newSeq = copy(seq) → remove at c → insertAt(newPos) → save move → return
 */
export function generateInsertNeighbours(solution: Solution): Solution[] {
  const { sequence } = solution;
  const m = sequence.length;
  const neighbours: Solution[] = [];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      if (i === j) continue;

      const newSeq = [...sequence];
      // Remove customer at position i
      const [customer] = newSeq.splice(i, 1);
      // Insert customer at position j
      newSeq.splice(j, 0, customer);
      const move: MoveType = ["insert", i, j];
      neighbours.push({ sequence: newSeq, cost: Infinity, move });
    }
  }

  return neighbours;
}

/**
 * 2-opt Operator:
 * Reverse the subsequence from position i to j (inclusive).
 * Flowchart: newSeq = copy(seq) → extract segment[i:k+1] → reverse → place back → save move → return
 */
export function generate2optNeighbours(solution: Solution): Solution[] {
  const { sequence } = solution;
  const m = sequence.length;
  const neighbours: Solution[] = [];

  for (let i = 0; i < m - 1; i++) {
    for (let j = i + 1; j < m; j++) {
      const newSeq = [...sequence];
      // Reverse subsequence from i to j
      const segment = newSeq.slice(i, j + 1).reverse();
      newSeq.splice(i, j - i + 1, ...segment);
      const move: MoveType = ["2opt", i, j];
      neighbours.push({ sequence: newSeq, cost: Infinity, move });
    }
  }

  return neighbours;
}

/**
 * Generate complete neighbourhood N(s) using all three operators.
 * Pseudocode Algorithm 1.
 */
export function generateNeighbourhood(solution: Solution): Solution[] {
  return [
    ...generateSwapNeighbours(solution),
    ...generateInsertNeighbours(solution),
    ...generate2optNeighbours(solution),
  ];
}

/**
 * Check if two moves are equal (for tabu list comparison)
 */
export function movesEqual(a: MoveType, b: MoveType): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
