#!/usr/bin/env node
// Builds every client's plugin under providers/ from the two sources of truth:
// plugin.config.json (name, version, description, links, MCP URL) and skills/.
// Also writes the root MCP config and the marketplace pointers.
//
//   node ci/generate-providers.mjs           write the files
//   node ci/generate-providers.mjs --check   write nothing; exit 1 if any file differs
//
// No dependencies: Node 22 or later.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')

const config = JSON.parse(readFileSync(join(ROOT, 'plugin.config.json'), 'utf8'))
const { name, displayName, version, description, shortDescription, author, homepage, repository, license, keywords, category, links, mcp, examplePrompts } = config

const AGENT_PLUGINS_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const AGENT_PLUGINS_MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

/** Every provider plugin directory that gets a copy of skills/. */
export const PROVIDER_DIRS = ['providers/claude/plugin', 'providers/agent-plugins/plugin']

const json = value => JSON.stringify(value, null, 2) + '\n'

/** path (relative to the repo root, with /) -> file content */
function buildFiles() {
  const files = new Map()

  // Claude Code and claude.ai (Desktop, Cowork): .mcp.json uses Claude's own format.
  const claudeMcp = json({ mcpServers: { [mcp.serverName]: { type: 'http', url: mcp.url } } })
  files.set('.mcp.json', claudeMcp)
  files.set('providers/claude/plugin/.mcp.json', claudeMcp)
  files.set(
    'providers/claude/plugin/.claude-plugin/plugin.json',
    json({
      name,
      displayName,
      version,
      description,
      author,
      homepage,
      repository,
      license,
      keywords,
      icon: './.claude-plugin/icon.png',
      ...links,
    }),
  )
  // The listing icon: a square PNG, 512 to 2048 px. Rendered from assets/icon.svg (the "Re:" mark of the logo).
  const icon = readFileSync(join(ROOT, 'assets/icon.png'))
  files.set('providers/claude/plugin/.claude-plugin/icon.png', icon)
  files.set('providers/agent-plugins/plugin/assets/icon.png', icon)
  files.set(
    '.claude-plugin/marketplace.json',
    json({
      name,
      owner: { name: author.name, url: author.url },
      description: `${displayName} plugins for Claude`,
      plugins: [{ name, source: './providers/claude/plugin', description, version, author }],
    }),
  )

  // Agent Plugins 1.0: plugin.json and mcp.json at the plugin root, with only the spec's fields.
  files.set(
    'providers/agent-plugins/plugin/plugin.json',
    json({ $schema: AGENT_PLUGINS_SCHEMA, name, version, description, author, homepage, repository, license, keywords }),
  )
  files.set(
    'providers/agent-plugins/plugin/mcp.json',
    json({ $schema: AGENT_PLUGINS_MCP_SCHEMA, mcpServers: { [mcp.serverName]: { type: 'streamable-http', url: mcp.url } } }),
  )
  // Codex reads its own manifest in .codex-plugin/ (the format Mollie's Codex plugin uses), pointing at the same
  // skills/ and mcp.json. Agent Plugins clients ignore this folder.
  files.set(
    'providers/agent-plugins/plugin/.codex-plugin/plugin.json',
    json({
      name,
      version,
      description,
      author,
      homepage,
      repository,
      license,
      keywords,
      skills: './skills/',
      mcpServers: './mcp.json',
      interface: {
        displayName,
        shortDescription,
        longDescription: description,
        developerName: author.name,
        category,
        capabilities: ['Answer questions about returns', 'Return reasons and sizing', 'Store return policies'],
        defaultPrompt: examplePrompts,
        brandColor: '#8446E9',
        logo: './assets/icon.png',
        composerIcon: './assets/icon.png',
        websiteURL: author.url,
        supportURL: links.supportUrl,
        privacyPolicyURL: links.privacyPolicyUrl,
        termsOfServiceURL: links.termsOfServiceUrl,
      },
    }),
  )
  files.set(
    '.agents/plugins/marketplace.json',
    json({
      name,
      interface: { displayName },
      plugins: [
        {
          name,
          source: { source: 'git-subdir', url: `${repository}.git`, path: 'providers/agent-plugins/plugin', ref: 'main' },
          policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
          category,
        },
      ],
    }),
  )

  // Each provider gets an exact copy of skills/ and a short README pointing back here.
  for (const dir of PROVIDER_DIRS) {
    for (const file of listFiles(join(ROOT, 'skills'))) {
      const rel = toPosix(relative(join(ROOT, 'skills'), file))
      files.set(`${dir}/skills/${rel}`, readFileSync(file, 'utf8'))
    }
    files.set(
      `${dir}/README.md`,
      `# ${displayName} plugin\n\n${description}\n\n` +
        `Install in Claude Code:\n\n\`\`\`\n/plugin install ${name} --marketplace ${repository.replace('https://github.com/', '')}\n\`\`\`\n\n` +
        `Then sign in to Returnista when asked (\`/mcp\`, choose ${mcp.serverName}, Authenticate).\n\n` +
        `Generated from the repository root by \`node ci/generate-providers.mjs\`: don't edit the files here. ` +
        `Skills live in [skills/](../../../skills/), the plugin's name, version and links in ` +
        `[plugin.config.json](../../../plugin.config.json). Install and privacy: see the [README](../../../README.md).\n`,
    )
  }
  return files
}

export function listFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap(entry => {
    if (entry === '.DS_Store') return []
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

const toPosix = path => path.split(sep).join('/')
export const hash = content => createHash('sha256').update(content).digest('hex')

function main() {
  const files = buildFiles()
  const problems = []

  for (const [path, content] of files) {
    const abs = join(ROOT, path)
    const current = existsSync(abs) ? readFileSync(abs) : null
    if (current !== null && current.equals(Buffer.isBuffer(content) ? content : Buffer.from(content))) continue
    if (CHECK) problems.push(current === null ? `missing: ${path}` : `differs: ${path}`)
    else {
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, content)
    }
  }

  // Files in a provider's skills/ that no longer exist in skills/.
  for (const dir of PROVIDER_DIRS) {
    for (const file of listFiles(join(ROOT, dir, 'skills'))) {
      const path = toPosix(relative(ROOT, file))
      if (files.has(path)) continue
      if (CHECK) problems.push(`stale: ${path}`)
      else rmSync(file)
    }
  }

  if (CHECK) {
    if (problems.length > 0) {
      console.error(`providers/ is out of date with skills/ or plugin.config.json:\n  ${problems.join('\n  ')}`)
      console.error('Run `node ci/generate-providers.mjs` and commit the result.')
      process.exit(1)
    }
    console.log(`generate-providers: ${files.size} files up to date`)
  } else {
    console.log(`generate-providers: wrote ${files.size} files for ${name} ${version}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
