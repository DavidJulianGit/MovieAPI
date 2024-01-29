// Importing movie data
const movieData = require('./data/movieData.json');
// Requirements
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const bodyParser = require('body-parser');

/**
 * The dynamic port number configuration.
 * @type {number}
 */
const port = process.env.PORT || 8080;

/**
 * The Express application instance.
 * @type {import('express')}
 */
const app = express();

/**
 * Create a write stream (in append mode) to a file called "log.txt",
 * which is created in the same directory as this very file.
 * @type {import('fs').WriteStream}
 */
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

// Setup the logger to write to "log.txt"
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('common'));

// Parse requests body data
app.use(bodyParser.json());

// Setting default file directory for serving static files
app.use(express.static('public'));

// #region Endpoints

/**
 * Get the title of all movies.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/movies', (req, res) => {
  let movieTitles = [];

  movieData.movies.forEach((movie) => {
    movieTitles.push(movie.title);
  });

  res.json(movieTitles);
});

/**
 * Get all data for a specific movie.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/movies/:title/', (req, res) => {
  let title = req.params.title;

  // Find property
  let movie = movieData.movies.find((movie) => {
    return movie.title.toLowerCase() === title.toLowerCase();
  });
  if (movie) {
    res.json(movie);
  } else {
    res.send(`Error: couldn't find a movie called "${req.params.title}"`);
  }
});

/**
 * Get description of a genre by name
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/genres/:name/', (req, res) => {
  let game = req.params.name;

  // Find property
  let genre = movieData.genres.find((genre) => {
    return genre.name.toLowerCase() === name.toLowerCase();
  });
  if (genre) {
    res.json(genre);
  } else {
    res.send(`Error: couldn't find a genre called "${name}"`);
  }
});

/**
 * Get the specified property(data) of a specific movie.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/movies/:title/:property', (req, res) => {
  let property = req.params.property;

  // Find property
  let movie = movieData.movies.find((movie) => {
    return movie.title.toLowerCase() === req.params.title.toLowerCase();
  });
  if (movie) {
    if (movie[property]) {
      res.json(movie[property]);
    } else {
      res
        .status(404)
        .send(`Error: could not find "${property}" for "${req.params.title}"`);
    }
  } else {
    res.send(`Error: couldn't find a movie called ${req.params.title}`);
  }
});

/**
 * Get data for a specific director.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/directors/:name', (req, res) => {
  let directorName = req.params.name;

  // Find movies
  let director = movieData.directors.find((director) => {
    return director.name.toLowerCase() === directorName.toLowerCase();
  });
  if (director) {
    res.json(director);
  } else {
    res.send(`Error: couldn't find a director called "${directorName}"`);
  }
});

/**
 * Allow useres to register
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.post('/register', (req, res) => {
  // Username and password validaton
  // Create database entry
  // ...

  res.status(201).send('Sucessfully registered as ...');
});

/**
 * Allow useres to update their user data
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.put('/users/:userId', (req, res) => {
  // Update username in database //
  res.json({ message: 'User info updated successfully' });
});

/**
 * Allow users to add a movie to favorites
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.put('/users/:userId/favorites', (req, res) => {
  // Add movie to user's favorites in database
  res.json({ message: 'Movie added to favorites' });
});

/**
 * Allow users to remove a movie from favorites
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.delete('/users/:userId/favorites/:movieTitle', (req, res) => {
  // Remove movie from user's favorites in database
  res.json({ message: 'Movie removed from favorites' });
});

/**
 * Allow existing users to deregister
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.delete('/users/:userId', (req, res) => {
  // Delete user from database
  res.json({ message: 'Account sucessfully delted.' });
});

/**
 * Response for index.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/', (req, res) => {
  res.send(
    'Welcome to MYFLIX - your favorite source of information about the movies you love.',
  );
});

// #endregion

// Error handling
/**
 * Error handling middleware.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for requests
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}.`);
});
