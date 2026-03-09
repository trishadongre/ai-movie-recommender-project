const API_KEY = '8ffcf7f3'; 

// State and Data
let movieData = [];
let ratingData = [];
let linkData = [];

async function initMatrix() {
    try {
        const [mRes, rRes, lRes] = await Promise.all([
            fetch('movies.csv').then(r => r.text()),
            fetch('ratings.csv').then(r => r.text()),
            fetch('links.csv').then(r => r.text())
        ]);

        movieData = parseCSV(mRes);
        ratingData = parseCSV(rRes);
        linkData = parseCSV(lRes);

        renderDashboard(); 
    } catch (e) { console.error("Matrix Sync Failed", e); }
}

function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    return lines.slice(1).map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
}

async function renderDashboard(genreFilter = 'Horror') {
    const grid = document.getElementById('movieGrid');
    const titleHeader = document.getElementById('recommendationTitle');
    if (!grid) return;

    titleHeader.innerHTML = `Recommended <span class="neon-text">${genreFilter}</span>`;
    grid.innerHTML = '<div class="neon-text">Calculating User-Item Patterns...</div>';

    // Logic: Filter by genre and sort by "Popularity" (number of ratings in ratings.csv)
    let filtered = movieData.filter(m => m[2] && m[2].includes(genreFilter));
    
    // Sort by popularity (how many times the movieId appears in ratings)
    filtered.sort((a, b) => {
        const countA = ratingData.filter(r => r[1] === a[0]).length;
        const countB = ratingData.filter(r => r[1] === b[0]).length;
        return countB - countA;
    });

    let html = '';
    for (let m of filtered.slice(0, 8)) {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(m[1].split(' (')[0])}&apikey=${API_KEY}`);
        const data = await res.json();
        const poster = data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x450';
        
        html += `
            <div class="col-md-3 mb-4">
                <div class="movie-card" onclick="goToDetails('${m[1].replace(/'/g, "\\'")}', '${m[0]}')">
                    <img src="${poster}" class="img-fluid rounded">
                    <div class="card-overlay">
                        <h6 class="fw-bold">${m[1]}</h6>
                    </div>
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

function login() {
    const user = document.getElementById('usernameInput').value;
    if(user) {
        localStorage.setItem('matrixUser', user);
        window.location.href = 'index.html#dashboard'; // Or hide login div
        document.getElementById('loginOverlay').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', initMatrix);