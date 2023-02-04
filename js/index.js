var lrc = {
    handle: 0,
    former: "",
    fList: [],
    latter: "",
    lList: [],
    handling: false,
    recording: false,
    recordingLock: true
}

const resetLrc = () => {
    lrc.handle = 0
    lrc.former = ""
    lrc.fList = []
    lrc.latter = ""
    lrc.lList = []
    lrc.handling = false
    lrc.recordingLock = true
}

const LrcMutexLock = () => {
    lrc.recordingLock = true
    document.getElementById("begin").innerText = "打点已被上锁了,点击解锁"
}

const LrcMutexUnlock = () => {
    lrc.recordingLock = false
    document.getElementById("begin").innerText = "当前可以打点"
}

// fList{
//     index: i,
//     sentence: v,
//     have: false,
//     time: "",
//     sustain: seconds*1000,
//     metaIsAdd: false,
//     timeMeta: []
// }

const TIME_REG = /\[([0-9]*\:){1,2}[0-9]*\.?[0-9]*\]/
var timer = {
    time: null,
    hour: 0,
    minutes: 0,
    seconds: 0,
    millisecond: 0,
    record: 0
}
const resetTimer = () => {
    clearInterval(timer.time)
    timer.hour = timer.minutes = timer.seconds = timer.millisecond = timer.record = 0
    lrc.recording = false
}

const timeToMili = (str) => {
    timePartial = str.split(":")
    timeTot = 0
    for (x = 0; x < timePartial.length; x++) {
        timeTot = timeTot * 60 + parseFloat(timePartial[x])
    }
    timeTot *= 1000
    return timeTot
}

const parseMeta = (x) => {
    const meta = (s, i) => `&lt;${s},${i}&gt;`
    var metas = "[tt]&lt;0,0&gt;"
    lrc.fList[x]["timeMeta"].forEach((v, i) => { metas += meta(v, i) })
    metas += `&lt;${lrc.fList[x]["timeMeta"].slice(-1)}&gt;`
    return metas
}

const parseMetaString = (x) => {
    const meta = (s, i) => `<${s},${i}>`
    var metas = "[tt]<0,0>"
    lrc.fList[x]["timeMeta"].forEach((v, i) => { metas += meta(v, i) })
    metas += `<${lrc.fList[x]["timeMeta"].slice(-1)}>`
    return metas
}

const showLrcResult = (index) => {
    console.log(lrc.fList[index])
    var resDom = document.getElementById("res")
    var res = ""
    for (var x = 0; x <= index; x++) {
        if (lrc.fList[x]["have"]) {
            res += `
            <div class="lrc-res-item">
                <p class="lrc-res-sentence">${lrc.fList[x]["sentence"]}</p>
                ${lrc.fList[x].metaIsAdd ? `<p class="lrc-res-sentence">[${lrc.fList[x]["time"]}]${parseMeta(x)}</p>` : ""}
            </div>
            `
        } else {
            res += `
            <div class="lrc-res-item">
                <p class="lrc-res-sentence">${lrc.fList[x]["sentence"]}</p>
            </div>
            `
        }
    }
    resDom.innerHTML = res

    rightDom = document.getElementById("right")
    rightDom.scrollTop = rightDom.scrollHeight
}

const exportLrcResult = (filename = "demo.lrcx") => {
    // console.log(lrc.fList[index])
    var resDom = document.getElementById("res")
    var res = ""
    for (var x = 0; x < lrc.fList.length; x++) {
        if (lrc.fList[x]["have"]) {
            res += `${lrc.fList[x]["sentence"]}\n${lrc.fList[x].metaIsAdd ? `[${lrc.fList[x]["time"]}]${parseMetaString(x)}\n` : ""}`
        } else {
            res += `${lrc.fList[x]["sentence"]}\n`
        }
    }

    var blob = new Blob([res], { type: "text/plain;charset=utf-8" })
    const objectURL = URL.createObjectURL(blob)
    const aTag = document.createElement('a')
    aTag.href = objectURL
    aTag.download = filename
    aTag.click()
    URL.revokeObjectURL(objectURL)
}

const showLrcSentence = (index) => {
    document.getElementById("lrc-sentence").innerHTML = lrc.fList[index]["sentence"] || "(该行无文字，请编辑下一句)"
    if (index < lrc.fList.length - 1) {
        document.getElementById("next-lrc-sentence").innerHTML = `下一句：${lrc.fList[index + 1]["sentence"]}`
    } else {
        document.getElementById("next-lrc-sentence").innerHTML = "下一句：（结束）"
    }
}

const handleLrcSentence = (index) => {
    resetTimer()
    showLrcSentence(index)
    // console.log(lrc.fList)
    lrc.fList[index]["metaIsAdd"] = false
    lrc.fList[index]["timeMeta"] = []
    StartTimer(lrc.fList[index]["sustain"] / 10)
    lrc.recording = true
}

