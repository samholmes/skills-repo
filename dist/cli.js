#!/usr/bin/env bun
// @bun

// src/cli.ts
import { existsSync } from "fs";
import { join } from "path";
var [command, ...args] = process.argv.slice(2);
var commandEntries = {
  agents: "discover-agents",
  check: "check-installed",
  install: "install-local",
  list: "list-local",
  "prune-internal": "prune-internal",
  sync: "sync-local"
};
function commandScript(name) {
  const tsPath = join(import.meta.dir, `${name}.ts`);
  if (existsSync(tsPath))
    return tsPath;
  return join(import.meta.dir, `${name}.js`);
}
function usage(exitCode) {
  const output = exitCode === 0 ? console.log : console.error;
  output(`Usage: skills-repo <command> [options]

Commands:
  agents           Show discovered local agent harnesses
  check            Verify installed skills match this repo
  install          Install skills from this repo
  list             List installable skills in this repo
  prune-internal   Remove repo-local helper skills from global installs
  sync             Check, install, prune, and verify
`);
  process.exit(exitCode);
}
if (command === "--help" || command === "-h")
  usage(0);
if (!command)
  usage(1);
var commandEntry = commandEntries[command];
if (!commandEntry)
  usage(1);
var proc = Bun.spawn(["bun", commandScript(commandEntry), ...args], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit"
});
process.exit(await proc.exited);
