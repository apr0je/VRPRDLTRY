import { Router } from "express";
import { randomUUID } from "crypto";
import { runTabuSearch } from "../lib/vrprdl/tabu.js";
import { RunSolverBody } from "@workspace/api-zod";
import type { SolverJob } from "../lib/vrprdl/types.js";

const router = Router();

// In-memory job store (no DB needed for this academic demo)
const jobs = new Map<string, SolverJob>();

router.post("/solver/run", async (req, res) => {
  const parsed = RunSolverBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const { instance, config } = parsed.data as any;

  const jobId = randomUUID();
  const job: SolverJob = {
    job_id: jobId,
    status: "running",
    created_at: new Date().toISOString(),
    completed_at: null,
    config,
    instance_summary: {
      instance_type: instance.instance_type,
      n_customers: instance.customers.length,
      vehicle_capacity: instance.vehicle_capacity,
      planning_horizon: instance.planning_horizon,
    },
  };
  jobs.set(jobId, job);

  // Run solver synchronously (for demo purposes — small instances complete quickly)
  try {
    const result = runTabuSearch(instance, config);
    job.status = "completed";
    job.completed_at = new Date().toISOString();
    job.result = result;
    jobs.set(jobId, job);
    req.log.info({ jobId, cost: result.best_cost, runtime_ms: result.runtime_ms }, "Solver completed");
    return res.json(job);
  } catch (err) {
    req.log.error({ err, jobId }, "Solver failed");
    job.status = "failed";
    job.completed_at = new Date().toISOString();
    job.error = err instanceof Error ? err.message : "Unknown error";
    jobs.set(jobId, job);
    return res.status(500).json(job);
  }
});

router.get("/solver/result/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  return res.json(job);
});

router.get("/solver/jobs", (_req, res) => {
  const allJobs = Array.from(jobs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return res.json(allJobs);
});

export default router;
