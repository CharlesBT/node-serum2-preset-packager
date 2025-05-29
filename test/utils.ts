import fs from 'node:fs'
import { join, parse } from 'node:path'

const TEMP_DIR = '.tmp'

export function getExtFilesFromFolder(folder: string, ext: string): string[] {
  const files = fs.readdirSync(folder)
  return files
    .filter((file) => file.endsWith(`.${ext}`))
    .map((file) => join(folder, file))
    .sort((a, b) => a.localeCompare(b))
}

export async function bulkProcess(
  files: string[],
  processFn: (file: string, out: string) => Promise<void>,
): Promise<void> {
  for (const file of files) {
    const { root, dir, base, name, ext } = parse(file)
    const outDir = join(dir, TEMP_DIR)
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }
    const out = join(outDir, `${name}${ext === '.json' ? '.SerumPreset' : '.json'}`)
    await processFn(file, out)
  }
}
