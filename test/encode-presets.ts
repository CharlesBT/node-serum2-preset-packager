import { join } from 'node:path'
import { pack } from '../src/index.js'
import { getExtFilesFromFolder, bulkProcess } from './utils.js'

const __root = process.cwd()
const files = getExtFilesFromFolder(join(__root, './test/encode'), 'json')

await bulkProcess(files, async (file, out) => {
  console.info('processing:', file)
  await pack(file, out)
  console.info('→ written:', out)
}).catch((err) => {
  console.error((err as Error).message)
  process.exit(2)
})
