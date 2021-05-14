#!/usr/bin/env node
const { readFile, writeFile } = require('fs/promises')
const c = require('chalk')
const crypto = require('crypto')
const globby = require('globby')
const { paths } = require('./config')

/*
 *--------------------------------------------------------------------------
 * Generate an asset manifest
 *--------------------------------------------------------------------------
 *
 * For all the static files we serve with good caching, we will need good
 * cache busting where there has been a change. The manifest generator
 * creates a map of objects for each file: { filename: filename?ver=###### }
 * which allows our server code to reference a file by name, while actually
 * outputing the filename, plus a query string that represents the file's
 * contents as a hash.
 *
 * This strategy is important versus timestamps as timestamps invalidate
 * the cache everytime a file is built even if it has the same contents.
 * Using a content hash, if we for example, revert a file, it will have
 * the same hash it previously had and then users wont need a new copy
 * of the same file!
 *
 */

/**
 * Ripped from rev-hash, generate hash based on a files contents
 * @url https://github.com/sindresorhus/rev-hash/blob/main/index.js
 * @param {String} filePath file to read contents
 * @returns {Promise} hash of file's contents
 */
const genHash = async (filePath) => {
  const contents = await readFile(filePath)
  if (typeof contents !== 'string' && !Buffer.isBuffer(contents)) {
    throw new TypeError('Expected a Buffer or string')
  }
  return crypto.createHash('md5').update(contents).digest('hex').slice(0, 10)
}

const Generator = {
  /**
   * @type {Object}
   * @description
   * Mapping of asset name to name with appended query string hash
   * @example
   * { "base.css":"base.css?ver=63ce8ed71c" }
   */
  manifest: {},
  /**
   * @type {Array<String>}
   * @description
   * List of asset files matched from glob
   * @example
   * ['src/css/modules/base.css']
   */
  assets: [],
  /**
   * @description
   * Generate a manifest for all assets and save it to disk
   */
  async run() {
    this.assets = await globby(`${paths.dist}/**/*.{jpg,png,js,css,svg}`)
    await Promise.all(
      this.assets.map(async (file) => {
        const fileName = file.substring(file.lastIndexOf('/') + 1 || 0)
        const hash = await genHash(file)
        this.manifest[fileName] = `${fileName}?ver=${hash}`
      })
    )
    await writeFile(`${paths.dist}/manifest.json`, JSON.stringify(this.manifest))
    console.log(c.greenBright(`✓ Created file hashes in ${paths.dist}/manifest.json`))
  }
}

Generator.run()
