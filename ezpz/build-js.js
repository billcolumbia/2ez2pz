const isDev = process.env.NODE_ENV === 'development'
const { fileEvent, fileInfo, timer } = require('./logger')
const { paths, js } = require('./config')
const fs = require('fs-extra')
const esbuild = require('esbuild')
const sveltePlugin = require('esbuild-svelte')
const globby = require('globby')
const chokidar = require('chokidar')

class JSTask {
  /**
   * @description
   * Flattened array of all modules' filepaths
   * @type {Array<String>}
   */
  modules = null

  constructor() {
    this.modules = paths.js.modules.map((pattern) => globby.sync(pattern)).flat()
  }

  /**
   * @description
   * Process a given file through esbuild and its plugins.
   * Outputs file to dist location set in config.
   * @summary
   * Utilizes timer functions from logger.
   * Source maps are inline in dev, separate files for prod.
   * @param {Array<String>} files filenames with path
   */
  processFiles = async (files) => {
    const start = Date.now()
    esbuild
      .build({
        entryPoints: files,
        bundle: true,
        sourcemap: isDev ? 'inline' : true,
        outdir: paths.js.dist,
        incremental: isDev,
        plugins: [sveltePlugin()],
        target: ['es2020']
      })
      .catch((err) => {
        if (js.verboseErrors) console.log(err)
      })
    files.forEach((file) => fileInfo(file))
    timer('Modules', Date.now() - start)
  }

  /**
   * @description
   * Start chokidar watcher to reprocess files. Files to watch
   * are set in config.
   * @summary
   * We only need to work with add and change events, ignore all others.
   * Modules get processed individually and partials trigger parent
   * modules to be processed.
   */
  watch = () => {
    chokidar
      .watch(paths.js.watch, { ignoreInitial: true })
      .on('all', (event, filePath) => {
        if (event !== 'add' && event !== 'change') return
        fileEvent(event, filePath, 'Module Changed: Rebuilding')
        this.processFiles(this.modules)
      })
  }

  /**
   * @description
   * Process all modules and if in dev mode, start the watcher.
   */
  run = async () => {
    await this.processFiles(this.modules)
    if (isDev) this.watch()
  }
}

new JSTask().run()
