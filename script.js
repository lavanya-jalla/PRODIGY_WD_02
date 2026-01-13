let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let running = false;
let laps = [];
let soundEnabled = true;
let lastSecond = -1;

/* ---------- AUDIO FILES (KEEP YOUR ASSETS) ---------- */
const startSound = new Audio("assets/start.mp3");
const lapSound = new Audio("assets/lap.mp3");
const resetSound = new Audio("assets/reset.mp3");

/* ---------- WEB AUDIO TICK ---------- */
let audioCtx;

function playTick() {
    if (!soundEnabled) return;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "square";
    osc.frequency.value = 1000; // tick pitch
    gain.gain.value = 0.05;     // volume (safe & soft)

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05); // short tick
}

/* ---------- DOM ELEMENTS ---------- */
const timeDisplay = document.getElementById("timeDisplay");
const msDisplay = document.getElementById("msDisplay");
const lapsList = document.getElementById("lapsList");
const shortcutsBox = document.getElementById("shortcutsBox");

/* ---------- BUTTON EVENTS ---------- */
document.getElementById("startBtn").onclick = startPause;
document.getElementById("lapBtn").onclick = recordLap;
document.getElementById("resetBtn").onclick = reset;
document.getElementById("copyLaps").onclick = copyLaps;
document.getElementById("downloadLaps").onclick = downloadLaps;

document.getElementById("showShortcuts").onclick = () =>
    shortcutsBox.classList.toggle("hidden");

document.getElementById("toggleSound").onclick = function () {
    soundEnabled = !soundEnabled;
    this.innerText = soundEnabled ? "🔊" : "🔇";
};

document.getElementById("fullScreenBtn").onclick = toggleFullScreen;

/* ---------- TIMER ---------- */
function startPause() {
    if (!running) {
        running = true;
        document.getElementById("startBtn").innerText = "⏸ Pause";

        if (soundEnabled) startSound.play();

        startTime = Date.now() - elapsedTime;
        lastSecond = -1;

        timerInterval = setInterval(updateTimer, 10);
    } else {
        running = false;
        document.getElementById("startBtn").innerText = "▶ Start";
        clearInterval(timerInterval);
    }
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;

    const hrs = Math.floor(elapsedTime / 3600000);
    const min = Math.floor((elapsedTime % 3600000) / 60000);
    const sec = Math.floor((elapsedTime % 60000) / 1000);
    const ms = elapsedTime % 1000;

    timeDisplay.innerText = `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
    msDisplay.innerText = ms.toString().padStart(3, "0");

    // 🔊 Tick sound every second
    if (sec !== lastSecond) {
        playTick();
        lastSecond = sec;
    }
}

function pad(n) {
    return n.toString().padStart(2, "0");
}

/* ---------- LAP ---------- */
function recordLap() {
    if (!running) return;

    if (soundEnabled) lapSound.play();

    const lapTime = `${timeDisplay.innerText}.${msDisplay.innerText}`;
    laps.push(lapTime);
    renderLaps();
}

function renderLaps() {
    lapsList.innerHTML = "";

    laps.forEach((lap, i) => {
        const div = document.createElement("div");
        div.className = "lap-item";
        div.innerHTML = `
            <span>Lap ${i + 1}</span>
            <span>${lap}</span>
        `;
        lapsList.appendChild(div);
    });
}

/* ---------- RESET ---------- */
function reset() {
    clearInterval(timerInterval);
    running = false;
    elapsedTime = 0;
    lastSecond = -1;
    laps = [];

    if (soundEnabled) resetSound.play();

    timeDisplay.innerText = "00:00:00";
    msDisplay.innerText = "000";
    document.getElementById("startBtn").innerText = "▶ Start";
    lapsList.innerHTML = "No laps recorded yet";
}

/* ---------- COPY / DOWNLOAD ---------- */
function copyLaps() {
    if (!laps.length) return;
    navigator.clipboard.writeText(laps.join("\n"));
    alert("Lap times copied!");
}

function downloadLaps() {
    if (!laps.length) return;

    const blob = new Blob([laps.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "laps.txt";
    a.click();
}

/* ---------- FULLSCREEN ---------- */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

/* ---------- KEYBOARD SHORTCUTS ---------- */
document.addEventListener("keydown", e => {
    if (e.code === "Space") startPause();
    if (e.key.toLowerCase() === "l") recordLap();
    if (e.key.toLowerCase() === "r") reset();
    if (e.key.toLowerCase() === "k") shortcutsBox.classList.toggle("hidden");
});
