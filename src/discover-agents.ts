#!/usr/bin/env bun
import { discoverAgents } from "./lib/agents"

const args = new Set(process.argv.slice(2))
const json = args.has("--json")
const explain = args.has("--explain")
const includeProjectOnly = args.has("--include-project-only")

const found = discoverAgents({ includeProjectOnly })

if (json) {
  console.log(JSON.stringify(found, null, 2))
  process.exit(0)
}

if (explain) {
  for (const agent of found) {
    const install = agent.globalInstall ? "global" : "project-only"
    console.log(`${agent.slug}\t${agent.name}\t${install}\t${agent.matched.join(", ")}`)
  }
  process.exit(0)
}

for (const agent of found) {
  if (agent.globalInstall) console.log(agent.slug)
}
