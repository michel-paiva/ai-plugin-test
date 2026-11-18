#!/usr/bin/env node
// Structural checks that need no model and no network. Exits 1 on any failure.
//
// - every skill: SKILL.md with name and description frontmatter, name = folder name, at most 500 lines,
//   every file in references/ mentioned in SKILL.md, every relative link pointing at a real file
// - every provider's skills/ identical to skills/ (hash compare)
// - one version and one MCP URL across all manifests, taken from plugin.config.json
// - the Agent Plugins manifest and MCP config hold only the fields the 1.0 spec allows
// - no top-level bin/ in a plugin (claude.ai and Cowork refuse to install one)
// - nothing that looks like a secret anywhere in the repository
// - every eval case has a prompt.md and at least one grader

import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROVIDER_DIRS, hash, listFiles } from './generate-providers.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(join(ROOT, 'plugin.config.json'), 'utf8'))
const errors = []
const fail = message => errors.push(message)
const rel = path => relative(ROOT, path).split(sep).join('/')
const readJson = path => {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
  } catch (error) {
    fail(`${path}: not valid JSON (${error.message})`)
    return {}
  }
}

// ---- Skills ----------------------------------------------------------------------------------

const SKILLS_DIR = join(ROOT, 'skills')
const skillNames = existsSync(SKILLS_DIR) ? listDirs(SKILLS_DIR) : []
if (skillNames.length === 0) fail('skills/: no skills found')

