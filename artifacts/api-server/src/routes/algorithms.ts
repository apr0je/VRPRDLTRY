import { Router } from "express";

const router = Router();

router.get("/algorithms/info", (_req, res) => {
  return res.json({
    tabu_search: {
      name: "Tabu Search (Algorithm 2)",
      description:
        "A metaheuristic that iteratively explores the solution space by generating neighbourhoods and selecting the best admissible move. A tabu list prevents revisiting recently explored moves. An aspiration criterion allows tabu moves if they improve the global best. A diversification strategy (random jump) escapes local optima.",
      steps: [
        "Generate random initial solution s₀",
        "Calculate cost using DP (Algorithm 3)",
        "Initialize: s* = s₀, tabuList = ∅, noImproveCount = 0",
        "Loop while iteration ≤ maxIter:",
        "  Generate neighbourhood N(s_cur) — Algorithm 1",
        "  For each s′ ∈ N(s_cur): compute DP cost",
        "  Select best non-tabu neighbour (or tabu if aspiration criterion met)",
        "  Update s_cur ← bestNeighbour",
        "  If bestCost < s*.cost: update s*, reset noImproveCount",
        "  Else: increment noImproveCount",
        "  Update tabu list (add move, evict oldest if |list| > tabuTenure)",
        "  If noImproveCount > maxNoImprove: RandomJump (diversification)",
        "Return s*",
      ],
    },
    dynamic_programming: {
      name: "DP Cost Calculation (Algorithm 3)",
      description:
        "Computes the minimum total travel distance for a fixed customer delivery sequence by optimally selecting delivery locations and times. Uses a discretised time grid. z[c,τ,j] = minimum cost to serve customers 1..c, arriving at location j of customer c at time τ.",
      steps: [
        "Initialise: z[0,0,depot] = 0; all others = ∞",
        "For c = 1 to m (each customer in sequence):",
        "  For each location j ∈ N_c (customer c's locations):",
        "    For each time τ in time window [a_j^c, b_j^c]:",
        "      For each previous location i ∈ N_{c-1}:",
        "        For each prev time τ′ in [a_i^{c-1}, min(b_i^{c-1}, τ−t_ij)]:",
        "          cost = z[c−1,τ′,i] + t_ij",
        "          If cost < z[c,τ,j]: update DP table and store prev pointer",
        "Find best return-to-depot: minimise z[m,τ,j] + t_{j,depot}",
        "Backtrack using prev[] pointers to recover delivery assignments",
        "Return minCost and assignments",
      ],
    },
    neighborhood_operators: [
      {
        name: "Swap Operator",
        description:
          "Exchanges the positions of two customers i and j in the delivery sequence. Creates O(m²/2) neighbours for a sequence of length m.",
        steps: [
          "Input: sequence, positions i and j",
          "newSeq = copy(sequence)",
          "Swap newSeq[i] and newSeq[j]",
          "move = ('swap', i, j)",
          "Return (newSeq, move)",
        ],
      },
      {
        name: "Insert Operator",
        description:
          "Removes the customer at position i and reinserts it at position j. Creates O(m×(m−1)) neighbours.",
        steps: [
          "Input: sequence, remove position c, insert position newPos",
          "newSeq = copy(sequence)",
          "customer = newSeq[c]",
          "newSeq.removeAt(c)",
          "newSeq.insertAt(newPos, customer)",
          "move = ('insert', c, newPos)",
          "Return (newSeq, move)",
        ],
      },
      {
        name: "2-opt Operator",
        description:
          "Reverses the subsequence of customers from position i to j. Equivalent to removing two edges and reconnecting. Creates O(m²/2) neighbours.",
        steps: [
          "Input: sequence, start i, end k",
          "newSeq = copy(sequence)",
          "segment = newSeq[i : k+1]",
          "reversed_segment = reverse(segment)",
          "newSeq[i : k+1] = reversed_segment",
          "move = ('2opt', i, k)",
          "Return (newSeq, move)",
        ],
      },
    ],
  });
});

export default router;
