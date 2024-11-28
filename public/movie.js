document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieTitle = urlParams.get('title');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Vous devez avoir un compte pour voir ce film.');
        window.location.href = 'login.html';
        return;
    }

    fetch('/users/me', {
        headers: {
            'Authorization': token
        }
    })
    .then(response => response.json())
    .then(user => {
        console.log(user)
        if (user.status !== 'approved' && user.status !== 'admin') {
            alert('Votre compte n\'a pas encore été approuvé par un administrateur.');
            window.location.href = 'index.html';
        } else {
            fetch(`/movie/${encodeURIComponent(movieTitle)}`, {
                headers: {
                    'Authorization': token
                }
            })
            .then(response => response.json())
            .then(movie => {
                const movieDetails = document.getElementById('movie-details');
                movieDetails.innerHTML = `
                    <h2>${movie.title}</h2>
                    <p>${movie.description}</p>
                    <img src="${movie.cover}" alt="${movie.title}">
                `;
                const movieSource = document.getElementById('movie-source');
                movieSource.src = movie.video;
                const movieVideo = document.getElementById('movie-video');
                movieVideo.load();
            });
        }
    });
});