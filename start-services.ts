#!/usr/bin/env bun

/**
 * Sequential Service Startup Script
 * Starts all microservices in the correct dependency order
 */

import { spawn } from "bun";

const services = [
  { name: "@exness/price-poller", wait: 3000 },
  { name: "liquidation-engine", wait: 5000 },
  { name: "@exness/batch-uploader", wait: 2000 },
  { name: "db-worker", wait: 2000 },
  { name: "realtime-server", wait: 2000 },
  { name: "@exness/http-backend", wait: 2000 },
];

console.log("\n🚀 Starting all services sequentially...\n");

for (const [index, service] of services.entries()) {
  console.log(`[${index + 1}/${services.length}] Starting ${service.name}...`);

  // Start the service in background
  spawn({
    cmd: ["bun", "run", "start"],
    cwd: `./apps/${service.name.replace("@exness/", "")}`,
    stdout: "inherit",
    stderr: "inherit",
  });

  // Wait before starting next service
  await Bun.sleep(service.wait);
  console.log(`✓ ${service.name} ready\n`);
}

console.log("✅ All services started!\n");
console.log("Service Endpoints:");
console.log("  HTTP API:     http://localhost:3005");
console.log("  WebSocket:    ws://localhost:3006");
console.log("  Redis:        localhost:6380");
console.log("  PostgreSQL:   localhost:5432\n");
