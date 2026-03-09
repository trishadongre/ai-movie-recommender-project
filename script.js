const API_KEY = '8ffcf7f3';

// Memory-Safe Data Loading
async function getMatrixData(fileName, limit = false) {
    try {
        const response = await fetch(fileName);
        if (!response.ok) return [];
        
        if (limit) {
            // Read only first chunk of large files (ratings.csv) to prevent crashing
            const reader = response.body.getReader();
            const { value } = await reader.read();
            const text = new TextDecoder().decode(value.slice(0, 1000000)); 
            return parseCSV(text);
        }
        const text = await response.text();
        return parseCSV(text);
    } catch (e) { return []; }
}

function parseCSV(text) {
    return text.split('\n')
               .filter(row => row.trim() !== '')
               .map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
}

// DASHBOARD LOGIC
async function renderDashboard(genre = 'Horror') {
    const grid = document.getElementById('movieGrid');
    const titleHeader = document.getElementById('recommendationTitle');
    if (!grid) return;

    titleHeader.innerHTML = `Recommended <span class="neon-text">${genre}</span>`;
    grid.innerHTML = '<div class="neon-text p-5">Analyzing Matrix Patterns...</div>';

    const movies = await getMatrixData('movies.csv');
    const ratings = await getMatrixData('ratings.csv', true);

    let filtered = movies.slice(1).filter(m => m[2] && m[2].includes(genre));
    
    // Simple Collaborative Logic: Sort by frequency in ratings
    filtered.sort((a, b) => {
        const countA = ratings.filter(r => r[1] === a[0]).length;
        const countB = ratings.filter(r => r[1] === b[0]).length;
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

// LOGIN LOGIC
function enterSystem() {
    const user = document.getElementById('username').value;
    if(user) {
        localStorage.setItem('matrixUser', user);
        window.location.href = 'dashboard.html';
    }
}