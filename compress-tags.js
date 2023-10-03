import { convertTimeToTag, formatText } from "./lrc-parser.js";
export const compressTags = (state, option) => {
    const { spaceStart, spaceEnd, fixed, endOfLine = "\r\n" } = option;
    const infos = Array.from(state.info.entries()).map(([name, value]) => {
        return `[${name}: ${value}]`;
    });
    const records = new Map();
    for (const line of state.lyric) {
        if (line.time === undefined) {
            continue;
        }
        const value = records.get(line.text);
        if (value === undefined) {
            records.set(line.text, [line.time]);
        }
        else {
            records.set(line.text, [...value, line.time]);
        }
    }
    const lines = Array.from(records.entries()).map(([text, times]) => {
        const $text = formatText(text, spaceStart, spaceEnd);
        const $times = times.map((time) => convertTimeToTag(time, fixed));
        return `${$times.join("")}${$text}`;
    });
    return infos.concat(lines).join(endOfLine);
};
//# sourceMappingURL=compress-tags.js.map