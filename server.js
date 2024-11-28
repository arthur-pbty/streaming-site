const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/movies', express.static(path.join(__dirname, 'movies')));

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const checkApproval = (req, res, next) => {
  db.get(`SELECT status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err || !user || (user.status !== 'approved' && user.status !== 'admin')) {
          return res.status(403).json({ message: 'Votre compte n\'a pas encore été approuvé par un administrateur.' });
      }
      next();
  });
};

const checkAdmin = (req, res, next) => {
    db.get(`SELECT status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user || user.status !== 'admin') {
            return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
        }
        next();
    });
};

// Route pour afficher la liste des films
app.get('/movies', (req, res) => {
    const moviesDir = path.join(__dirname, 'movies');
    fs.readdir(moviesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la lecture des films' });
        }

        const movies = files.map(file => {
            const moviePath = path.join(moviesDir, file);
            const movieData = JSON.parse(fs.readFileSync(path.join(moviePath, 'info.json')));
            return {
                title: movieData.title,
                cover: `/movies/${file}/cover.jpg`
            };
        });

        res.json(movies);
    });
});

app.get('/movie/:title', (req, res) => {
    const movieTitle = req.params.title;
    const moviesDir = path.join(__dirname, 'movies');
    fs.readdir(moviesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la lecture des films' });
        }

        const movieFile = files.find(file => {
            const moviePath = path.join(moviesDir, file);
            const movieData = JSON.parse(fs.readFileSync(path.join(moviePath, 'info.json')));
            return movieData.title === movieTitle;
        });

        if (!movieFile) {
            return res.status(404).json({ message: 'Film non trouvé' });
        }

        const moviePath = path.join(moviesDir, movieFile);
        const movieData = JSON.parse(fs.readFileSync(path.join(moviePath, 'info.json')));
        movieData.cover = `/movies/${movieFile}/cover.jpg`;
        movieData.video = `/movies/${movieFile}/video.mp4`;

        res.json(movieData);
    });
});

// Route pour gérer l'inscription des utilisateurs
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], function(err) {
      if (err) {
          return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
      }

      const userId = this.lastID;
      const token = jwt.sign({ id: userId }, 'secret_key', { expiresIn: '1h' });
      res.status(201).json({ message: 'Utilisateur inscrit avec succès', token });
  });
});

// Route pour gérer la connexion des utilisateurs
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token });
    });
});

app.get('/users/me', authenticateToken, (req, res) => {
  db.get(`SELECT email, status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur' });
    }
    res.json(user);
  });
});

// Route pour récupérer tous les utilisateurs
app.get('/users', authenticateToken, checkAdmin, (req, res) => {
  db.all(`SELECT id, email, status FROM users`, (err, users) => {
      if (err) {
          return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
      }
      res.json(users);
  });
});

// Route pour approuver un utilisateur
app.post('/approve', authenticateToken, checkAdmin, (req, res) => {
  const { userId } = req.body;
  db.run(`UPDATE users SET status = 'approved' WHERE id = ?`, [userId], function(err) {
      if (err) {
          return res.status(500).json({ message: 'Erreur lors de l\'approbation de l\'utilisateur' });
      }
      res.json({ message: 'Utilisateur approuvé avec succès' });
  });
});

// Route pour supprimer un utilisateur
app.post('/delete', authenticateToken, checkAdmin, (req, res) => {
  const { userId } = req.body;
  db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
      if (err) {
          return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
      }
      res.json({ message: 'Utilisateur supprimé avec succès' });
  });
});

// Route pour promouvoir un utilisateur en administrateur
app.post('/make-admin', authenticateToken, checkAdmin, (req, res) => {
  const { userId } = req.body;
  db.run(`UPDATE users SET status = 'admin' WHERE id = ?`, [userId], function(err) {
      if (err) {
          return res.status(500).json({ message: 'Erreur lors de la promotion de l\'utilisateur' });
      }
      res.json({ message: 'Utilisateur promu administrateur avec succès' });
  });
});

// Route pour lire les fichiers vidéo
app.get('/video/:filename', authenticateToken, checkApproval, (req, res) => {
  const filePath = path.join(__dirname, 'movies', req.params.filename, 'video.mp4');
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
  } else {
      const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/profile', authenticateToken, (req, res) => {
  db.get(`SELECT email, status FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err || !user) {
          return res.status(500).json({ message: 'Erreur lors de la récupération des informations utilisateur' });
      }
      res.json(user);
  });
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});