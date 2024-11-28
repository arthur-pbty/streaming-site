document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
      alert('Vous devez être connecté pour accéder à votre profil.');
      window.location.href = 'login.html';
      return;
  }

  fetch('/profile', {
      headers: {
          'Authorization': token
      }
  })
  .then(response => response.json())
  .then(user => {
      const profileDetails = document.getElementById('profile-details');
      profileDetails.innerHTML = `
          <h2>Profil de ${user.email}</h2>
          <p>Status: ${user.status}</p>
      `;
  });
});