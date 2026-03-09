const API_KEY = '8ffcf7f3'; // Replace with your OMDb API Key

// --- WATCHLIST LOGIC ---
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

// --- DASHBOARD RENDERER ---
async function renderDashboard(genre = 'Action') {
    const grid = document.getElementById('movieGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-info"></div><p class="neon-text mt-2">Scanning Matrix...</p></div>';

    try {
        const response = await fetch('movies.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        
        const movies = rows.map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
        const filtered = movies.filter(m => m[2] && m[2].toLowerCase().includes(genre.toLowerCase())).slice(0, 8);

        let html = '';
        for (let m of filtered) {
            const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(m[1].split(' (')[0])}&apikey=${API_KEY}`);
            const data = await res.json();
            const poster = data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x450';
            
            html += `
                <div class="col-6 col-md-3 mb-4">
                    <div class="movie-card glass-panel p-2 h-100 d-flex flex-column">
                        <img src="${poster}" class="img-fluid rounded mb-2" style="height:300px; object-fit:cover;">
                        <h6 class="text-truncate fw-bold text-white px-1">${m[1]}</h6>
                        <div class="mt-auto">
                            <button class="btn btn-neon btn-sm w-100 mb-2" onclick="goToDetails('${m[1].replace(/'/g, "\\'")}', '${m[0]}')">VIEW DETAILS</button>
                            <button class="btn btn-outline-info btn-sm w-100" onclick="addToWatchlist('${m[1].replace(/'/g, "\\'")}', '${poster}')">+ WATCHLIST</button>
                        </div>
                    </div>
                </div>`;
        }
        grid.innerHTML = html || '<p class="text-center">No movies found in this sector.</p>';
    } catch (e) { grid.innerHTML = "Matrix Error."; }
}

function goToDetails(title, id) {
    localStorage.setItem('selectedMovie', title);
    localStorage.setItem('selectedId', id);
    window.location.href = 'details.html';
}

function enterSystem() {
    const user = document.getElementById('username').value;
    if(user) { window.location.href = 'dashboard.html'; }
}