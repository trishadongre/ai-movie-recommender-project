const OMDB_API_KEY = '8ffcf7f3';
const CSV_URL = 'movies.csv';

// State Management
let allMovies = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

async function init() {
    const response = await fetch(CSV_URL);
    const data = await response.text();
    const rows = data.split('\n').slice(1);
    allMovies = rows.map(row => {
        const cols = row.split(',');
        return { title: cols[1], genres: cols[2] };
    }).filter(m => m.title);
    
    renderMovies(allMovies.slice(0, 8)); // Initial Trending
}

async function getPoster(title) {
    const cleanTitle = title.split(' (')[0].trim();
    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${OMDB_API_KEY}`);
        const data = await res.json();
        return data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x450';
    } catch {
        return 'https://via.placeholder.com/300x450';
    }
}

async function renderMovies(movieArray) {
    const grid = document.getElementById('movieGrid');
    grid.innerHTML = '<div class="text-center w-100"><p class="neon-text">Analyzing Matrix...</p></div>';
    
    let html = '';
    for (let m of movieArray) {
        const poster = await getPoster(m.title);
        html += `
            <div class="col-6 col-md-3">
                <div class="movie-card text-center">
                    <div class="poster-container"><img src="${poster}" class="poster-img"></div>
                    <h6 class="fw-bold mt-2 text-truncate px-2">${m.title}</h6>
                    <p class="small text-secondary">${m.genres.replace('|', ' • ')}</p>
                    <button class="btn btn-neon btn-sm mb-3" onclick="viewDetails('${m.title}')">VIEW DETAILS</button>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

function filterByGenre(genre) {
    const filtered = allMovies.filter(m => m.genres.includes(genre)).slice(0, 8);
    renderMovies(filtered);
}

function searchMovie() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allMovies.filter(m => m.title.toLowerCase().includes(query)).slice(0, 8);
    renderMovies(filtered);
}

function viewDetails(title) {
    localStorage.setItem('currentMovie', title);
    window.location.href = 'details.html';
}

init();