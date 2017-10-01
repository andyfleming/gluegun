const autobind = require('autobind-decorator')
const Runtime = require('./runtime')
const { dissoc, pipe, tryCatch, always } = require('ramda')
const { isBlank } = require('../utils/string-utils')
const { isFile } = require('../utils/filesystem-utils')
const jetpack = require('fs-jetpack')
const toml = require('toml')

/**
 * Provides a cleaner way to build a runtime.
 *
 * @class Builder
 */
class Builder {
  constructor () {
    this.loadPlugins = [] // the plugins to load
    this.events = {} // the events
  }

  /**
   * Makes the runtime.
   *
   * @return {Runtime} The runtime we're building
   */
  create () {
    const runtime = new Runtime(this.brand)

    // should we try to load the config?
    const attemptConfigLoad = !isBlank(this.configFile) &&
      isFile(this.configFile)

    // load the config if we got it
    if (attemptConfigLoad) {
      // load the config
      const config = pipe(jetpack.read, tryCatch(toml.parse, always({})))(
        this.configFile
      )

      // extract the defaults
      runtime.defaults = config.defaults

      // set config to be the file minutes defaults
      runtime.config = dissoc('defaults', config)
    }

    // set the rest of the properties
    runtime.events = this.events

    // the plugins get loaded last
    this.loadPlugins.forEach(entry => {
      switch (entry.type) {
        case 'load':
          runtime.load(entry.value, entry.options)
          break
        case 'loadAll':
          runtime.loadAll(entry.value, entry.options)
          break
      }
    })

    return runtime
  }

  /**
   * Sets the config file.
   *
   * @param {string} configFile A path to a TOML file to load configs.
   */
  configFile (configFile) {
    this.configFile = configFile

    return this
  }

  /**
   * Set the brand.
   *
   * @value {string} The brand.
   * @return {Builder} self.
   */
  brand (value) {
    this.brand = value
    return this
  }

  /**
   * Alias for `.plugin()`
   *
   * @param  {string}  value   The default plugin directory.
   * @param  {Object}  options Additional loading options.
   * @return {Builder}         self.
   */
  src (value, options = {}) {
    return this.plugin(value, options)
  }

  /**
   * Add a plugin to the list.
   *
   * @param  {string}  value   The plugin directory.
   * @param  {Object}  options Additional loading options.
   * @return {Builder}         self.
   */
  plugin (value, options = {}) {
    this.loadPlugins.push({ type: 'load', value, options })
    return this
  }

  /**
   * Add a plugin group to the list.
   *
   * @param  {string}  value   The directory with sub-directories.
   * @param  {Object}  options Additional loading options.
   * @return {Builder}         self.
   */
  plugins (value, options = {}) {
    this.loadPlugins.push({ type: 'loadAll', value, options })
    return this
  }

  /**
   * Registers an event.
   *
   * @param  {string}   event    The name of the event.
   * @param  {function} callback The function to call when the even is triggered.
   * @return {Builder}           self.
   */
  on (event, callback) {
    this.events[event] = this.events[event] || []
    this.events[event].push(callback)
    return this
  }
}

/**
 * Export it as a factory function.
 */
module.exports = function build () {
  return new (autobind(Builder))()
}
