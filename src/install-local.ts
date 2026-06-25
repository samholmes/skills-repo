#!/usr/bin/env bun
import { $ } from "bun"
import { discoverAgents } from "./lib/agents"
import { installableSkills, iterSkills, repoRoot } from "./lib/skills"

process.chdir(repoRoot())

const discoveredAgents = discoverAgents().map((agent) => agent.slug)
if (discoveredAgents.length === 0) {
  console.error("error: no local agent harnesses discovered")
  console.error("Run bun run skills:agents to inspect discovery rules.")
  process.exit(1)
}

const discovered = new Set(discoveredAgents)
const skills = installableSkills(iterSkills())

if (skills.length === 0) {
  console.log("No installable skills found; skipping.")
  process.exit(0)
}

async function installSkillSet(skillNames: string[], agents: string[]) {
  if (skillNames.length === 0) return
  if (agents.length === 0) {
    console.log(`No discovered target agents for ${skillNames.join(", ")}; skipping.`)
    return
  }

  console.log("Installing skills from", `${repoRoot()}/skills`)
  console.log("Skills:", skillNames.join(" "))
  console.log("Target agents:", agents.join(" "))
  console.log(
    `Running: bunx skills add ./skills --global --yes --skill ${skillNames.join(" ")} --agent ${agents.join(" ")}`,
  )
  await $`bunx skills add ./skills --global --yes --skill ${skillNames} --agent ${agents}`
}

const universalSkills = skills.filter((skill) => skill.targets.includes("universal")).map((skill) => skill.name)
await installSkillSet(universalSkills, discoveredAgents)

const targeted = new Map<string, string[]>()
for (const skill of skills) {
  if (skill.targets.includes("universal")) continue
  for (const target of skill.targets) {
    const names = targeted.get(target) ?? []
    names.push(skill.name)
    targeted.set(target, names)
  }
}

for (const [target, skillNames] of targeted) {
  if (!discovered.has(target)) {
    console.log(`${target} not discovered; skipping ${skillNames.join(", ")}.`)
    continue
  }
  await installSkillSet(skillNames, [target])
}
