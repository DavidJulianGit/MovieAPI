// Requirements
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Importing database modules
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
mongoose.connect('mongodb://localhost:27017/movieDB');

/**
 * The dynamic port number configuration
 */
const port = process.env.PORT || 8080;

/**
 * Create the web server
 */
const app = express();

/**
 * Middleware to parse incoming request bodies as JSON.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Create a write stream to "log.txt"
 */
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

/**
 * Setting up Morgan middleware to log requests in combined format to "log.txt" and common format to console.
 * @param {String} 'combined' - The format in which the requests are logged to "log.txt".
 * @param {Object} { stream: accessLogStream } - An object specifying the stream where logs are written.
 * @param {String} 'common' - The format in which the requests are logged to console.
 */
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('common'));

/**
 * Middleware to serve static files from the 'public' directory.
 * @param {String} 'public' - The directory from which static files are served.
 */
app.use(express.static('public'));

// #region Endpoints

/**
 * Get the title of all movies.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/movies', async (req, res) => {
  await Movies.find()
    .then((movies) => {
      console.log(movies);
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get all data for a specific movie.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/movies/:title/', async (req, res) => {
  await Movies.findOne({ title: req.params.title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get description of a genre by name
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/genres/:name/', async (req, res) => {
  await Movies.findOne({ 'genres.name': req.params.name })
    .then((movie) => {
      console.log(movie);
      const genre = movie.genres.find((genre) => {
        return genre.name.toLowerCase() === req.params.name.toLowerCase();
      });
      res.status(201).json(genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Get data for a specific director.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.get('/director/:name', async (req, res) => {
  await Movies.findOne({ 'director.name': req.params.name })
    .then((movie) => {
      res.status(201).json(movie.director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Allow useres to register
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.post('/register', async (req, res) => {
  await Users.findOne({ email: req.body.email })
    .then((user) => {
      // if user already exists, return
      if (user) {
        return res.status(400).send(req.body.email + ' already exists');
      }
      // else create new user
      else {
        Users.create({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/**
 * Allow useres to update their user data
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.patch('/users/:email', async (req, res) => {
  await Users.findOneAndUpdate(
    { email: req.params.email },
    {
      $set: {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: req.body.password,
        email: req.body.email,
        birthday: req.body.birthday,
      },
    },
    { new: true }, // This line makes sure that the updated document is returned
  )
    .then((updatedUser) => {
      if (updatedUser) {
        res.status(201).json(updatedUser);
      } else {
        res.status(400).send('Error: user not found.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Allow users to add a movie to favorites
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.post('/users/:email/favoriteMovies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { email: req.params.email },
    {
      $push: { favoriteMovies: req.params.MovieID },
    },
    { new: true }, // This line makes sure that the updated document is returned
  )
    .then((updatedUser) => {
      res.status(201).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Allow users to remove a movie from favorites
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.delete('/users/:email/favoriteMovies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { email: req.params.email },
    {
      $pull: { favoriteMovies: req.params.MovieID },
    },
    { new: true }, // This line makes sure that the updated document is returned
  )
    .then((updatedUser) => {
      res.status(201).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Allow existing users to deregister
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 */
app.delete('/users/:email', async (req, res) => {
  await Users.findOneAndDelete({ email: req.params.email })
    .then((user) => {
      if (!user) {
        res.status(404).send(req.params.email + ' was not found');
      } else {
        res.status(200).send(req.params.email + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
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

/**
 * Error handling
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

/**
 * listen for incoming requests on the specified port.
 * @param {number} port - The port number on which the server will listen for incoming requests.
 * @param {Function} callback - A callback function that is executed when the server starts listening.
 */
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}.`);
});
