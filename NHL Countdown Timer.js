// Countdown timer until the next NHL game

// Helper: Fetches the next NHL game start time from NHL public API
async function getNextNHLGameStartTime() {
    try {
        const today = new Date();
        let games = [];

        // Look ahead up to 365 days to find the very next scheduled NHL game
        let addDays = 0;
        while (games.length === 0 && addDays < 365) {
            const future = new Date(today);
            future.setDate(today.getDate() + addDays);
            const fDateStr = future.toISOString().slice(0, 10); // YYYY-MM-DD
            const resp = await fetch(
                `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${fDateStr}&endDate=${fDateStr}`
            );
            const d = await resp.json();
            games = d.dates?.[0]?.games || [];
            addDays++;
        }

        if (games.length === 0) return null; // extremely unlikely – no games in the next year
        // Find the earliest game
        games.sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
        return new Date(games[0].gameDate);
    } catch (e) {
        console.error("Failed to fetch NHL schedule.", e);
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
