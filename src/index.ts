/**
 * @fileoverview  Utilities for **packing** and **unpacking** Xfer Serum preset
 * (`*.SerumPreset`) files.
 *
 * The binary layout, reconstructed from the reference Python implementation, is:
 *
 * ```
 *  ┌───────────────┬────────────────────────────────────────────────────────┐
 *  │ Offset (hex)  │ Description                                           │
 *  ├───────────────┼────────────────────────────────────────────────────────┤
 *  │ 00            │ MAGIC = "XferJson\0"  (9 bytes, ASCII)                │
 *  │ 09            │ JSON length         (u32 LE)                          │
 *  │ 0D            │ Reserved            (u32 LE, always 0)                │
 *  │ 11            │ Metadata (UTF-8 JSON, `JSON length` bytes)            │
 *  │ …             │ CBOR length         (u32 LE)                          │
 *  │ …             │ Flags              (u32 LE, 2 ⇒ Zstandard compressed) │
 *  │ …             │ Data  (zstd-compressed CBOR, `CBOR length` bytes)     │
 *  └───────────────┴────────────────────────────────────────────────────────┘
 * ```
 *
 * All multi-byte integers are little-endian.  The helpers below abstract the
 * repeated 32-bit-LE conversions; the public API is exposed through the
 * {@link unpack} and {@link pack} functions.
 *
 * @author  (c) 2025 — Charles Brébant
 * @license MIT
 */

import { readFile, writeFile } from 'node:fs/promises'
import { encode as cborEncode, decode as cborDecode } from 'cbor2'
import { compress, decompress } from '@mongodb-js/zstd'

/* ------------------------------------------------------------------------- */
/* Constants                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Nine-byte ASCII identifier that **must** prefix every valid
 * `*.SerumPreset` file.
 *
 * Its presence fulfils two roles: quick file-type verification and a guard
 * against accidentally processing an incompatible format.
 *
 * @internal
 */
const MAGIC = Buffer.from('XferJson\0', 'ascii') // 9 bytes

/* ------------------------------------------------------------------------- */
/* Little-endian helpers                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Read an unsigned 32-bit little-endian integer from a {@link Buffer}.
 *
 * @param buf    Buffer containing the integer.
 * @param offset Byte offset _within_ {@link buf} where the value starts.
 * @returns Unsigned 32-bit value in host endianness.
 * @internal
 */
function u32le(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset)
}

/**
 * Allocate a 4-byte buffer and write an unsigned 32-bit little-endian integer.
 *
 * @param val Integer to encode.
 * @returns   Buffer containing `val` in little-endian order.
 * @internal
 */
function u32leBuf(val: number): Buffer {
  const b = Buffer.allocUnsafe(4)
  b.writeUInt32LE(val, 0)
  return b
}

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

/**
 * **Unpack** a proprietary Xfer Serum preset file (`*.SerumPreset`) into a
 * plain-text JSON document.
 *
 * The resulting JSON structure:
 *
 * ```jsonc
 * {
 *   "metadata": { /* original metadata *\/ },
 *   "data": { /* decoded synth state *\/ }
 * }
 * ```
 *
 * @param srcPath Path to the binary `.SerumPreset` file.
 * @param dstPath Destination path for the generated JSON file.
 *
 * @throws {Error} If the magic header is incorrect or if the decompressed CBOR
 *                 length does not match the length declared in the header.
 */
export async function unpack(srcPath: string, dstPath: string): Promise<void> {
  const buf = await readFile(srcPath)

  /* Validate magic header -------------------------------------------------- */
  if (!buf.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('Not a valid .SerumPreset file (magic mismatch)')
  }
  let off = MAGIC.length

  /* Extract metadata ------------------------------------------------------- */
  const jsonLen = u32le(buf, off)
  off += 8 // skip length  + reserved DWORD
  const meta = JSON.parse(buf.subarray(off, off + jsonLen).toString('utf8'))
  off += jsonLen

  /* Extract compressed CBOR payload --------------------------------------- */
  const cborLen = u32le(buf, off)
  off += 8 // skip length  + flags (ignored)

  const cborBuf = await decompress(buf.subarray(off))
  if (cborBuf.length !== cborLen) {
    throw new Error('Decompressed length mismatch')
  }

  const data = cborDecode(cborBuf)
  await writeFile(dstPath, JSON.stringify({ metadata: meta, data }, null, 2))
}

/**
 * **Pack** a JSON description (produced by {@link unpack}) back into a
 * binary `*.SerumPreset`.
 *
 * @param srcPath Path to the source JSON file.
 * @param dstPath Destination path for the compiled preset.
 *
 * @remarks
 * - Compression level is fixed to **3**, mirroring the reference Python
 *   implementation for deterministic output.
 * - Unknown header flags are left untouched for forward compatibility.
 */
export async function pack(srcPath: string, dstPath: string): Promise<void> {
  const obj = JSON.parse(await readFile(srcPath, 'utf8'))

  /* Serialise sections ----------------------------------------------------- */
  const mBuf = Buffer.from(JSON.stringify(obj.metadata), 'utf8')
  const cBuf = cborEncode(obj.data)
  const zBuf = await compress(Buffer.from(cBuf), 3) // level 3 ≈ Python impl.

  /* Build header ----------------------------------------------------------- */
  const header1 = Buffer.concat([u32leBuf(mBuf.length), u32leBuf(0)]) // reserved=0
  const header2 = Buffer.concat([u32leBuf(cBuf.length), u32leBuf(2)]) // flags=2(zstd)

  /* Stitch everything together and write ---------------------------------- */
  const out = Buffer.concat([MAGIC, header1, mBuf, header2, zBuf])
  await writeFile(dstPath, out)
}
