export interface LocationEntry {
  location_id: string;
  type: string;
  x: number;
  y: number;
  time_window: [number, number];
  work_cluster?: string;
  schedule_type?: string;
}

export interface Customer {
  customer_id: number;
  demand: number;
  customer_type?: string;
  locations: LocationEntry[];
}

export interface DepotInfo {
  location_id: string;
  x: number;
  y: number;
}

export interface InstanceMetadata {
  generated_at?: string;
  seed: number;
  n_customers: number;
  planning_horizon: number;
  vehicle_capacity: number;
  total_demand: number;
  total_locations: number;
  max_locations_per_customer?: number;
  max_roaming_distance?: number;
  time_mapping?: string;
  customer_type_distribution?: Record<string, number>;
}

export interface VrprdlInstance {
  instance_type: "general" | "realistic";
  planning_horizon: number;
  vehicle_capacity: number;
  depot: DepotInfo;
  customers: Customer[];
  distance_matrix: Record<string, Record<string, number>>;
  metadata: InstanceMetadata;
  time_mapping?: string;
}

export interface InstanceConfig {
  instanceType: "general" | "realistic";
  nCustomers: number;
  seed?: number;
  vehicleCapacity?: number;
  planningHorizon?: number;
  maxLocationsPerCustomer?: number;
  maxRoamingDistance?: number;
}

export interface SolverConfig {
  maxIter: number;
  tabuTenure: number;
  maxNoImprove: number;
}

export type MoveType = ["swap", number, number] | ["insert", number, number] | ["2opt", number, number];

export interface Solution {
  sequence: number[];
  cost: number;
  move?: MoveType;
}

export interface DeliveryAssignment {
  customer_id: number;
  location_id: string;
  arrival_time: number;
  x: number;
  y: number;
}

export interface ConvergencePoint {
  iteration: number;
  cost: number;
  best_cost: number;
}

export interface SolverResult {
  best_cost: number;
  best_sequence: number[];
  assignments: DeliveryAssignment[];
  convergence_history: ConvergencePoint[];
  iterations_run: number;
  runtime_ms: number;
  initial_cost: number;
  improvement_pct: number;
}

export interface SolverJob {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at?: string | null;
  result?: SolverResult;
  error?: string | null;
  config?: SolverConfig;
  instance_summary?: {
    instance_type: string;
    n_customers: number;
    vehicle_capacity: number;
    planning_horizon: number;
  };
}
