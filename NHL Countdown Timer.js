// Countdown timer until the next NHL game

// Helper: Fetches the next NHL game start time from an NHL web API (browser-friendly)
async function getNextNHLGameStartTime() {
    try {
        const today = new Date();
        console.log("[NHL Timer] Today:", today.toISOString());

        // First attempt: use NHL's web schedule endpoint for 'now'
        const url = "https://api-web.nhle.com/v1/schedule/now";
        console.log("[NHL Timer] Fetching schedule via api-web.nhle.com:", url);

        const resp = await fetch(url);
        console.log("[NHL Timer] Response status:", resp.status);

        const data = await resp.json();
        console.log("[NHL Timer] Raw schedule payload (schedule/now):", data);

        // TODO: Once we see the structure in the console, we can pick out the
        // next game's start time. For now, just return null so UI stays safe.
        console.warn("[NHL Timer] schedule/now parsing not implemented yet.");
        return null;
    } catch (e) {
        console.error("[NHL Timer] Failed to fetch NHL schedule.", e);
        return null;
    }
}

// Helper: Formats the difference as HH:MM:SS
function formatCountdown(diffMs) {
    if (diffMs <= 0) return "Game is starting!";
    let totalSeconds = Math.floor(diffMs / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}

// Main: Display a live countdown on the page
async function startNHLCountdownTimer(containerId = "nhl-countdown") {
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.fontFamily = "monospace";
        container.style.fontSize = "2em";
        document.body.appendChild(container);
    }

    const titleEl = document.getElementById("nhl-countdown-title");
    const timerEl = document.getElementById("nhl-countdown-timer");
    const statusEl = document.getElementById("nhl-countdown-status");

    if (statusEl) statusEl.innerText = "Finding the next puck drop...";
    else container.innerText = "Fetching next NHL game...";

    const nextGameTime = await getNextNHLGameStartTime();
    if (!nextGameTime) {
        console.log("[NHL Timer] getNextNHLGameStartTime() returned null – staying in off-season mode.");
        if (statusEl) {
            statusEl.innerText = "No upcoming NHL games found. Off-season mode.";
        } else {
            container.innerText = "No upcoming NHL games found.";
        }
        return;
    }
    function updateTimer() {
        const now = new Date();
        const diff = nextGameTime - now;
        const formatted = formatCountdown(diff);
        console.log("[NHL Timer] Tick:", {
            now: now.toISOString(),
            nextGameTime: nextGameTime.toISOString(),
            diffMs: diff,
            formatted
        });

        if (timerEl) {
            timerEl.innerText = formatted;
        } else {
            container.innerText = "Next NHL game: " + formatted;
        }

        if (statusEl) {
            const gameDateStr = nextGameTime.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short"
            });
            statusEl.innerText = "Next puck drop: " + gameDateStr;
        }

        if (diff <= 0) {
            clearInterval(timerId);
            if (timerEl) timerEl.innerText = "00:00:00";
            if (statusEl) statusEl.innerText = "The next NHL game has started!";
            else container.innerText = "The next NHL game has started!";
        }
    }
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
}

// Initiate the timer
startNHLCountdownTimer();
