document.addEventListener('DOMContentLoaded', () => {
    fetch('/movies')
        .then(response => response.json())
        .then(movies => {
            const moviesGrid = document.getElementById('movies-grid');
            movies.forEach(movie => {
                const movieElement = document.createElement('div');
                movieElement.classList.add('movie');
                movieElement.innerHTML = `
                    <img src="${movie.cover}" alt="${movie.title}">
                    <h3>${movie.title}</h3>
                `;
                movieElement.addEventListener('click', () => {
                    window.location.href = `movie.html?title=${encodeURIComponent(movie.title)}`;
                });
                moviesGrid.appendChild(movieElement);
            });
        });
});