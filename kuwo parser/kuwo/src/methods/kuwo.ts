import { URLSearchParams } from 'url'
import fs from 'fs'
import Artists from '../utils/artists'
import logger from '../utils/logger'
import config from '../utils/config'
import * as tg from '../utils/telegram'
import lockfile from '../utils/lockfile'
import { broker } from '../utils/broker'

type Song = {
  id: number,
  artistid: number,
  albumid: number,

  name: string,
  artist: string,
  date: string
}


const ids_per_request = config.kuwo.spr

const A = new Artists()
const L = new lockfile(config.kuwo.lockfile)

let failrate = 0

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function handleSong(song: Song) {
  logger.debug(`Saving ${song.id}`)

  if (!song.artistid) {
    failrate++
    return logger.warn(`No artistid for ${song.id}`)
  }
  failrate = 0

  if (config.kuwo.logging.enabled)
    broker.call("logger.song", song)

  L.write(song.id)

  if (!await A.checkSong(song)) return

  logger.info(`Finded ${song.artist} ${song.name}`)
  broker.call("logger.filtered", song)

  if (!config.kuwo.notifications) return

  let album =
    await fetch(`https://tsm.kuwo.cn/api/r.s?stype=albuminfo&albumid=${song.albumid}&mobi=1`)
      .then(res => res.json())
      .catch(err => logger.error("Failed fetch album info", err))

  tg.massMessage(
    `Сервис: Kuwo\n` +
    `Артист: ${tg.escape(song.artist.replace("&", ", "))}\n` +
    `Трек: ${tg.escape(song.name)}\n` +
    `Альбом: ${tg.escape(album?.name || "Unknown")}\n` +
    `Дата выхода: ${tg.escape(album?.pub || song.date)}\n` +
    `Лейбл: ${tg.escape(album?.company)}\n` +
    `Альбом айди: \`${tg.escape(song.albumid.toString())}\`\n` +
    `Трей айди: \`${tg.escape(song.id.toString())}\`\n` +
    `Ковер: ${tg.escape(album?.hts_img.replace(/albumcover\/\d+/, "albumcover/0") || "Unknown")}`
  )

}

async function fetchIDs(ids: number[]): Promise<Song[]> {
  if (ids.length > ids_per_request) throw new Error('Too many IDs')

  const data = new URLSearchParams({
    uid: "",
    sid: "",
    ver: "8.5.2.1",
    src: "kwplayer_ar_8.5.2.1_an.apk",
    op: "query",
    action: "download",
    signver: "new",
    filter: "no"
  })

  for (const id of ids) data.append('ids', id.toString())

  // TODO: Add proxy support
  return await fetch(`https://musicpay.kuwo.cn/music.pay?clienttimestamp=${Date.now()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data
  })
    .then(res => {
      if (res.status !== 200) throw new Error("HTTP_ERROR " + res.status)
      return res.json()
    })
    .then(res => {
      logger.info(res.songs.length + ` songs fetched (last id: ${ids[ids.length - 1]})`)
      return res.songs
    })
    .then(songs => {
      let list: Song[] = []

      songs.forEach(async (song: any) => {
        try {
          list.push({
            id: song.id,
            artistid: song.artistid,
            albumid: song.albumid,

            name: song.name,
            artist: song.artist,
            date: song.dc_rtimestamp
          })
        } catch {
          logger.error(`Failed to parse song ${song.id}`)
        }
      })

      return list
    })
    .catch(err => {
      logger.error(err)
      if (err.code === 'ECONNRESET') throw new Error('ECONNRESET')
    }) || []
}

async function loopFetching() {
  // TODO: Add workers support
  let start = L.get()

  while (true) {
    logger.info(`Fetching ${start}-${start + ids_per_request} IDs`)
    let end = start + ids_per_request
    fetchIDs(Array.from({ length: ids_per_request }, (_, i) => i + start))
      .then(list => list.forEach(handleSong))
      .catch(err => logger.error(`Failed to fetch ${start}-${end}`, err))

    if (config.kuwo.failrate.enabled && failrate > config.kuwo.failrate.limit) {
      logger.error("Exceeded failrate! Waiting 5 minutes")
      await delay(5 * 60 * 1000)
    } else {
      start += ids_per_request
      await delay(1000 / config.kuwo.rps)
    }
  }
}

export {
  loopFetching,
  Song
}
