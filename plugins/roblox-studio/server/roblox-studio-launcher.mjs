// TODO Wave 3 — remove this launcher shim once desktop ships platform-overrides support.
// Roblox Studio MCP launcher shim for the Artyx "roblox-studio" plugin.
//
// Roblox Studio ships a first-party MCP server, but its launch command differs
// per OS and the Windows form needs %LOCALAPPDATA% expansion, which Artyx
// .mcp.json files intentionally do not support. This shim (plain Node, zero
// dependencies, run via ${ARTYX_ELECTRON} with ELECTRON_RUN_AS_NODE=1) resolves
// the right command for the current platform and hands its stdio straight to it.
//
// CRITICAL INVARIANT: this process must never write to its own stdout. Stdout
// is the MCP protocol channel. All diagnostics go to stderr. The child is
// spawned with stdio "inherit" so the protocol bytes never pass through JS.

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const TAG = '[roblox-studio-launcher]'
const ENABLE_HINT =
  'In Roblox Studio: open the Assistant panel, click its … (More) menu, ' +
  'choose "Manage MCP Servers", and toggle on "Enable Studio as MCP server". ' +
  'Docs: https://create.roblox.com/docs/en-us/studio/mcp'

function fail(message) {
  process.stderr.write(`${TAG} ${message}\n`)
  process.exit(1)
}

function resolveLaunch() {
  if (process.platform === 'darwin') {
    const bin = '/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP'
    if (!existsSync(bin)) {
      fail(
        `Roblox Studio MCP binary not found at ${bin}. ` +
          'Install or update Roblox Studio from https://create.roblox.com/ and try again. ' +
          ENABLE_HINT
      )
    }
    return { command: bin, args: [], verbatim: false }
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA
    if (!localAppData) {
      fail('LOCALAPPDATA is not set; cannot locate the Roblox Studio MCP launcher (mcp.bat).')
    }
    const bat = path.join(localAppData, 'Roblox', 'mcp.bat')
    if (!existsSync(bat)) {
      fail(
        `Roblox Studio MCP launcher not found at ${bat}. ` +
          'Install or update Roblox Studio from https://create.roblox.com/ and try again. ' +
          ENABLE_HINT
      )
    }
    // .bat files must be run through cmd.exe (Node refuses to spawn them
    // directly). /d skips AutoRun scripts; /s + explicit quotes keeps the
    // path intact even when the user profile directory contains spaces.
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', `"${bat}"`],
      verbatim: true
    }
  }

  fail(`Roblox Studio does not support platform "${process.platform}" (supported: macOS, Windows).`)
}

const { command, args, verbatim } = resolveLaunch()

const child = spawn(command, args, {
  stdio: 'inherit',
  windowsVerbatimArguments: verbatim
})

child.on('error', (err) => {
  fail(`Failed to start the Roblox Studio MCP server (${command}): ${err.message}`)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.stderr.write(`${TAG} Roblox Studio MCP server terminated by signal ${signal}.\n`)
    process.exit(1)
  }
  if (code !== 0) {
    process.stderr.write(
      `${TAG} Roblox Studio MCP server exited with code ${code}. ` +
        `If this happened immediately, make sure Roblox Studio is running and its MCP server is enabled. ${ENABLE_HINT}\n`
    )
  }
  process.exit(code ?? 0)
})

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  try {
    process.on(sig, () => {
      if (!child.killed) child.kill(sig)
    })
  } catch {
    // Signal not supported on this platform; the child still exits with us.
  }
}
