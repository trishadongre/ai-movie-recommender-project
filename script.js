const API_KEY = '8ffcf7f3'; // <--- PUT YOUR KEY HERE

let movieData = []; // This stores the CSV data so we don't have to reload it

// --- 1. INITIALIZE DATA (Loads once when page opens) ---
async function initMatrix() {
    try {
        const response = await fetch('movies.csv');
        const text = await response.text();
        // Splits by line and cleans up hidden carriage returns (\r)
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
        
        // Parse CSV columns correctly (handles titles with commas like "Toy Story, The")
        movieData = rows.slice(1).map(row => {
            return row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/"/g, '').trim());
        });

        console.log("Matrix Data Loaded:", movieData.length, "movies");
        
        // If we are on the dashboard, show Action movies by default
        if (document.getElementById('movieGrid')) {
            renderDashboard('Action');
        }
    } catch (e) {
        console.error("Matrix Sync Error:", e);
    }
}

// --- 2. DASHBOARD RENDERER (Uses the cached movieData) ---
async function renderDashboard(genre = 'Action') {
    const grid = document.getElementById('movieGrid');
    const titleHeader = document.getElementById('recommendationTitle');
    if (!grid) return;

    // Update Pill UI (Active state)
    document.querySelectorAll('.genre-pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.trim().toLowerCase() === genre.toLowerCase()) btn.classList.add('active');
    });

    if (titleHeader) titleHeader.innerHTML = `Recommended <span class="neon-text">${genre}</span>`;
    grid.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-info"></div><p class="neon-text mt-3">Scanning Matrix...</p></div>';

    // FILTER: Find movies where the genre column contains the selected genre
    const filtered = movieData.filter(m => {
        if (!m[2]) return false;
        return m[2].toLowerCase().includes(genre.toLowerCase());
    }).sort(() => 0.5 - Math.random()).slice(0, 8);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center p-5"><p class="text-secondary">No matches found. Check your CSV column for ' + genre + '</p></div>';
        return;
    }

    // RENDER CARDS
    let html = '';
    for (let m of filtered) {
        try {
            // Clean title (removes the year "(1995)" for better API results)
            const cleanTitle = m[1].replace(/\s\(\d{4}\)/, "").trim();
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${API_KEY}`);
            const data = await res.json();
            
            const poster = (data.Response === "True" && data.Poster !== "N/A") ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
            
            html += `
                <div class="col-6 col-md-3 mb-4">
                    <div class="movie-card glass-panel p-2 h-100 d-flex flex-column" onclick="goToDetails('${m[1].replace(/'/g, "\\'")}', '${m[0]}')">
                        <img src="${poster}" class="img-fluid rounded mb-2" style="height:300px; object-fit:cover;">
                        <h6 class="text-truncate fw-bold text-white px-1 m-0">${m[1]}</h6>
                        <small class="text-info px-1 mb-2">${data.Year || 'Movie'}</small>
                        <div class="mt-auto">
                           <button class="btn btn-neon btn-sm w-100 mb-2">VIEW DETAILS</button>
                           <button class="btn btn-outline-info btn-sm w-100" onclick="event.stopPropagation(); addToWatchlist('${m[1].replace(/'/g, "\\'")}', '${poster}')">+ WATCHLIST</button>
                        </div>
                    </div>
                </div>`;
        } catch (e) { console.error(e); }
    }
    grid.innerHTML = html;
}

// --- 3. WATCHLIST LOGIC ---
function addToWatchlist(title, poster) {
    let list = JSON.parse(localStorage.getItem('myWatchlist') || '[]');
    if (!list.find(m => m.title === title)) {
        list.push({ title, poster });
        localStorage.setItem('myWatchlist', JSON.stringify(list));
        alert(`${title} added to Matrix Watchlist!`);
    } else {
        alert("Already in your Watchlist.");
    }
}

// --- 4. NAVIGATION ---
function goToDetails(title, id) {
    localStorage.setItem('selectedMovie', title);
    localStorage.setItem('selectedId', id);
    window.location.href = 'details.html';
}

function enterSystem() {
    const user = document.getElementById('username').value;
    if(user) { 
        localStorage.setItem('matrixUser', user);
        window.location.href = 'dashboard.html'; 
    }
}

// --- START SYSTEM ---
window.onload = initMatrix;