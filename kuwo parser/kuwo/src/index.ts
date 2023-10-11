import logger from "./logger";
import * as kuwo from "./methods/kuwo";
import config from "./utils/config";
import lockfile from "./utils/lockfile";
import { massMessage } from "./utils/telegram";

logger.start()

if (config.kuwo.enabled)
  kuwo.loopFetching()