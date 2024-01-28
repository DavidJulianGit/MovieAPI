const movieData = require('./data/movieData.json');

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Logging Timestamps, req method, url, res code
app.use(morgan('common'));

// Setting default file directory for serving static files
app.use(express.static('public'));

// Response for /movies - json data about top 10 movies
app.get('/movies', (req, res, next) => {
  res.json(movieData);
  next();
});

// Response for index
app.get('/', (req, res, next) => {
  res.send(
    'Welcome to MYFLIX - your favorite source of information about the movies you love.',
  );
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
