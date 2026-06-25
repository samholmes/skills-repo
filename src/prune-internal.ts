#!/usr/bin/env bun
import { $ } from "bun"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { iterSkills, sourceOnlySkills } from "./lib/skills"

const installedRoots = [join(homedir(), ".agents", "skills"), join(homedir(), ".claude", "skills")]
const sourceOnlyNames = [...new Set(sourceOnlySkills(iterSkills()).map((skill) => skill.name))].sort()
const installedSourceOnlyNames = sourceOnlyNames.filter((name) =>
  installedRoots.some((root) => existsSync(join(root, name))),
)

if (installedSourceOnlyNames.length === 0) {
  console.log("No installed source-only skills to prune.")
  process.exit(0)
}

console.log("Pruning source-only skills from installs:")
for (const name of installedSourceOnlyNames) console.log(`  - ${name}`)

process.chdir(homedir())
await $`bunx skills remove ${installedSourceOnlyNames} --global --yes`
