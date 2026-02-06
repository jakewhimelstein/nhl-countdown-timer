// Countdown timer until the next NHL game

// Helper: Fetches the next NHL game start time from NHL public API
async function getNextNHLGameStartTime() {
    try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
        const url = `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${dateStr}&endDate=${dateStr}`;
        const response = await fetch(url);
        const data = await response.json();
        let games = data.dates?.[0]?.games || [];
        // If no games today, check tomorrow, up to 7 days ahead
        let addDays = 1;
        while (games.length === 0 && addDays <= 7) {
            const future = new Date();
            future.setDate(today.getDate() + addDays);
            const fDateStr = future.toISOString().slice(0, 10);
            const resp = await fetch(`https://statsapi.web.nhl.com/api/v1/schedule?startDate=${fDateStr}&endDate=${fDateStr}`);
            const d = await resp.json();
            games = d.dates?.[0]?.games || [];
            if (games.length === 0) addDays++;
            else break;
        }
        if (games.length === 0) return null;
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
    container.innerText = "Fetching next NHL game...";
    const nextGameTime = await getNextNHLGameStartTime();
    if (!nextGameTime) {
        container.innerText = "No NHL games found in the next week.";
        return;
    }
    function updateTimer() {
        const now = new Date();
        const diff = nextGameTime - now;
        container.innerText = "Next NHL game: " + formatCountdown(diff);
        if (diff <= 0) {
            clearInterval(timerId);
            container.innerText = "The next NHL game has started!";
        }
    }
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
}

// Initiate the timer
startNHLCountdownTimer();
