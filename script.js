const API_KEY = '8ffcf7f3';

// 1. FAST LOGIN - No data loading here to prevent lag
function enterSystem() {
    const user = document.getElementById('username').value;
    if(user) {
        localStorage.setItem('matrixUser', user);
        window.location.href = 'dashboard.html';
    }
}

// 2. SMART DATA LOADER
async function fetchCSV(fileName, isLarge = false) {
    try {
        const response = await fetch(fileName);
        if (isLarge) {
            // Only take a tiny slice of the large file to keep it fast
            const reader = response.body.getReader();
            const { value } = await reader.read();
            return new TextDecoder().decode(value.slice(0, 100000)).split('\n');
        }
        const text = await response.text();
        return text.split('\n');
    } catch (e) { return []; }
}

// 3. DASHBOARD RENDERER
async function renderDashboard(genre = 'Horror') {
    const grid = document.getElementById('movieGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="neon-text p-5">Initializing Matrix...</div>';

    // Load movies (Small file)
    const movieRows = await fetchCSV('movies.csv');
    
    // Process movies quickly
    let movies = movieRows.slice(1).map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
    let filtered = movies.filter(m => m[2] && m[2].includes(genre)).slice(0, 8);

    let html = '';
    for (let m of filtered) {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(m[1].split(' (')[0])}&apikey=${API_KEY}`);
        const data = await res.json();
        const poster = data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x450';
        
        html += `
            <div class="col-md-3 mb-4">
                <div class="movie-card" onclick="goToDetails('${m[1].replace(/'/g, "\\'")}', '${m[0]}')">
                    <img src="${poster}" class="img-fluid rounded">
                    <div class="card-overlay"><h6>${m[1]}</h6></div>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

function goToDetails(title, id) {
    localStorage.setItem('selectedMovie', title);
    localStorage.setItem('selectedId', id);
    window.location.href = 'details.html';
}