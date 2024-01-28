// Importing movie data
const movieData = require('./data/movieData.json');
// Requirements
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Dynamic port configuration
const port = process.env.PORT || 8080;

// Create the Express application
const app = express();

// create a write stream (in append mode) to a file
// called "log.txt", which is created in the same directory as this very file.
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

// Setup the logger to write to "log.txt"
app.use(morgan('myformat', { stream: accessLogStream }));
app.use(morgan('common'));

// Setting default file directory for serving static files
app.use(express.static('public'));

// Response for /movies - json data about top 10 movies
app.get('/movies', (req, res) => {
  res.json(movieData);
});

// Response for index
app.get('/', (req, res) => {
  res.send(
    'Welcome to MYFLIX - your favorite source of inforkmation about the movies you love.',
  );
});

// Error handling
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for requests
app.listen(port, () => {
  console.log(`Your app is listening on port ${port}.`);
});
