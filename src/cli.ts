/**
 * Encode / decode Xfer Serum 2 “.SerumPreset” files.
 * TypeScript reference implementation.
 *
 * Usage:
 *   node cli.ts unpack <file.SerumPreset> <out.json>
 *   node cli.ts pack   <in.json>         <out.SerumPreset>
 */

/* ---------- CLI ---------------------------------------------------------- */

import { basename } from 'node:path'
import { unpack, pack } from './index.js'

async function usage(exitCode = 0): Promise<never> {
  const prog = basename(process.argv[1])
  console.log(`usage: ${prog} unpack <file.SerumPreset> <out.json>`)
  console.log(`       ${prog} pack   <in.json>         <out.SerumPreset>`)
  process.exit(exitCode)
}

;(async () => {
  const [, , cmd, src, dst] = process.argv
  if (!cmd || !src || !dst || !['unpack', 'pack'].includes(cmd)) usage(1)

  try {
    ;(cmd === 'unpack' ? await unpack : await pack)(src, dst)
  } catch (err) {
    console.error((err as Error).message)
    process.exit(2)
  }
})()
