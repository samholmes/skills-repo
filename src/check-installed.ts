#!/usr/bin/env bun
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import {
  compareSkill,
  installableSkills,
  installedRootsForSkill,
  iterSkills,
  sourceOnlySkills,
} from "./lib/skills"

const args = new Set(process.argv.slice(2))
const listNewInstalls = args.has("--new-installs")

const skills = iterSkills()
const installable = installableSkills(skills)
const sourceOnly = sourceOnlySkills(skills)

if (skills.length === 0) {
  console.error("error: no skills found under skills/ or .agents/skills/")
  process.exit(1)
}

if (listNewInstalls) {
  for (const skill of installable) {
    const roots = installedRootsForSkill(skill)
    if (roots.some((root) => !existsSync(join(root, skill.name)))) {
      console.log(`${skill.label}/${skill.name}`)
    }
  }
  process.exit(0)
}

const allProblems = new Map<string, string[]>()

for (const skill of installable) {
  const roots = installedRootsForSkill(skill)
  if (roots.length === 0) {
    allProblems.set(`${skill.label}/${skill.name}`, [
      `no installed root is known for targets: ${skill.targets.join(", ")}`,
    ])
    continue
  }

  for (const root of roots) {
    const problems = compareSkill(skill.directory, join(root, skill.name))
    if (problems.length > 0) {
      const key = `${skill.label}/${skill.name}`
      allProblems.set(key, [...(allProblems.get(key) ?? []), ...problems])
    }
  }
}

const installedRoots = [join(homedir(), ".agents", "skills"), join(homedir(), ".claude", "skills")]
for (const skill of sourceOnly) {
  for (const root of installedRoots) {
    const installedDir = join(root, skill.name)
    if (existsSync(installedDir)) {
      const key = `${skill.label}/${skill.name}`
      allProblems.set(key, [
        ...(allProblems.get(key) ?? []),
        `source-only skill should not be installed: ${installedDir}`,
      ])
    }
  }
}

if (allProblems.size > 0) {
  console.log("Installed skills are not in sync with this repository.\n")
  for (const [name, problems] of allProblems) {
    console.log(`${name}:`)
    for (const problem of problems) console.log(`  - ${problem}`)
    console.log()
  }
  console.log("Run: bun run skills:sync")
  process.exit(1)
}

const universalCount = installable.filter((skill) => skill.targets.includes("universal")).length
const claudeCount = installable.filter(
  (skill) => skill.targets.includes("claude-code") && !skill.targets.includes("universal"),
).length
console.log(
  `OK: ${universalCount} universal skill(s), ${claudeCount} Claude-only skill(s), and ${sourceOnly.length} source-only skill(s) are in sync.`,
)
