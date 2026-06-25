#!/usr/bin/env bun
import { $ } from "bun"
import { installableSkills, iterSkills, repoRoot } from "./lib/skills"

process.chdir(repoRoot())

if (installableSkills(iterSkills()).length === 0) {
  console.log("No installable skills found; skipping.")
  process.exit(0)
}

await $`bunx skills add ./skills --list`
