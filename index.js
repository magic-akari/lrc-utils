import { compressTags } from "./compress-tags.js";
import { parser, stringify } from "./lrc-parser.js";
const $ = (arg) => document.querySelector(arg);
const back = $(".back");
const input = $("#input");
const output = $("#output");
const overwrite = $("#overwrite");
const actions = $(".actions");
const timeTransform = $("#time-transform");
const timeTransformDialog = $(".time-transform.dialog");
const splitTranslation = $("#split-translation");
const splitTranslationDialog = $(".split-translation.dialog");
const regexInput = $("#regex");
const lyricText = localStorage.getItem("lrc-maker-lyric") || "";
const { fixed = 3, spaceStart = 1, spaceEnd = 0, themeColor = "#f58ea8", } = JSON.parse(localStorage.getItem("lrc-maker-preferences") || "{}");
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
    const el = ev.target;
    state.lrc = parser(el.value, trimOptions);
});
actions.addEventListener("click", (ev) => {
    const el = ev.target;
    const action = el.dataset["action"];
    if (action === undefined) {
        return;
    }
    const lrc = state.lrc;
    switch (action) {
        case "compressTags": {
            output.value = compressTags(lrc, formatOptions);
            return;
        }
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
        case "lrcOverwrite": {
            overwriteState.value = !overwriteState.value;
            overwrite.focus();
            return;
        }
    }
});
timeTransform.addEventListener("input", (ev) => {
    const el = ev.target;
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
        const form = ev.currentTarget;
        const transformA = form.elements.namedItem("transformA");
        const transformC = form.elements.namedItem("transformC");
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
    const el = ev.target;
    if (el.id !== "regex") {
        regexInput.value = el.value;
    }
    const lrc = state.lrc;
    try {
        const regex = new RegExp(el.value);
        const info = lrc.info;
        const [lyric1, lyric2] = lrc.lyric.reduce((p, line) => {
            const result = line.text.match(regex);
            if (result !== null && result.length >= 3) {
                p[0].push({ ...line, text: result[1] });
                p[1].push({ ...line, text: result[2] });
            }
            else {
                p[0].push(line);
                p[1].push(line);
            }
            return p;
        }, [[], []]);
        output.value = [lyric1, lyric2]
            .map((lyric) => {
            return stringify({ info, lyric }, formatOptions);
        })
            .join("\r\n".repeat(3));
    }
    catch (error) { }
});
splitTranslation.addEventListener("submit", (ev) => {
    ev.preventDefault();
    splitTranslationDialog.open = false;
    return false;
});
const lrcOverWriteText = {
    get value() {
        return sessionStorage.getItem("lrc-maker-overwrite") || "";
    },
    set value(v) {
        sessionStorage.setItem("lrc-maker-overwrite", v);
    },
};
overwrite.value = lrcOverWriteText.value;
let isOverwrite = false;
const timePadding = $(".overwrite-time-padding");
timePadding.innerText = stringify({
    info: new Map(),
    lyric: [
        {
            time: 0,
            text: "",
        },
    ],
}, formatOptions);
overwrite.style.paddingLeft = `${timePadding.getBoundingClientRect().width + 10}px`;
const overwriteState = {
    state: {},
    get value() {
        return isOverwrite;
    },
    set value(v) {
        isOverwrite = v;
        if (v) {
            document.body.classList.add("overwrite-mode");
            this.state = parser(input.value, trimOptions);
            input.value = stringify(this.state, formatOptions);
        }
        else {
            document.body.classList.remove("overwrite-mode");
        }
    },
    render(text) {
        const lyric = text
            .split("\n")
            .slice(this.state.info.size)
            .map((text, i) => {
            var _a;
            return { time: (_a = this.state.lyric[i]) === null || _a === void 0 ? void 0 : _a.time, text };
        });
        const newState = { info: this.state.info, lyric };
        return stringify(newState, formatOptions);
    },
};
overwrite.addEventListener("input", () => {
    lrcOverWriteText.value = overwrite.value;
    output.value = overwriteState.render(overwrite.value);
});
overwrite.addEventListener("scroll", () => {
    output.scrollTop = input.scrollTop = overwrite.scrollTop;
    output.scrollLeft = input.scrollLeft = overwrite.scrollLeft;
});
const main = () => {
    input.value = lyricText;
    document.documentElement.style.setProperty("--theme-color", themeColor);
};
main();
//# sourceMappingURL=index.js.map