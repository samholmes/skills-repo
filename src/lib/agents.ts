import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export type Agent = {
  slug: string
  name: string
  markers: string[]
  globalInstall: boolean
}

export type DiscoveredAgent = Agent & {
  matched: string[]
}

// Based on the supported agent registry documented by `bunx skills`.
//
// Markers are config/application roots, not just skill directories, where
// possible. That prevents an accidental broad `--all` skills install from being
// the only evidence that an agent is present.
export const agents: Agent[] = [
  { slug: "universal", name: "Universal ~/.agents", markers: ["~/.agents"], globalInstall: true },
  { slug: "aider-desk", name: "AiderDesk", markers: ["~/.aider-desk"], globalInstall: true },
  { slug: "amp", name: "Amp", markers: ["~/.config/agents", "~/.amp"], globalInstall: true },
  { slug: "replit", name: "Replit", markers: ["~/.replit"], globalInstall: true },
  { slug: "antigravity", name: "Antigravity", markers: ["~/.gemini/antigravity"], globalInstall: true },
  { slug: "antigravity-cli", name: "Antigravity CLI", markers: ["~/.gemini/antigravity-cli"], globalInstall: true },
  { slug: "astrbot", name: "AstrBot", markers: ["~/.astrbot"], globalInstall: true },
  { slug: "autohand-code", name: "Autohand Code CLI", markers: ["~/.autohand"], globalInstall: true },
  { slug: "augment", name: "Augment", markers: ["~/.augment"], globalInstall: true },
  { slug: "bob", name: "IBM Bob", markers: ["~/.bob"], globalInstall: true },
  { slug: "claude-code", name: "Claude Code", markers: ["~/.claude"], globalInstall: true },
  { slug: "openclaw", name: "OpenClaw", markers: ["~/.openclaw"], globalInstall: true },
  { slug: "cline", name: "Cline", markers: ["~/.cline", "~/.config/cline"], globalInstall: true },
  { slug: "dexto", name: "Dexto", markers: ["~/.dexto", "~/.config/dexto"], globalInstall: true },
  { slug: "kimi-code-cli", name: "Kimi Code CLI", markers: ["~/.kimi", "~/.config/kimi"], globalInstall: true },
  { slug: "loaf", name: "Loaf", markers: ["~/.loaf", "~/.config/loaf"], globalInstall: true },
  { slug: "warp", name: "Warp", markers: ["~/.warp"], globalInstall: true },
  { slug: "zed", name: "Zed", markers: ["~/.zed", "~/.config/zed"], globalInstall: true },
  { slug: "codearts-agent", name: "CodeArts Agent", markers: ["~/.codeartsdoer"], globalInstall: true },
  { slug: "codebuddy", name: "CodeBuddy", markers: ["~/.codebuddy"], globalInstall: true },
  { slug: "codemaker", name: "Codemaker", markers: ["~/.codemaker"], globalInstall: true },
  { slug: "codestudio", name: "Code Studio", markers: ["~/.codestudio"], globalInstall: true },
  { slug: "codex", name: "Codex", markers: ["~/.codex"], globalInstall: true },
  { slug: "command-code", name: "Command Code", markers: ["~/.commandcode"], globalInstall: true },
  { slug: "continue", name: "Continue", markers: ["~/.continue"], globalInstall: true },
  { slug: "cortex", name: "Cortex Code", markers: ["~/.snowflake/cortex"], globalInstall: true },
  { slug: "crush", name: "Crush", markers: ["~/.config/crush"], globalInstall: true },
  { slug: "cursor", name: "Cursor", markers: ["~/.cursor"], globalInstall: true },
  { slug: "deepagents", name: "Deep Agents", markers: ["~/.deepagents"], globalInstall: true },
  { slug: "devin", name: "Devin for Terminal", markers: ["~/.config/devin"], globalInstall: true },
  { slug: "droid", name: "Droid", markers: ["~/.factory"], globalInstall: true },
  { slug: "eve", name: "Eve", markers: [], globalInstall: false },
  { slug: "firebender", name: "Firebender", markers: ["~/.firebender"], globalInstall: true },
  { slug: "forgecode", name: "ForgeCode", markers: ["~/.forge"], globalInstall: true },
  { slug: "gemini-cli", name: "Gemini CLI", markers: ["~/.gemini/settings.json", "~/.gemini"], globalInstall: true },
  { slug: "github-copilot", name: "GitHub Copilot", markers: ["~/.copilot"], globalInstall: true },
  { slug: "goose", name: "Goose", markers: ["~/.config/goose"], globalInstall: true },
  { slug: "hermes-agent", name: "Hermes Agent", markers: ["~/.hermes"], globalInstall: true },
  { slug: "inference-sh", name: "inference.sh", markers: ["~/.inferencesh"], globalInstall: true },
  { slug: "jazz", name: "Jazz", markers: ["~/.jazz"], globalInstall: true },
  { slug: "junie", name: "Junie", markers: ["~/.junie"], globalInstall: true },
  { slug: "iflow-cli", name: "iFlow CLI", markers: ["~/.iflow"], globalInstall: true },
  { slug: "kilo", name: "Kilo Code", markers: ["~/.kilocode"], globalInstall: true },
  { slug: "kiro-cli", name: "Kiro CLI", markers: ["~/.kiro"], globalInstall: true },
  { slug: "kode", name: "Kode", markers: ["~/.kode"], globalInstall: true },
  { slug: "lingma", name: "Lingma", markers: ["~/.lingma"], globalInstall: true },
  { slug: "mcpjam", name: "MCPJam", markers: ["~/.mcpjam"], globalInstall: true },
  { slug: "mistral-vibe", name: "Mistral Vibe", markers: ["~/.vibe"], globalInstall: true },
  { slug: "moxby", name: "Moxby", markers: ["~/.moxby"], globalInstall: true },
  { slug: "mux", name: "Mux", markers: ["~/.mux"], globalInstall: true },
  { slug: "opencode", name: "OpenCode", markers: ["~/.config/opencode"], globalInstall: true },
  { slug: "openhands", name: "OpenHands", markers: ["~/.openhands"], globalInstall: true },
  { slug: "ona", name: "Ona", markers: ["~/.ona"], globalInstall: true },
  { slug: "pi", name: "Pi", markers: ["~/.pi/agent", "~/.pi"], globalInstall: true },
  { slug: "qoder", name: "Qoder", markers: ["~/.qoder"], globalInstall: true },
  { slug: "qoder-cn", name: "Qoder CN", markers: ["~/.qoder-cn"], globalInstall: true },
  { slug: "qwen-code", name: "Qwen Code", markers: ["~/.qwen"], globalInstall: true },
  { slug: "reasonix", name: "Reasonix", markers: ["~/.reasonix"], globalInstall: true },
  { slug: "rovodev", name: "Rovo Dev", markers: ["~/.rovodev"], globalInstall: true },
  { slug: "roo", name: "Roo Code", markers: ["~/.roo"], globalInstall: true },
  { slug: "tabnine-cli", name: "Tabnine CLI", markers: ["~/.tabnine/agent", "~/.tabnine"], globalInstall: true },
  { slug: "terramind", name: "Terramind", markers: ["~/.terramind"], globalInstall: true },
  { slug: "tinycloud", name: "Tinycloud", markers: ["~/.tinycloud"], globalInstall: true },
  { slug: "trae", name: "Trae", markers: ["~/.trae"], globalInstall: true },
  { slug: "trae-cn", name: "Trae CN", markers: ["~/.trae-cn"], globalInstall: true },
  { slug: "windsurf", name: "Windsurf", markers: ["~/.codeium/windsurf"], globalInstall: true },
  { slug: "zencoder", name: "Zencoder", markers: ["~/.zencoder"], globalInstall: true },
  { slug: "zenflow", name: "Zenflow", markers: ["~/.zenflow"], globalInstall: true },
  { slug: "neovate", name: "Neovate", markers: ["~/.neovate"], globalInstall: true },
  { slug: "pochi", name: "Pochi", markers: ["~/.pochi"], globalInstall: true },
  { slug: "promptscript", name: "PromptScript", markers: [], globalInstall: false },
  { slug: "adal", name: "AdaL", markers: ["~/.adal"], globalInstall: true },
]

export function expandHome(path: string): string {
  if (path === "~") return homedir()
  if (path.startsWith("~/")) return join(homedir(), path.slice(2))
  return path
}

export function discoverAgents(options: { includeProjectOnly?: boolean } = {}): DiscoveredAgent[] {
  const includeProjectOnly = options.includeProjectOnly ?? false
  const found: DiscoveredAgent[] = []

  for (const agent of agents) {
    if (!agent.globalInstall && !includeProjectOnly) continue

    const matched = agent.markers.filter((marker) => existsSync(expandHome(marker)))
    if (matched.length > 0) found.push({ ...agent, matched })
  }

  return found
}
