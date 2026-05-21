import { Router } from "express";
import { generateGeneralInstance, generateRealisticInstance } from "../lib/vrprdl/generator.js";
import { GenerateInstanceBody } from "@workspace/api-zod";

const router = Router();

router.post("/instances/generate", async (req, res) => {
  const parsed = GenerateInstanceBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const { instanceType, nCustomers, seed, vehicleCapacity, planningHorizon, maxLocationsPerCustomer, maxRoamingDistance } = parsed.data;

  try {
    const instance = instanceType === "realistic"
      ? generateRealisticInstance({ instanceType, nCustomers, seed, vehicleCapacity, planningHorizon })
      : generateGeneralInstance({ instanceType, nCustomers, seed, vehicleCapacity, planningHorizon, maxLocationsPerCustomer, maxRoamingDistance });

    return res.json(instance);
  } catch (err) {
    req.log.error({ err }, "Failed to generate instance");
    return res.status(500).json({ error: "Failed to generate instance" });
  }
});

export default router;
