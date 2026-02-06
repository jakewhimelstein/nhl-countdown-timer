// Countdown timer until the next NHL game

// Helper: Fetches the next NHL game start time from NHL public API
async function getNextNHLGameStartTime() {
    try {
        const today = new Date();
        const startStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
        console.log("[NHL Timer] Today:", today.toISOString(), "startStr:", startStr);

        // Look ahead 200 days in a single request
        const future = new Date(today);
        future.setDate(today.getDate() + 200);
        const endStr = future.toISOString().slice(0, 10);

        // Use a simple CORS proxy so the NHL API can be called from GitHub Pages.
        // Note: this relies on a third-party service and may have limits.
        const proxyPrefix = "https://corsproxy.io/?";
        const apiUrl = `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${startStr}&endDate=${endStr}`;

        // corsproxy.io expects the target URL to be URL-encoded
        const fullUrl = `${proxyPrefix}${encodeURIComponent(apiUrl)}`;
        console.log("[NHL Timer] Fetching schedule URL:", fullUrl);

        const resp = await fetch(fullUrl);
        console.log("[NHL Timer] Response status:", resp.status);

        const data = await resp.json();
        console.log("[NHL Timer] Raw schedule payload:", data);

        const allDates = data.dates || [];
        console.log("[NHL Timer] Number of date entries:", allDates.length);

        const allGames = allDates.flatMap(d => d.games || []);
        console.log("[NHL Timer] Total games in range:", allGames.length);

        if (allGames.length === 0) {
            console.warn("[NHL Timer] NHL API returned no games in range", { startStr, endStr });
            return null;
        }

        // Find the earliest game that is still in the future relative to 'now'
        const now = new Date();
        const upcomingGames = allGames
            .map(game => ({ ...game, dateObj: new Date(game.gameDate) }))
            .filter(game => game.dateObj >= now)
            .sort((a, b) => a.dateObj - b.dateObj);

        if (upcomingGames.length === 0) {
            console.warn("[NHL Timer] No upcoming games after filtering by now", {
                totalGames: allGames.length
            });
            return null;
        }

        console.log("[NHL Timer] Next game selected:", {
            date: upcomingGames[0].dateObj.toISOString(),
            teams: upcomingGames[0].teams
        });

        return upcomingGames[0].dateObj;
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
