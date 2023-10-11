import fs, { promises as pfs } from 'fs'
import logger from './logger'

export default class {
  file: string
  cache: number = 0

  constructor(file: string) {
    this.file = file
    this.cache = Number(fs.readFileSync(file, 'utf8'))
  }

  get() {
    return this.cache
  }

  async write(value: number) {
    if (this.cache && value < this.cache)
      return logger.debug('Tried to write old value to lockfile')

    this.cache = value
    pfs.writeFile(this.file, value.toString())
      .catch(err => {
        logger.error('Failed to write lockfile', err)
        throw err
      })
  }

}