import { log } from "./utils/logger";
import ttmlText from "../.temp/1983292457.ttml";
import { parseLyric } from "./core/ttml-lyric-parser";

log("AMLL Test Page");
log(parseLyric(ttmlText));
