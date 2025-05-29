# node-serum2-preset-packager

Encode and decode Xfer Serum 2 `.SerumPreset` files with TypeScript.

This package provides utilities and a CLI for converting between Serum 2 preset files and JSON, making it easy to inspect, modify, or generate presets programmatically.

## Features

- **Unpack**: Convert `.SerumPreset` files to readable JSON.
- **Pack**: Convert JSON files back to `.SerumPreset` format.
- **CLI & API**: Use from the command line or integrate into your own TypeScript/Node.js projects.

## Installation

```bash
pnpm install
```

## Usage

### Programmatic API

```typescript
import { unpack, pack } from './src/index.js'

// Unpack a SerumPreset file to JSON
await unpack('input.SerumPreset', 'output.json')

// Pack a JSON file to SerumPreset
await pack('input.json', 'output.SerumPreset')
```

### CLI

```bash
# Unpack a SerumPreset file to JSON
ts-node [serum2-cli.ts](http://_vscodecontentref_/0) unpack <file.SerumPreset> <out.json>

# Pack a JSON file to SerumPreset
ts-node [serum2-cli.ts](http://_vscodecontentref_/1) pack <in.json> <out.SerumPreset>
```

## Project Structure

- dist/ - Distribution files
- src/ - Core library code
- test/ - test scripts
- test/decode/ - Example .SerumPreset files
- test/encode/ - Example JSON files
