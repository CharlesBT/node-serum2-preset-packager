import fs from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { unpack, pack } from '../src/index.js'

const __root = process.cwd()
const TEMP_DIR = join(__root, 'test', '.tmp')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function cleanupDir(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

describe('decode', () => {
  const testDir = join(__root, 'test', 'decode')
  const inFile = join(testDir, 'temp1_sample-embed.SerumPreset')
  const outFile = join(TEMP_DIR, 'temp1_sample-embed.json')
  const refFile = join(__root, 'test', 'encode', 'temp1_sample-embed.json')

  beforeEach(() => {
    ensureDir(TEMP_DIR)
    // Optionally, copy a known SerumPreset file to inFile if needed
  })

  afterEach(() => {
    cleanupDir(TEMP_DIR)
  })

  it('should unpack SerumPreset file to JSON', async () => {
    // Skip test if sample file does not exist
    if (!fs.existsSync(inFile)) {
      console.warn('Sample SerumPreset file missing:', inFile)
      return
    }
    await unpack(inFile, outFile)
    expect(fs.existsSync(outFile)).toBe(true)
    expect(JSON.parse(fs.readFileSync(outFile, 'utf8'))).toEqual(
      JSON.parse(fs.readFileSync(refFile, 'utf8')),
    )
  })
})

describe('pack', () => {
  const testDir = join(__root, 'test', 'encode')
  const inFile = join(testDir, 'temp1_sample-embed.json')
  const outFile = join(TEMP_DIR, 'temp1_sample-embed.SerumPreset')
  const refFile = join(__root, 'test', 'decode', 'temp1_sample-embed.SerumPreset')

  beforeEach(() => {
    ensureDir(TEMP_DIR)
    // Optionally, copy a known JSON file to inFile if needed
  })

  afterEach(() => {
    cleanupDir(TEMP_DIR)
  })

  it('should pack JSON file to SerumPreset', async () => {
    // Skip test if sample file does not exist
    if (!fs.existsSync(inFile)) {
      console.warn('Sample JSON file missing:', inFile)
      return
    }
    await pack(inFile, outFile)
    expect(fs.existsSync(outFile)).toBe(true)
    expect(fs.readFileSync(outFile, 'utf8')).toEqual(fs.readFileSync(refFile, 'utf8'))
  })
})
