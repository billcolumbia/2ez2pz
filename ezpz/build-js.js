const isDev = process.env.NODE_ENV === 'development'
const { fileEvent, fileInfo, timer } = require('./logger')
const { paths, jsOptions } = require('./config')
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
        if (jsOptions.verboseErrors) console.log(err)
      })
    files.forEach((file) => fileInfo(file))
    timer('Modules', Date.now() - start)
  }

  /**
   * @description
   * Process a single module, requires module filePath and event name
   * @param {String} event event name (add, change, etc from chokidar)
   * @param {String} filePath file name and path that triggered the event
   */
  processModule = (event, filePath) => {
    fileEvent(event, filePath, 'Module Changed: Rebuilding')
    const file = this.modules.find((file) => file === filePath)
    this.processFiles([file])
  }

  /**
   * @description
   * Find the parent module that references the given partial
   * and process it. Requires the module filePath and event name
   * @summary
   * Extract just filename from filePath as import statements likely
   * won't have a full path. We need to iterate over all top level
   * modules, looking for that extracted filename. When the import
   * statement is matched, reprocess that parent module.
   * @param {String} event event name (add, change, etc from chokidar)
   * @param {String} filePath file name and path that triggered the event
   */
  processParent = async (event, filePath) => {
    const match = filePath.match(/(\w|\d|\-)+\.js/)[0]
    // remove file extension from match
    const partialName = match.replace('.js', '')
    let modulesQueue = []
    fileEvent(event, filePath, 'Partial Changed: Rebuilding Parent Module')
    await Promise.all(
      this.modules.map(async (file) => {
        try {
          const contents = await fs.readFile(file)
          const importRegex = new RegExp(`import.*'${partialName}'`)
          if (importRegex.test(contents)) modulesQueue.push(file)
        } catch (err) {
          console.log(err)
        }
      })
    )
    this.processFiles(modulesQueue)
  }

  /**
   * @description
   * Process all modules.
   */
  processAll = async () => {
    fileEvent('boot', 'All JavaScript', 'Build System started')
    return await this.processFiles(this.modules)
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
        if (filePath.includes('modules')) this.processModule(event, filePath)
        else this.processParent(event, filePath)
      })
  }

  /**
   * @description
   * Process all modules and if in dev mode, start the watcher.
   */
  run = async () => {
    await this.processAll()
    if (isDev) this.watch()
  }
}

new JSTask().run()
