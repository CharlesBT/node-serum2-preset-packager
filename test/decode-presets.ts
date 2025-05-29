import { join } from 'node:path'
import { unpack } from '../src/index.js'
import { getExtFilesFromFolder, bulkProcess } from './utils.js'

const __root = process.cwd()
const files = getExtFilesFromFolder(join(__root, './test/decode'), 'SerumPreset')

await bulkProcess(files, async (file, out) => {
  console.info('processing:', file)
  await unpack(file, out)
  console.info('→ written:', out)
}).catch((err) => {
  console.error((err as Error).message)
  process.exit(2)
})
