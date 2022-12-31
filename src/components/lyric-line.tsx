import { classname } from "../api"
import { LyricLine } from "../lyric-parser"

export const LyricLineComponent: React.FC<{
    lyric: LyricLine,
    lyricIndex: number,
}> = (props) => {
    return <div
    className={classname("am-lyric-line", {
        "am-lyric-line-before": index - currentLyricIndex < 0,
        "am-lyric-line-after": index - currentLyricIndex > 0,
        [`am-lyric-line-o${index - currentLyricIndex}`]:
            Math.abs(index - currentLyricIndex) < 5,
    })}
>
    <div className="am-lyric-line-original">{line.originalLyric}</div>
    <div className="am-lyric-line-translated">{line.translatedLyric}</div>
    <div className="am-lyric-line-roman">{line.romanLyric}</div>
</div>
}