const API_KEY ="f2c1c309"; // Replace with your actual OMDb API key
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const movieResults = document.getElementById("movie-results");

// Initialize the app
function init() {
  searchBtn.addEventListener("click", searchMovies);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchMovies();
  });
  
  // Load last search from localStorage (optional)
  const lastSearch = localStorage.getItem('lastSearch');
  if (lastSearch) {
    searchInput.value = lastSearch;
  }
}

// Main search function
async function searchMovies() {
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    showMessage("Please enter a movie title!", "error");
    return;
  }

  showMessage("Searching...", "loading");
  localStorage.setItem('lastSearch', searchTerm); // Save search term

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(searchTerm)}&apikey=${API_KEY}`
    );
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    console.log("API Response:", data);

    if (data.Response === "True") {
      displayMovies(data.Search);
    } else {
      showMessage(data.Error || "No movies found. Try another title!", "error");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showMessage("Failed to connect to movie database. Please try again later.", "error");
  }
}

// Display movie search results
function displayMovies(movies) {
  movieResults.innerHTML = movies.map(movie => `
    <div class="movie-card" data-id="${movie.imdbID}">
      <img src="${getPosterUrl(movie.Poster)}" 
           alt="${movie.Title}"
           onerror="this.src='https://via.placeholder.com/150x225?text=Poster+Not+Available'">
      <div class="movie-info">
        <h3>${movie.Title} (${movie.Year})</h3>
        <p>Type: ${movie.Type}</p>
        <div class="action-buttons">
          <button class="details-btn">View Details</button>
          <button class="watchlist-btn">+ Watchlist</button>
        </div>
      </div>
    </div>
  `).join("");

  // Add event listeners
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', showMovieDetails);
  });

  document.querySelectorAll('.watchlist-btn').forEach(btn => {
    btn.addEventListener('click', addToWatchlist);
  });
}

// Show detailed movie view
async function showMovieDetails(e) {
  const movieCard = e.target.closest('.movie-card');
  const imdbID = movieCard.dataset.id;
  
  showMessage("Loading details...", "loading");

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.Response === "True") {
      displayMovieDetails(data);
    } else {
      showMessage(data.Error || "Failed to load details", "error");
    }
  } catch (error) {
    console.error("Details fetch error:", error);
    showMessage("Error loading details", "error");
  }
}

// Display detailed movie information
function displayMovieDetails(movie) {
  movieResults.innerHTML = `
    <div class="movie-details">
      <div class="details-header">
        <img src="${getPosterUrl(movie.Poster, '300x450')}" 
             alt="${movie.Title}"
             onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Not+Available'">
        <div class="details-summary">
          <h2>${movie.Title} (${movie.Year})</h2>
          <div class="metadata">
            ${movie.Rated ? `<p><span class="label">Rated:</span> ${movie.Rated}</p>` : ''}
            <p><span class="label">Runtime:</span> ${movie.Runtime}</p>
            <p><span class="label">Genre:</span> ${movie.Genre}</p>
            ${movie.imdbRating ? `<p><span class="label">IMDb:</span> ${movie.imdbRating}/10</p>` : ''}
            ${movie.BoxOffice ? `<p><span class="label">Box Office:</span> ${movie.BoxOffice}</p>` : ''}
          </div>
        </div>
      </div>
      
      <div class="details-body">
        ${movie.Plot ? `<p class="plot">${movie.Plot}</p>` : ''}
        
        ${movie.Director ? `<p><span class="label">Director:</span> ${movie.Director}</p>` : ''}
        ${movie.Writer ? `<p><span class="label">Writer:</span> ${movie.Writer}</p>` : ''}
        ${movie.Actors ? `<p><span class="label">Actors:</span> ${movie.Actors}</p>` : ''}
        
        ${movie.Ratings && movie.Ratings.length ? `
          <div class="ratings">
            <h3>Ratings:</h3>
            ${movie.Ratings.map(rating => `
              <p><span class="label">${rating.Source}:</span> ${rating.Value}</p>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="details-footer">
        <button class="back-btn">← Back to Results</button>
        <button class="watchlist-btn">+ Add to Watchlist</button>
      </div>
    </div>
  `;

  // Add event listeners
  document.querySelector('.back-btn').addEventListener('click', searchMovies);
  document.querySelector('.watchlist-btn').addEventListener('click', () => {
    addToWatchlist(null, movie);
  });
}

// Add movie to watchlist
function addToWatchlist(e, movieData = null) {
  const movie = movieData || getMovieFromCard(e.target);
  
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  
  // Check if movie already exists
  if (!watchlist.some(item => item.imdbID === movie.imdbID)) {
    watchlist.push(movie);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showMessage(`${movie.Title} added to watchlist!`, "success");
  } else {
    showMessage(`${movie.Title} is already in your watchlist`, "info");
  }
}

// Helper function to get movie data from card
function getMovieFromCard(element) {
  const card = element.closest('.movie-card');
  return {
    Title: card.querySelector('h3').textContent.split(' (')[0],
    Year: card.querySelector('h3').textContent.match(/\((\d+)\)/)[1],
    imdbID: card.dataset.id,
    Poster: card.querySelector('img').src,
    Type: card.querySelector('p').textContent.replace('Type: ', '')
  };
}

// Helper function for poster URLs
function getPosterUrl(poster, size = '150x225') {
  if (poster === "N/A") {
    return `https://via.placeholder.com/${size}?text=No+Poster`;
  }
  return poster;
}

// Show status messages
function showMessage(message, type) {
  movieResults.innerHTML = `
    <div class="message ${type}">
      <p>${message}</p>
      ${type === 'loading' ? '<div class="loader"></div>' : ''}
    </div>
  `;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);