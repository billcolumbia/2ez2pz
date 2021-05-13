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

class Builder {
  /**
   * @type {Array<String>}
   */
  modules = null

  constructor() {
    this.modules = this.findModules()
  }

  /**
   * @description
   */
  findModules = () => {
    return paths.css.modules.map((pattern) => globby.sync(pattern)).flat()
  }

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
   * Find the parent module that references the given partial
   * and process it. Requires the module filePath and event name
   * @param {String} event event name (add, change, etc from chokidar)
   * @param {String} filePath file name and path that triggered the event
   */
  processParent = (event, filePath) => {
    /**
     * strip path away, so we can match relative paths in parent modules
     */
    const partial = filePath.match(/(\w|\d|\-)+\.css/)[0]
    fileEvent(event, filePath, 'Partial Changed: Rebuilding Parent Module')
    this.modules.forEach((file) => {
      // read current file and if it references the partial, process it
      fs.readFile(file).then((contents, err) => {
        if (err) console.log(err)
        if (contents.includes(partial)) this.processFile(file)
      })
    })
  }

  processAll = async () => {
    fileEvent('boot', 'All CSS', 'Build System started')
    await Promise.all(
      this.modules.map(async (file) => {
        return await this.processFile(file)
      })
    )
  }

  /**
   * Use chokidar for our watcher to re-run our batch ONLY when
   * an add or change event occurs.
   */
  watch = () => {
    chokidar
      .watch(paths.css.watch, { ignoreInitial: true })
      .on('all', (event, filePath) => {
        if (event !== 'add' && event !== 'change') return
        /**
         * Tailwind JIT is fun! When you update your templates though, we need to
         * rebuild our CSS so the JIT can re-evaluate the template files and add
         * the newly used classes to the CSS!
         */
        if (!filePath.includes('.css')) {
          fileEvent('change', filePath, 'Tailwind JIT re-evaulation')
          this.processModule('Rebuilding Utility Module', 'src/css/modules/utility.css')
          return
        }
        /**
         * Normal CSS source files changed, re-process accordingly
         */
        if (filePath.includes('modules')) this.processModule(event, filePath)
        if (filePath.includes('partials')) this.processParent(event, filePath)
      })
  }

  run = () => {
    this.processAll()
    if (isDev) this.watch()
  }
}

const instance = new Builder()
instance.run()
