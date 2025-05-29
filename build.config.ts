import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/cli'],
  declaration: true,
  rollup: {
    emitCJS: true,
    watch: true, // Enable watch mode
  },
  clean: false, // Disable cleaning in watch mode
  // failOnWarn: false,
})
