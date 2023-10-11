import FfmpegCommand from "fluent-ffmpeg"
import fs from "fs"


const path = "C:\\Users\\E1ecti\\Desktop\\1.mp3"
const tpath = "C:\\Users\\E1ecti\\Desktop\\temp.mp3"
const stream = FfmpegCommand(path)
  .addOutputOptions(
    "-i", "C:/Users/E1ecti/Desktop/1812855499.jpg",
    "-map", "0:0",
    "-map", "1:0",
    '-c', 'copy',
    '-id3v2_version', '4'
  ).save(tpath)

stream.on('end', () => {
  fs.unlinkSync(path);
  fs.renameSync(tpath, path);
});