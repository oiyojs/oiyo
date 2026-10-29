import type { OiyoConfig } from '@oiyo/config'
import type { Logger } from '@oiyo/core'

import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import process from 'node:process'

import { execa } from 'execa'
import { join, posix, win32 } from 'pathe'

export async function openWechatIDE(
  config: OiyoConfig,
  logger: Logger,
): Promise<void> {
  logger.info('正在调起微信开发者工具')

  const cliPath = await findWechatCliPath(config.ide?.path?.weixin)

  if (!cliPath) {
    logger.warn('未找到微信开发者工具路径，请在 oiyo.config.ts 中配置 ide.path.weixin')
    return
  }

  const projectPath = join(config.rootDir || process.cwd(), 'dist', 'dev', 'mp-weixin')
  await ensureWechatProjectConfig(projectPath)

  const result = await execa(cliPath, ['open', '--project', projectPath], {
    reject: false,
    windowsHide: true,
  })

  logger.info('微信开发者工具已准备就绪')

  if (result.exitCode !== 0) {
    logger.warn('微信开发者工具打开失败，请检查开发者工具服务端口是否已开启')
  }
}

export async function findWechatCliPath(customCliPath?: string): Promise<string | null> {
  if (customCliPath) {
    return await pathExists(customCliPath) ? customCliPath : null
  }

  const registryCliPath = findWechatCliPathFromRegistry()
  if (registryCliPath && await pathExists(registryCliPath)) {
    return registryCliPath
  }

  const appCompatCliPath = findWechatCliPathFromAppCompat()
  if (appCompatCliPath && await pathExists(appCompatCliPath)) {
    return appCompatCliPath
  }

  const candidates = getWechatCliCandidates(process.platform, process.env, os.homedir())
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return null
}

export function getWechatCliCandidates(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  homeDir: string,
): string[] {
  if (platform === 'win32') {
    return [
      win32.join(env['ProgramFiles(x86)'] || '', 'Tencent', '微信web开发者工具', 'cli.bat'),
      win32.join(env.ProgramFiles || '', 'Tencent', '微信web开发者工具', 'cli.bat'),
      win32.join(env.ProgramW6432 || '', 'Tencent', '微信web开发者工具', 'cli.bat'),
      win32.join(env.LOCALAPPDATA || '', 'Tencent', '微信web开发者工具', 'cli.bat'),
    ].filter(Boolean)
  }

  if (platform === 'darwin') {
    return [
      posix.join('/Applications', 'wechatwebdevtools.app', 'Contents', 'MacOS', 'cli'),
      posix.join('/Applications', '微信开发者工具.app', 'Contents', 'MacOS', 'cli'),
      posix.join(homeDir, 'Applications', 'wechatwebdevtools.app', 'Contents', 'MacOS', 'cli'),
      posix.join(homeDir, 'Applications', '微信开发者工具.app', 'Contents', 'MacOS', 'cli'),
    ]
  }

  return []
}

export async function ensureWechatProjectConfig(projectPath: string): Promise<void> {
  const configPath = join(projectPath, 'project.config.json')
  if (await pathExists(configPath)) {
    return
  }

  await mkdir(projectPath, { recursive: true })
  await writeFile(
    configPath,
    `${JSON.stringify({
      appid: 'touristappid',
      projectname: 'oiyo',
    }, null, 2)}\n`,
    'utf8',
  )
}

function findWechatCliPathFromRegistry(): string | null {
  if (process.platform !== 'win32') {
    return null
  }

  const script = [
    '$paths = @(\'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*\', \'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*\')',
    '$target = \'*微信开发者工具*\'',
    'foreach ($path in $paths) {',
    '  Get-ItemProperty $path -ErrorAction SilentlyContinue |',
    '    Where-Object { $_.DisplayName -like $target } |',
    '    ForEach-Object {',
    '      if ($_.InstallLocation) {',
    '        $value = Join-Path $_.InstallLocation \'cli.bat\'',
    '        $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)',
    '        Write-Output ([Convert]::ToBase64String($bytes))',
    '        exit',
    '      }',
    '      if ($_.DisplayIcon) {',
    '        $value = Join-Path (Split-Path $_.DisplayIcon -Parent) \'cli.bat\'',
    '        $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)',
    '        Write-Output ([Convert]::ToBase64String($bytes))',
    '        exit',
    '      }',
    '    }',
    '}',
  ].join('; ')

  try {
    const cliPath = execPowerShellPathScript(script)

    if (!cliPath) {
      return null
    }

    return cliPath
  }
  catch {
    return null
  }
}

function findWechatCliPathFromAppCompat(): string | null {
  if (process.platform !== 'win32') {
    return null
  }

  const script = [
    '$path = \'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Compatibility Assistant\\Store\'',
    '$items = Get-ItemProperty $path -ErrorAction SilentlyContinue',
    'if ($items) {',
    '  $match = $items.PSObject.Properties | Where-Object { $_.Name -like \'*微信开发者工具.exe\' } | Select-Object -First 1',
    '  if ($match) {',
    '    $value = Join-Path (Split-Path $match.Name -Parent) \'cli.bat\'',
    '    $bytes = [System.Text.Encoding]::UTF8.GetBytes($value)',
    '    Write-Output ([Convert]::ToBase64String($bytes))',
    '  }',
    '}',
  ].join('; ')

  try {
    return execPowerShellPathScript(script)
  }
  catch {
    return null
  }
}

function execPowerShellPathScript(script: string): string | null {
  try {
    const encodedCommand = Buffer.from(script, 'utf16le').toString('base64')
    const output = execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedCommand], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).toString('utf8').trim()

    if (!output) {
      return null
    }

    return Buffer.from(output, 'base64').toString('utf8').trim() || null
  }
  catch {
    return null
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  if (!filePath) {
    return false
  }

  try {
    await access(filePath, constants.F_OK)
    return true
  }
  catch {
    return false
  }
}