const RecordTimeMeta = (index) => {
    lrc.fList[index]["metaIsAdd"] = true
    if (timer.record * 10 < lrc.fList[index]["sustain"]) {
        lrc.fList[index]["timeMeta"].push(timer.record * 10)
    }
}

document.getElementById("reset-all").addEventListener("click", () => {
    resetLrc()
    resetTimer()
    document.getElementById("lrc-input").value = ""
    document.getElementById("lrc-sentence").innerText = "当前未处理数据"
    document.getElementById("timer").innerText = "00:00:00.00"
    document.getElementById("begin").innerText = "开始"
}, false)


document.getElementById("confirm-input").addEventListener("click", () => {
    resetLrc()
    const lrcInput = document.getElementById("lrc-input")
    lrc.former = lrcInput.value
    splitLrc = lrc.former.split("\n")
    splitLrc.forEach((v, i) => {
        // console.log(v, TIME_REG.test(v))
        !TIME_REG.test(v)
            ? lrc.fList.push({ index: i, sentence: v, have: false, time: "", sustain: 0, metaIsAdd: false, timeMeta: [] })
            : lrc.fList.push({
                index: i,
                sentence: v,
                have: true,
                time: v.match(TIME_REG)[0].replace("[", "").replace("]", ""),
                sustain: ((index) => {
                    for (var x = index + 1; x < splitLrc.length; x++) {
                        if (TIME_REG.test(splitLrc[x])) {
                            var timeStr = splitLrc[x].match(TIME_REG)[0].replace("[", "").replace("]", "")
                            var time = timeToMili(timeStr) - timeToMili(splitLrc[index].match(TIME_REG)[0].replace("[", "").replace("]", ""))
                            return time
                        }
                    }
                    return Infinity
                })(i),
                metaIsAdd: false,
                timeMeta: []
            })
    })
    showLrcResult(lrc.fList.length - 1)
    showLrcSentence(lrc.handle)
    lrc.handling = true
}, false)


document.getElementById("next-sentence").addEventListener("click", () => {
    resetTimer()
    if (lrc.handle < lrc.fList.length - 1) {
        lrc.handle++
        LrcMutexUnlock()
    } else {
        LrcMutexLock()
        console.log("结束了")
    }
    showLrcSentence(lrc.handle)
    showLrcResult(lrc.handle - 1)
}, false)


document.getElementById("begin").addEventListener("click", () => {
    resetTimer()
    LrcMutexUnlock()
}, false)

document.getElementById("record").addEventListener("click", () => {
    if (timer.record > 500) {
        resetTimer()
    }
}, false)

document.getElementById("lrc-export").addEventListener("click", () => {
    exportLrcResult()
})

document.addEventListener("keypress", (event) => {
    if (event.code == "Space" && lrc.handling) {
        if (lrc.recording && !lrc.recordingLock) {
            RecordTimeMeta(lrc.handle)
        } else if (!lrc.recording && !lrc.recordingLock) {
            handleLrcSentence(lrc.handle)
        } else {
            LrcMutexLock()
        }
        event.preventDefault()
    } else if (event.code == "Enter" && !event.shiftKey && lrc.handling) {
        resetTimer()
        if (lrc.handle < lrc.fList.length - 1) {
            lrc.handle++
            LrcMutexUnlock()
        } else {
            LrcMutexLock()
            console.log("结束了")
        }
        showLrcSentence(lrc.handle)
        showLrcResult(lrc.handle - 1)
        // console.log(lrc.fList[lrc.handle], lrc.fList[lrc.handle - 1])
        event.preventDefault()
    } else if (event.code == "Enter" && event.shiftKey && lrc.handling) {
        resetTimer()
        LrcMutexUnlock()
    }
}, false)

function StartTimer(limit = -1) {
    timer.time = setInterval(function () {
        timer.record++
        timer.millisecond++;
        if (limit >= 0 && timer.record >= limit) {
            LrcMutexLock()
            resetTimer()
        }
        if (timer.millisecond == 100) {
            timer.seconds++;
            timer.millisecond = 0;
        }
        if (timer.seconds == 60) {
            timer.minutes++;
            timer.seconds = 0;
        }
        if (timer.minutes == 60) {
            timer.hour++;
            timer.minutes = 0;
        }
        if (timer.millisecond < 10) {
            ms = '0' + timer.millisecond;
        } else {
            ms = timer.millisecond;
        }
        if (timer.seconds < 10) {
            s = '0' + timer.seconds;
        } else {
            s = timer.seconds;
        }
        if (timer.minutes < 10) {
            m = '0' + timer.minutes;
        } else {
            m = timer.minutes;
        }
        if (timer.hour < 10) {
            h = '0' + timer.hour;
        } else {
            h = timer.hour;
        }
        // 每次执行,返回一个记录时间的字符串
        // 将这个字符串,写入到div中
        document.getElementById("timer").innerHTML = ` ${h}:${m}:${s}:${ms} `
    }, 10);
}