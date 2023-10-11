import fs from 'fs'
import { Song } from '../methods/kuwo'
import config from './config'
import logger from './logger'

export default class {
  list: string[]
  cache: { [key: number]: boolean } = {}

  // TODO: Add cache restoring function

  constructor() {
    const data = fs.readFileSync(config.storage.artists, 'utf8')
    this.list = data.replaceAll('\r', '').split('\n')

    logger.info(`Loaded ${this.list.length} artists`)
  }

  async checkSong(song: Song) {
    if (this.cache[song.artistid]) return true

    if (song.artist.includes("&")) {
      const artists = song.artist.split("&")
      for (const i in artists)
        {
          const artist = artists[i]
        
          if (this.list.includes(artist.trim())) {
            logger.error(artist)
            return true
          }
        }
    }
    if (song.artist.includes("Lil Pump")) logger.error("ebat")

    if (this.cache[song.artistid] === false) return false

    if (this.list.includes(song.artist)) {
      this.cache[song.artistid] = true
      return true
    }

    this.cache[song.artistid] = false
    return false
  }

  async checkString(artist: string) {
    if (this.list.includes(artist)) return true
    return false
  }
}