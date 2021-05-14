const isDev = process.env.NODE_ENV === 'development'
const fs = require('fs-extra')
const { paths } = require('./config')
const { fileEvent, timer } = require('./logger')
const globby = require('globby')
const chokidar = require('chokidar')
const postcss = require('postcss')
const devPlugins = [
  require('postcss-import'),
  require('tailwindcss')({ config: require('../tailwind') })
]
const prodPlugins = [
  ...devPlugins,
  require('autoprefixer'),
  require('postcss-preset-env')({
    stage: 1,
    browsers: ['chrome 58', 'firefox 57', 'safari 11', 'edge 16'],
    preserve: false
  }),
  require('cssnano')
]
const plugins = isDev ? devPlugins : prodPlugins

class CSSTask {
  /**
   * @description
   * Flattened array of all modules' filepaths
   * @type {Array<String>}
   */
  modules = null

  constructor() {
    this.modules = paths.css.modules.map((pattern) => globby.sync(pattern)).flat()
  }

  /**
   * @description
   * Process a given file through PostCSS and its plugins.
   * Outputs file to dist location set in config.
   * @summary
   * Utilizes timer functions from logger.
   * We need to extract the filename without the path so it can be
   * added to the dist path for PostCSS output ('to' option).
   * Source maps are inline in dev, separate files for prod.
   * @param {String} file filename with path
   */
  processFile = async (file) => {
    const start = Date.now()
    const fileName = file.match(/(\w|\d|\-)+(?=\.css)/)[0]
    const distPath = `${paths.css.dist}/${fileName}.css`
    try {
      const css = await fs.readFile(file)
      const result = await postcss(plugins).process(css, {
        from: file,
        to: distPath,
        map: { inline: isDev }
      })
      await fs.outputFile(distPath, result.css)
      if (result.map) await fs.outputFile(`${distPath}.map`, result.map.toString())
      timer(file, Date.now() - start)
    } catch (err) {
      console.log(err)
    }
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
    this.processFile(file)
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
    const partial = filePath.match(/(\w|\d|\-)+\.css/)[0]
    fileEvent(event, filePath, 'Partial Changed: Rebuilding Parent Module')
    this.modules.forEach(async (file) => {
      try {
        const contents = await fs.readFile(file)
        if (contents.includes(partial)) this.processFile(file)
      } catch (err) {
        console.log(err)
      }
    })
  }

  /**
   * @description
   * Process all modules.
   */
  processAll = async () => {
    fileEvent('boot', 'All CSS', 'Build System started')
    return await Promise.all(
      this.modules.map(async (file) => {
        return await this.processFile(file)
      })
    )
  }

  /**
   * @description
   * Start chokidar watcher to reprocess files. Files to watch
   * are set in config.
   * @summary
   * We only need to work with add and change events, ignore all others.
   *
   * When a file changes that is not CSS, it's probably a template. In that
   * case we will want to reprocess the utility.css to trigger tailwindcss
   * JIT re-evaluation.
   *
   * When the event is add/change AND it's a CSS file, we process it based
   * it's path. Modules get processed individually and partials trigger
   * parent modules to be processed.
   */
  watch = () => {
    chokidar
      .watch(paths.css.watch, { ignoreInitial: true })
      .on('all', (event, filePath) => {
        if (event !== 'add' && event !== 'change') return
        if (!filePath.includes('.css')) {
          fileEvent('change', filePath, 'Tailwind JIT re-evaulation')
          this.processModule('Rebuilding Utility Module', 'src/css/modules/utility.css')
          return
        }
        if (filePath.includes('modules')) this.processModule(event, filePath)
        if (filePath.includes('partials')) this.processParent(event, filePath)
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

const instance = new CSSTask()
instance.run()
