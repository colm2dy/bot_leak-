import yaml from 'js-yaml'
import fs from 'fs'
import logger from './logger'

interface Config {
  storage: {
    artists: string
    filtered: string
  }
  telegram: {
    token: string
    chats: string[]
  }
  kuwo: {
    enabled: boolean
    notifications: boolean

    spr: number
    rps: number
    failrate: {
      enabled: boolean
      limit: number
    }

    lockfile: string
    logging: {
      enabled: boolean
      file: string
    }
  }
}

logger.info('Config called')

export default yaml.load(fs.readFileSync('./config.yml', 'utf8')) as Config