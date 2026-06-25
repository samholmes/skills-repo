import { createHash } from "node:crypto"
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs"
import { homedir } from "node:os"
import { join, relative } from "node:path"
import YAML from "yaml"

export type SkillTarget = "universal" | string

export type SkillInfo = {
  name: string
  directory: string
  internal: boolean
  sourceOnly: boolean
  targets: SkillTarget[]
  label: string
}

export type FileManifest = Map<string, string>

const ignoredNames = new Set([".DS_Store", "__pycache__"])
const ignoredSuffixes = [".pyc", ".swp", ".tmp"]

export function repoRoot(): string {
  return process.cwd()
}

function frontmatterFromMarkdown(path: string): Record<string, any> {
  const text = readFileSync(path, "utf8")
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}
  const parsed = YAML.parse(match[1])
  return parsed && typeof parsed === "object" ? parsed : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true"
}

function metadataFrom(frontmatter: Record<string, any>): Record<string, any> {
  const metadata = frontmatter.metadata
  return metadata && typeof metadata === "object" ? metadata : {}
}

function targetsFrom(frontmatter: Record<string, any>, sourceOnly: boolean): string[] {
  if (sourceOnly) return []

  const metadata = metadataFrom(frontmatter)
  const rawTargets = metadata.targets ?? metadata.target

  if (Array.isArray(rawTargets)) {
    return rawTargets.map(stringValue).filter((target): target is string => Boolean(target))
  }

  const target = stringValue(rawTargets)
  if (target) return [target]

  throw new Error("Installable skills must declare metadata.targets in SKILL.md frontmatter")
}

export function parseSkillInfo(skillMd: string, options: { sourceOnly: boolean; label: string }): SkillInfo {
  const frontmatter = frontmatterFromMarkdown(skillMd)
  const directory = skillMd.replace(/\/SKILL\.md$/, "")
  const directoryName = directory.split("/").at(-1) ?? directory
  const metadata = metadataFrom(frontmatter)
  const name = stringValue(frontmatter.name) ?? directoryName
  const internal = booleanValue(metadata.internal) || booleanValue(frontmatter["metadata.internal"])

  return {
    name,
    directory,
    internal,
    sourceOnly: options.sourceOnly,
    targets: targetsFrom(frontmatter, options.sourceOnly),
    label: options.label,
  }
}

function walkSkillFiles(container: string): string[] {
  if (!existsSync(container)) return []

  const found: string[] = []
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(path)
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        found.push(path)
      }
    }
  }

  walk(container)
  return found.sort()
}

export function iterSkills(root = repoRoot()): SkillInfo[] {
  const skills = walkSkillFiles(join(root, "skills")).map((skillMd) =>
    parseSkillInfo(skillMd, { sourceOnly: false, label: "skills" }),
  )

  const repoLocalSkills = walkSkillFiles(join(root, ".agents", "skills")).map((skillMd) =>
    parseSkillInfo(skillMd, { sourceOnly: true, label: "repo-local" }),
  )

  return [...skills, ...repoLocalSkills]
}

export function installableSkills(skills = iterSkills()): SkillInfo[] {
  return skills.filter((skill) => !skill.sourceOnly && !skill.internal)
}

export function sourceOnlySkills(skills = iterSkills()): SkillInfo[] {
  return skills.filter((skill) => skill.sourceOnly || skill.internal)
}

export function installedRootsForSkill(skill: SkillInfo): string[] {
  if (skill.targets.includes("universal")) return [join(homedir(), ".agents", "skills")]
  if (skill.targets.includes("claude-code")) return [join(homedir(), ".claude", "skills")]
  return skill.targets.map((target) => installedRootForAgent(target)).filter((root): root is string => Boolean(root))
}

export function installedRootForAgent(agent: string): string | undefined {
  if (agent === "universal") return join(homedir(), ".agents", "skills")
  if (agent === "claude-code") return join(homedir(), ".claude", "skills")
  return join(homedir(), ".agents", "skills")
}

function shouldIgnore(path: string): boolean {
  const name = path.split("/").at(-1) ?? path
  return ignoredNames.has(name) || ignoredSuffixes.some((suffix) => name.endsWith(suffix))
}

function walkFiles(directory: string): string[] {
  const found: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      const relpath = relative(directory, path).split("/").join("/")
      if (relpath.split("/").some(shouldIgnore)) continue
      if (entry.isDirectory()) {
        walk(path)
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        found.push(path)
      }
    }
  }
  walk(directory)
  return found.sort()
}

export function directoryManifest(directory: string): FileManifest {
  const manifest: FileManifest = new Map()
  for (const path of walkFiles(directory)) {
    const relpath = relative(directory, path).split("/").join("/")
    const stat = lstatSync(path)
    const bytes = stat.isSymbolicLink()
      ? Buffer.from(`symlink:${readlinkSync(path)}`)
      : readFileSync(path)
    const digest = createHash("sha256").update(bytes).digest("hex")
    manifest.set(relpath, digest)
  }
  return manifest
}

export function compareSkill(sourceDir: string, installedDir: string): string[] {
  if (!existsSync(installedDir)) return [`missing install: ${installedDir}`]
  if (!lstatSync(installedDir).isDirectory()) return [`installed path is not a directory: ${installedDir}`]

  const source = directoryManifest(sourceDir)
  const installed = directoryManifest(installedDir)
  const sourceFiles = new Set(source.keys())
  const installedFiles = new Set(installed.keys())
  const problems: string[] = []

  for (const relpath of [...sourceFiles].filter((path) => !installedFiles.has(path)).sort()) {
    problems.push(`missing installed file: ${join(installedDir, relpath)}`)
  }
  for (const relpath of [...installedFiles].filter((path) => !sourceFiles.has(path)).sort()) {
    problems.push(`extra installed file: ${join(installedDir, relpath)}`)
  }
  for (const relpath of [...sourceFiles].filter((path) => installedFiles.has(path)).sort()) {
    if (source.get(relpath) !== installed.get(relpath)) problems.push(`out of date: ${join(installedDir, relpath)}`)
  }

  return problems
}
