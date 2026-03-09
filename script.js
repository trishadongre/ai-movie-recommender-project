// --- CONFIGURATION ---
const API_KEY = '8ffcf7f3'; // Replace with your actual OMDb API Key

// --- DATA INITIALIZATION ---
let movieData = [];
let linkData = [];

// --- CORE MATRIX ENGINE ---
async function initMatrix() {
    try {
        // Load movies and links (Small files)
        const [mRes, lRes] = await Promise.all([
            fetch('movies.csv').then(r => r.text()),
            fetch('links.csv').then(r => r.text())
        ]);

        movieData = parseCSV(mRes).slice(1); // Remove header
        linkData = parseCSV(lRes);
        
        console.log("Matrix initialized.");
    } catch (e) {
        console.error("Matrix Sync Failed:", e);
    }
}

function parseCSV(text) {
    if (!text) return [];
    return text.split('\n')
               .filter(row => row.trim() !== '')
               .map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
}

// --- DASHBOARD RENDERER ---
async function renderDashboard(genre = 'Horror') {
    const grid = document.getElementById('movieGrid');
    const titleHeader = document.getElementById('recommendationTitle');
    if (!grid) return;

    // Update Active Pill UI
    document.querySelectorAll('.genre-pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === genre.toLowerCase()) btn.classList.add('active');
    });

    titleHeader.innerHTML = `Recommended <span class="neon-text">${genre}</span>`;
    grid.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-info"></div><p class="neon-text mt-3">Syncing Matrix...</p></div>';

    // Filter by genre
    const filtered = movieData.filter(m => m[2] && m[2].toLowerCase().includes(genre.toLowerCase())).slice(0, 8);
    await displayMovies(filtered);
    updateWatchlistCount();
}

// --- SEARCH FUNCTION ---
async function searchMovies() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;

    const grid = document.getElementById('movieGrid');
    const titleHeader = document.getElementById('recommendationTitle');
    
    titleHeader.innerHTML = `Search: <span class="neon-text">${query}</span>`;
    grid.innerHTML = '<div class="col-12 text-center p-5"><p class="neon-text">Querying Matrix...</p></div>';

    const filtered = movieData.filter(m => m[1] && m[1].toLowerCase().includes(query)).slice(0, 8);
    await displayMovies(filtered);
}

// --- DISPLAY LOGIC ---
async function displayMovies(movies) {
    const grid = document.getElementById('movieGrid');
    let html = '';

    if (movies.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center p-5"><p class="text-secondary">No matches found in this sector.</p></div>';
        return;
    }

    for (let m of movies) {
        try {
            // Clean title for API (remove year)
            const cleanTitle = m[1].split(' (')[0].trim();
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${API_KEY}`);
            const data = await res.json();
            const poster = (data.Response === "True" && data.Poster !== "N/A") ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
            
            html += `
                <div class="col-6 col-md-3 mb-4">
                    <div class="movie-card glass-panel p-2 h-100 d-flex flex-column" onclick="goToDetails('${m[1].replace(/'/g, "\\'")}', '${m[0]}')">
                        <img src="${poster}" class="img-fluid rounded mb-2" style="height:320px; object-fit:cover;">
                        <h6 class="text-truncate fw-bold text-white px-1 m-0">${m[1]}</h6>
                        <small class="text-info px-1 mb-2">View Details</small>
                        <button class="btn btn-neon btn-sm w-100 mt-auto" onclick="event.stopPropagation(); addToWatchlist('${m[1].replace(/'/g, "\\'")}', '${poster}')">
                            + WATCHLIST
                        </button>
                    </div>
                </div>`;
        } catch (e) { console.error(e); }
    }
    grid.innerHTML = html;
}

// --- WATCHLIST SYSTEM ---
function addToWatchlist(title, poster) {
    let list = JSON.parse(localStorage.getItem('myWatchlist') || '[]');
    if (!list.find(m => m.title === title)) {
        list.push({ title, poster });
        localStorage.setItem('myWatchlist', JSON.stringify(list));
        updateWatchlistCount();
        alert(`${title} added to Matrix!`);
    } else {
        alert("Already in your Matrix.");
    }
}

function updateWatchlistCount() {
    const countEl = document.getElementById('watchCount');
    if (countEl) {
        const list = JSON.parse(localStorage.getItem('myWatchlist') || '[]');
        countEl.innerText = list.length;
    }
}

// --- NAVIGATION ---
function goToDetails(title, id) {
    localStorage.setItem('selectedMovie', title);
    localStorage.setItem('selectedId', id);
    window.location.href = 'details.html';
}

function enterSystem() {
    const user = document.getElementById('username').value;
    if (user) {
        localStorage.setItem('matrixUser', user);
        window.location.href = 'dashboard.html';
    }
}

// --- INITIALIZE ON LOAD ---
if (window.location.pathname.includes('dashboard.html')) {
    window.onload = async () => {
        await initMatrix();
        renderDashboard('Horror');
    };
} else {
    window.onload = initMatrix;
}