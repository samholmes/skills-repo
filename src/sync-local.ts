#!/usr/bin/env bun
import { $ } from "bun"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { stdin, stdout } from "node:process"
import { createInterface } from "node:readline/promises"
import { repoRoot } from "./lib/skills"

process.chdir(repoRoot())
function script(name: string): string {
  const tsPath = join(import.meta.dir, name)
  if (existsSync(tsPath)) return tsPath
  return join(import.meta.dir, name.replace(/\.ts$/, ".js"))
}

async function runInherited(command: string[]) {
  const proc = Bun.spawn(command, { stdin: "inherit", stdout: "inherit", stderr: "inherit" })
  return await proc.exited
}

async function output(command: string[]) {
  const proc = Bun.spawn(command, { stdout: "pipe", stderr: "inherit" })
  const text = await new Response(proc.stdout).text()
  const code = await proc.exited
  if (code !== 0) process.exit(code)
  return text.trim()
}

async function confirmNewInstalls(newInstalls: string) {
  if (!newInstalls) return

  console.log()
  console.log("New skills are present in this repo but are not installed yet:")
  for (const skill of newInstalls.split("\n").filter(Boolean)) console.log(`  - ${skill}`)
  console.log()

  if (process.env.SKILLS_SYNC_CONFIRM_NEW === "1") {
    console.log("SKILLS_SYNC_CONFIRM_NEW=1 set; installing new skills.")
    return
  }

  if (!process.stdin.isTTY) {
    console.error("Refusing to install new skills without confirmation.")
    console.error(
      "Re-run interactively, or set SKILLS_SYNC_CONFIRM_NEW=1 if you intentionally want to install them.",
    )
    process.exit(1)
  }

  const rl = createInterface({ input: stdin, output: stdout })
  const reply = (await rl.question("Install these new skills? [y/N] ")).trim()
  rl.close()
  if (["y", "Y", "yes", "YES"].includes(reply)) return

  console.log("Cancelled; no new skills installed.")
  process.exit(1)
}

console.log("Checking installed skills...")
const checkCode = await runInherited(["bun", script("check-installed.ts")])
if (checkCode === 0) {
  console.log("Skills are already in sync.")
  process.exit(0)
}

const newInstalls = await output(["bun", script("check-installed.ts"), "--new-installs"])
await confirmNewInstalls(newInstalls)

await $`bun ${script("install-local.ts")}`
await $`bun ${script("prune-internal.ts")}`
await $`bun ${script("check-installed.ts")}`
