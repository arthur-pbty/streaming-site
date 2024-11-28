document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  fetch('/users', {
      headers: {
          'Authorization': token
      }
  })
  .then(response => response.json())
  .then(users => {
      const usersList = document.getElementById('users-list');
      users.forEach(user => {
          const userElement = document.createElement('div');
          userElement.classList.add('user');
          userElement.innerHTML = `
              <p>${user.email} - ${user.status}</p>
              <button class="approve-button" data-id="${user.id}">Approuver</button>
              <button class="delete-button" data-id="${user.id}">Supprimer</button>
              <button class="admin-button" data-id="${user.id}">Rendre Admin</button>
          `;
          usersList.appendChild(userElement);
      });

      document.querySelectorAll('.approve-button').forEach(button => {
          button.addEventListener('click', () => {
              const userId = button.getAttribute('data-id');
              fetch('/approve', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token
                  },
                  body: JSON.stringify({ userId })
              })
              .then(response => response.json())
              .then(data => {
                  alert(data.message);
                  window.location.reload();
              });
          });
      });

      document.querySelectorAll('.delete-button').forEach(button => {
          button.addEventListener('click', () => {
              const userId = button.getAttribute('data-id');
              fetch('/delete', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token
                  },
                  body: JSON.stringify({ userId })
              })
              .then(response => response.json())
              .then(data => {
                  alert(data.message);
                  window.location.reload();
              });
          });
      });

      document.querySelectorAll('.admin-button').forEach(button => {
          button.addEventListener('click', () => {
              const userId = button.getAttribute('data-id');
              fetch('/make-admin', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token
                  },
                  body: JSON.stringify({ userId })
              })
              .then(response => response.json())
              .then(data => {
                  alert(data.message);
                  window.location.reload();
              });
          });
      });
  });
  
  const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});