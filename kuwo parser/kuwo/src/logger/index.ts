import fs from 'fs'
import { Context } from "moleculer"

import { Song } from "../methods/kuwo"
import { broker } from "../utils/broker"
import config from '../utils/config'

let data: Song[] = []
let filtered_data: Song[] = []

broker.createService({
  name: "logger",
  actions: {
    song: (ctx: Context<Song>) => {
      let song = ctx.params
      data.push(song)
    },

    filtered: (ctx: Context<Song>) => {
      let song = ctx.params
      data.push(song)
    }
  }
})

setInterval(() => {
  let songsList = ""
  let filteredList = ""

  data.forEach((song, i) => {
    songsList += `${song.id}|${song.artistid}|${song.albumid}|${song.artist}|${song.name}|${song.date}\n`
    delete data[i]
  })
  filtered_data.forEach((song, i) => {
    filteredList += `${song.id}|${song.artistid}|${song.albumid}|${song.artist}|${song.name}|${song.date}\n`
    delete filtered_data[i]
  })

  fs.appendFileSync(config.kuwo.logging.file, songsList)
  fs.appendFileSync("./data/kuwo/filtered.txt", filteredList)
}, 1000)

export default broker