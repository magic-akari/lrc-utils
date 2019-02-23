import { parser, stringify, ILyric } from "./lrc-parser/lrc-parser.js";

const $ = (arg: string) => document.querySelector(arg);

const back = $(".back") as HTMLSpanElement;
const input = $("#input") as HTMLTextAreaElement;
const output = $("#output") as HTMLTextAreaElement;
const actions = $(".actions") as HTMLElement;
const timeTransform = $("#time-transform") as HTMLFormElement;
const timeTransformDialog = $(".time-transform.dialog") as HTMLDetailsElement;
const splitTranslation = $("#split-translation") as HTMLFormElement;
const splitTranslationDialog = $(".split-translation.dialog") as HTMLDetailsElement;
const regexInput = $("#regex") as HTMLInputElement;

const lyricText = localStorage.getItem("lrc-maker-lyric") || "";

interface Ipreferences {
    fixed: 0 | 1 | 2 | 3;
    spaceStart: number;
    spaceEnd: number;
    themeColor: string;
}

const { fixed = 3, spaceStart = 1, spaceEnd = 0, themeColor = "#f58ea8" }: Ipreferences = JSON.parse(
    localStorage.getItem("lrc-maker-preferences") || "{}"
);

const trimOptions = {
    trimStart: spaceStart >= 0,
    trimEnd: spaceEnd >= 0,
};

const formatOptions = {
    fixed,
    spaceStart,
    spaceEnd,
};

const state = {
    lrc: parser(lyricText, trimOptions),
};

back.addEventListener("transitionend", () => {
    history.back();
});

input.addEventListener("blur", (ev) => {
    const el = ev.target as HTMLInputElement;
    state.lrc = parser(el.value, trimOptions);
});

actions.addEventListener("click", (ev) => {
    const el = ev.target as HTMLButtonElement;
    const action = el.dataset["action"];

    if (action === undefined) {
        return;
    }

    const lrc = state.lrc;

    switch (action) {
        case "removeTags": {
            const info = new Map();
            const lyric = lrc.lyric.map((line) => {
                return {
                    text: line.text,
                };
            });

            output.value = stringify({ info, lyric }, formatOptions);
            return;
        }

        case "removeEmpty": {
            const info = lrc.info;
            const lyric = lrc.lyric.filter((line) => line.text.trim().length > 0);
            output.value = stringify({ info, lyric }, formatOptions);
            return;
        }

        case "changeOffset": {
            timeTransformDialog.open = true;
            return;
        }

        case "splitTranslation": {
            splitTranslationDialog.open = true;
            return;
        }
    }
});

timeTransform.addEventListener("input", (ev) => {
    const el = ev.target as HTMLInputElement;

    if (el.validity.badInput || el.validity.valueMissing) {
        return;
    }

    const scale = {
        a: 1,
        c: 0,
    };
    if (el.name === "offset") {
        scale.c = Number.parseInt(el.value) / -1000;
    }

    if (el.name === "transformA" || el.name === "transformC") {
        const form = ev.currentTarget as HTMLFormElement;
        const transformA = form.elements.namedItem("transformA") as HTMLInputElement;
        const transformC = form.elements.namedItem("transformC") as HTMLInputElement;
        scale.a = Number.parseFloat(transformA.value);
        scale.c = Number.parseFloat(transformC.value);
    }

    if (Number.isNaN(scale.a)) {
        scale.a = 1;
    }

    if (Number.isNaN(scale.c)) {
        scale.c = 0;
    }

    const lrc = state.lrc;
    const info = lrc.info;
    const lyric = lrc.lyric.map((line) => {
        if (line.time !== undefined) {
            return {
                ...line,
                time: scale.a * line.time + scale.c,
            };
        }
        return line;
    });
    output.value = stringify({ info, lyric }, formatOptions);
});

timeTransform.addEventListener("submit", (ev) => {
    ev.preventDefault();
    timeTransformDialog.open = false;
    return false;
});

splitTranslation.addEventListener("change", (ev) => {
    const el = ev.target as HTMLInputElement;

    if (el.id !== "regex") {
        regexInput.value = el.value;
    }

    const lrc = state.lrc;

    try {
        const regex = new RegExp(el.value);

        const info = lrc.info;
        const [lyric1, lyric2] = lrc.lyric.reduce(
            (p, line) => {
                const result = line.text.match(regex);
                if (result !== null && result.length >= 3) {
                    p[0].push({ ...line, text: result[1] });
                    p[1].push({ ...line, text: result[2] });
                } else {
                    p[0].push(line);
                    p[1].push(line);
                }
                return p;
            },
            [[], []] as [ILyric[], ILyric[]]
        );

        output.value = [lyric1, lyric2]
            .map((lyric) => {
                return stringify({ info, lyric }, formatOptions);
            })
            .join("\r\n".repeat(3));
    } catch (error) {}
});

splitTranslation.addEventListener("submit", (ev) => {
    ev.preventDefault();
    splitTranslationDialog.open = false;
    return false;
});

const main = () => {
    input.value = lyricText;
    document.documentElement.style.setProperty("--theme-color", themeColor);
};

main();