for (const skill of skillNames) {
  const dir = join(SKILLS_DIR, skill)
  const skillFile = join(dir, 'SKILL.md')
  if (!existsSync(skillFile)) {
    fail(`skills/${skill}: no SKILL.md`)
    continue
  }
  const text = readFileSync(skillFile, 'utf8')
  const front = frontmatter(text)
  if (!front) fail(`skills/${skill}/SKILL.md: no frontmatter`)
  else {
    if (!front.name) fail(`skills/${skill}/SKILL.md: frontmatter has no name`)
    else if (front.name !== skill) fail(`skills/${skill}/SKILL.md: name "${front.name}" is not the folder name`)
    if (front.name && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(front.name)) fail(`skills/${skill}: name must be kebab-case`)
    if (front.name && front.name.length > 64) fail(`skills/${skill}: name is over 64 characters`)
    if (!front.description) fail(`skills/${skill}/SKILL.md: frontmatter has no description`)
    else if (front.description.length > 1024) fail(`skills/${skill}: description is over 1024 characters`)
    if (/\b(claude|anthropic)\b/i.test(front.name ?? '')) fail(`skills/${skill}: name must not contain claude or anthropic`)
    // In a plain YAML value, " #" starts a comment and ": " breaks the mapping: the description gets cut.
    const rawDescription = text.match(/^description: (.*)$/m)?.[1] ?? ''
    if (!/^[>|]/.test(rawDescription) && !/^["']/.test(rawDescription) && /\s#|:\s/.test(rawDescription)) {
      fail(`skills/${skill}/SKILL.md: description holds " #" or ": ": write it as a folded block (description: >-)`)
    }
  }
  const lines = text.split('\n').length
  if (lines > 500) fail(`skills/${skill}/SKILL.md: ${lines} lines, at most 500`)

  // Every reference file is mentioned, so the model knows to load it.
  for (const ref of listFiles(join(dir, 'references'))) {
    const path = rel(ref).replace(`skills/${skill}/`, '')
    if (!text.includes(path)) fail(`skills/${skill}/SKILL.md: never mentions ${path}`)
  }
  // Every relative markdown link in the skill's files resolves.
  for (const file of listFiles(dir).filter(f => f.endsWith('.md'))) {
    for (const [, target] of readFileSync(file, 'utf8').matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      if (/^[a-z]+:/i.test(target)) continue
      if (!existsSync(join(dirname(file), target))) fail(`${rel(file)}: link to ${target} points nowhere`)
    }
  }
}

// ---- Providers mirror skills/ ----------------------------------------------------------------

const sourceHashes = new Map(listFiles(SKILLS_DIR).map(f => [rel(f).replace(/^skills\//, ''), hash(readFileSync(f))]))
for (const provider of PROVIDER_DIRS) {
  const copyDir = join(ROOT, provider, 'skills')
  const copyHashes = new Map(listFiles(copyDir).map(f => [rel(f).replace(`${provider}/skills/`, ''), hash(readFileSync(f))]))
  for (const [path, digest] of sourceHashes) {
    if (!copyHashes.has(path)) fail(`${provider}/skills/${path}: missing (run node ci/generate-providers.mjs)`)
    else if (copyHashes.get(path) !== digest) fail(`${provider}/skills/${path}: differs from skills/${path}`)
  }
  for (const path of copyHashes.keys()) if (!sourceHashes.has(path)) fail(`${provider}/skills/${path}: not in skills/`)
  if (existsSync(join(ROOT, provider, 'bin'))) fail(`${provider}/bin: a plugin must not have a top-level bin/`)
}

// ---- One version, one MCP URL ----------------------------------------------------------------

const versions = {
  'plugin.config.json': config.version,
  'providers/claude/plugin/.claude-plugin/plugin.json': readJson('providers/claude/plugin/.claude-plugin/plugin.json').version,
  '.claude-plugin/marketplace.json': readJson('.claude-plugin/marketplace.json').plugins?.[0]?.version,
  'providers/agent-plugins/plugin/plugin.json': readJson('providers/agent-plugins/plugin/plugin.json').version,
  'providers/agent-plugins/plugin/.codex-plugin/plugin.json': readJson('providers/agent-plugins/plugin/.codex-plugin/plugin.json').version,
}
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(config.version ?? '')) fail(`plugin.config.json: version "${config.version}" is not semver`)
for (const [path, version] of Object.entries(versions)) {
  if (version !== config.version) fail(`${path}: version ${version} differs from plugin.config.json ${config.version}`)
}

const mcpConfigs = ['.mcp.json', 'providers/claude/plugin/.mcp.json', 'providers/agent-plugins/plugin/mcp.json']
for (const path of mcpConfigs) {
  const servers = readJson(path).mcpServers ?? {}
  const names = Object.keys(servers)
  if (names.length !== 1 || names[0] !== config.mcp.serverName) fail(`${path}: must declare exactly the "${config.mcp.serverName}" server`)
  for (const server of Object.values(servers)) {
    if (server.url !== config.mcp.url) fail(`${path}: URL ${server.url} differs from ${config.mcp.url}`)
    if (!server.url?.startsWith('https://')) fail(`${path}: the MCP URL must be https`)
    if (server.headers || server.env) fail(`${path}: no headers or env: the server signs in with OAuth`)
  }
}

// ---- Agent Plugins 1.0 fields ----------------------------------------------------------------

const AGENT_PLUGIN_FIELDS = ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions']
const agentPlugin = readJson('providers/agent-plugins/plugin/plugin.json')
for (const key of Object.keys(agentPlugin)) {
  if (!AGENT_PLUGIN_FIELDS.includes(key)) fail(`providers/agent-plugins/plugin/plugin.json: "${key}" is not an Agent Plugins 1.0 field`)
}
if (!/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(agentPlugin.name ?? '')) fail('providers/agent-plugins/plugin/plugin.json: invalid name')
const agentMcp = readJson('providers/agent-plugins/plugin/mcp.json')
for (const key of Object.keys(agentMcp)) {
  if (!['$schema', 'mcpServers'].includes(key)) fail(`providers/agent-plugins/plugin/mcp.json: "${key}" is not allowed`)
}
for (const server of Object.values(agentMcp.mcpServers ?? {})) {
  if (server.type !== 'streamable-http') fail('providers/agent-plugins/plugin/mcp.json: a remote server is type streamable-http')
}

// ---- Secrets ---------------------------------------------------------------------------------

// Built from parts so this file does not match itself.
const SECRET_PATTERNS = [
  ['a bearer token', new RegExp('Bear' + 'er\\s+[A-Za-z0-9._~+/-]{12,}')],
  ['a Stripe- or Mollie-style key', new RegExp('\\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}')],
  ['an API key', new RegExp('\\bs' + 'k-[A-Za-z0-9_-]{20,}')],
  ['a token in a URL or setting', new RegExp('(access_|api_|auth_)?tok' + 'en=[A-Za-z0-9._~+/-]{8,}', 'i')],
  ['a JWT', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['a private key', new RegExp('-----BEGIN [A-Z ]*PRIV' + 'ATE KEY-----')],
]
for (const file of listFiles(ROOT)) {
  const path = rel(file)
  if (path.startsWith('.git/') || path.startsWith('node_modules/') || path.startsWith('evals/results/')) continue
  if (statSync(file).size > 2_000_000) continue
  const text = readFileSync(file, 'utf8')
  for (const [label, pattern] of SECRET_PATTERNS) if (pattern.test(text)) fail(`${path}: looks like it holds ${label}`)
}

// ---- Evals -----------------------------------------------------------------------------------

const EVALS_DIR = join(ROOT, 'evals')
for (const name of existsSync(EVALS_DIR) ? listDirs(EVALS_DIR) : []) {
  if (name === 'mocks' || name === 'results') continue
  const dir = join(EVALS_DIR, name)
  if (!existsSync(join(dir, 'prompt.md')) && !existsSync(join(dir, 'case.yaml'))) fail(`evals/${name}: no prompt.md or case.yaml`)
  const graders = listFiles(join(dir, 'graders')).filter(f => f.endsWith('.md'))
  if (graders.length === 0) fail(`evals/${name}: no graders`)
  for (const grader of graders) {
    const front = frontmatter(readFileSync(grader, 'utf8')) ?? {}
    if (!['regex', 'tool_order', 'tool_used', 'file_exists', 'llm', 'baseline'].includes(front.type)) fail(`${rel(grader)}: unknown grader type "${front.type}"`)
    // Graders run JavaScript regular expressions: no inline flags such as (?i).
    for (const key of ['input_match', 'pattern']) {
      if (front[key] === undefined) continue
      try {
        new RegExp(front[key])
      } catch (error) {
        fail(`${rel(grader)}: ${key} is not a valid JavaScript regular expression (${error.message})`)
      }
    }
  }
}

// ---- Result ----------------------------------------------------------------------------------

if (errors.length > 0) {
  console.error(`validate-structure: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log(`validate-structure: ${skillNames.length} skills, ${PROVIDER_DIRS.length} providers, version ${config.version}: OK`)

function listDirs(dir) {
  return listFiles(dir).length === 0 ? [] : [...new Set(listFiles(dir).map(f => relative(dir, f).split(sep)[0]))].filter(d => statSync(join(dir, d)).isDirectory())
}

/** The simple key: value pairs of a markdown file's frontmatter, folded `>` values included. */
function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const result = {}
  let key = null
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (pair) {
      key = pair[1]
      result[key] = pair[2] === '>' || pair[2] === '|' ? '' : pair[2].replace(/^['"]|['"]$/g, '')
    } else if (key && /^\s+\S/.test(line)) {
      result[key] = `${result[key]} ${line.trim()}`.trim()
    }
  }
  return result
}
