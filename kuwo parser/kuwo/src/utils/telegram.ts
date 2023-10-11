import { Telegraf } from 'telegraf'
import config from './config'
import logger from './logger'

const bot = new Telegraf(config.telegram.token)

export async function massMessage(text: string) {
  for (const chat of config.telegram.chats) {
    bot.telegram.sendMessage(chat, text, { parse_mode: 'MarkdownV2' })
      .catch(err => logger.error(err))
  }
}

export function escape(text: string) {
  return text.replace(/[\_\*\[\]\(\)\~\`\>\#\+\-\=\|\{\}\.\!]/g, '\\$&')
}