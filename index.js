// Requirements
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');


// Importing database modules
const mongoose = require('mongoose');
const Models = require('./models.js');
const { ObjectId } = require('mongoose').Types;

// Mongoose Models
const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/movieDB');
/**
 * Connect to database
 */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

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
 * Cross-Origin Resource Sharing 
 */
const cors = require('cors');
app.use(cors());

/**
 * Importing authentication and passport module
 */
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport');


/**
 * Create write stream to "log.txt"
 */
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
   flags: 'a',
});

/**
 * Setting up morgan
 * @param {String} 'combined' - The format in which the requests are logged to "log.txt".
 * @param {Object} { stream: accessLogStream } - An object specifying the stream where logs are written.
 * @param {String} 'common' - The format in which the requests are logged to console.
 */
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('common'));

/**
 * Serve static files from folder 'public'
 * @param {String} 'public' - The directory from which static files are served.
 */
app.use(express.static('public'));

// #region Endpoints

/**
 * Fetches all movies.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.get('/movies',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Fetch all movies
         const movies = await Movies.find();

         // Send the list of movies in the response
         res.status(200).json(movies);
      } catch (error) {
         // Handle any errors that occur during the operation
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Fetches movie data by title.
 * @param {Object} req - The request object.
 * @param {string} req.params.title - The title of the movie to fetch data for.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.get('/movies/:title/',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Query the database to find the movie by title
         const movie = await Movies.findOne({ title: req.params.title });

         // If the movie is found, send its data in the response
         if (movie) {
            res.status(200).json(movie);
         } else {
            // If the movie is not found, send a 404 Not Found response
            res.status(404).send('Movie not found');
         }
      } catch (error) {
         // Handle any errors that occur during the operation
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Fetches the description of a genre by name.
 * @param {Object} req - The request object.
 * @param {string} req.params.name - The name of the genre to fetch description for.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.get('/genres/:name/',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Query the database to find a movie with the specified genre
         const movie = await Movies.findOne({ 'genres.name': req.params.name });

         // If the movie is found, find the genre with the specified name
         if (movie) {
            const genre = movie.genres.find((genre) => {
               return genre.name.toLowerCase() === req.params.name.toLowerCase();
            });

            // If the genre is found, send its description in the response
            if (genre) {
               res.status(200).json({ description: genre.description });
            } else {
               // If the genre is not found, send a 404 Not Found response
               res.status(404).send('Genre not found');
            }
         } else {
            // If the movie is not found, send a 404 Not Found response
            res.status(404).send('Movie not found');
         }
      } catch (error) {
         // Handle any errors that occur during the operation
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Fetches a director by name.
 * @param {Object} req - The request object.
 * @param {string} req.params.name - The name of the director to fetch.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.get('/directors/:name',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Query the database to find a movie with the specified director
         const movie = await Movies.findOne({ 'director.name': req.params.name });

         // If the movie is found, send the director's information in the response
         if (movie) {
            res.status(200).json(movie.director);
         } else {
            // If the movie is not found, send a 404 Not Found response
            res.status(404).send('Director not found');
         }
      } catch (error) {
         // Handle any errors that occur during the operation
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);
;

/**
 * Validation logic for user registration.
 * @type {Array<function>}
 */
const validationLogic = [
   /**
     * Checks if the first name is provided and not empty.
     */
   check('firstname', 'First name is required').trim().notEmpty(),

   /**
    * Checks if the last name is provided and not empty.
    */
   check('lastname', 'Last name is required').trim().notEmpty(),

   /**
    * Checks if the password is provided, not empty, and at least 8 characters long.
    */
   check('password', 'Password must be at least 8 characters long.').trim().notEmpty().isLength({ min: 8 }),

   /**
    * Checks if the email is provided, appears to be valid, and normalizes it.
    */
   check('email', 'Email does not appear to be valid').trim().isEmail().normalizeEmail(),

   /**
    * Checks if the birthday is in the correct format (YYYY-MM-DD) and within valid ranges.
    * It is optional, but if provided, must be a valid date.
    */
   check('birthday')
      .optional({ checkFalsy: true })
      .custom((value) => {
         if (value) {
            const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormatRegex.test(value)) {
               throw new Error('Invalid date format for birthday');
            }
            const [year, month, day] = value.split('-').map(Number);
            if (month < 1 || month > 12) {
               throw new Error('Month must be between 01 and 12');
            }
            if (day < 1 || day > 31) {
               throw new Error('Day must be between 01 and 31');
            }
         }
         return true;
      })
      .toDate()
];

/**
 * Registers a new user with the provided user data.
 * @param {Object} userData - The user data to register.
 * @param {string} userData.firstname - The first name of the user.
 * @param {string} userData.lastname - The last name of the user.
 * @param {string} userData.password - The password of the user.
 * @param {string} userData.email - The email of the user.
 * @param {string} [userData.birthday] - The birthday of the user (optional).
 * @returns {Promise<Object>} A promise that resolves with the newly registered user object.
 * @throws {Error} If a user with the same email already exists, or if an error occurs during user registration.
 */
async function registerUser(userData) {
   const { firstname, lastname, password, email, birthday } = userData;

   // Check if user already exists
   const existingUser = await Users.findOne({ email });
   if (existingUser) {
      throw new Error(`User '${email}' already exists.`);
   }

   // Hash password
   const hashedPassword = await Users.hashPassword(password);

   // Create new user
   const newUser = await Users.create({
      firstname,
      lastname,
      password: hashedPassword,
      email,
      birthday,
   });

   return newUser;
}

/**
 * Handles user registration requests.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
async function handleUserRegistration(req, res) {
   try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(422).json({ errors: errors.array() });
      }

      // Use separate function to handle user creation and password hashing
      const result = await registerUser(req.body);
      res.status(201).json(result);
   }
   catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
   }
}

/**
 * Express route for registering a new user.
 * @type {('/users', function[])}
 */
app.post('/users', validationLogic, handleUserRegistration);

/**
 * Handles requests to update user data.
 * @param {Object} req - The request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.email - The email of the authenticated user.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.email - The email of the user to update.
 * @param {Object} req.body - The request body containing the updated user data.
 * @param {string} [req.body.firstname] - The updated first name of the user.
 * @param {string} [req.body.lastname] - The updated last name of the user.
 * @param {string} [req.body.password] - The updated password of the user.
 * @param {string} [req.body.email] - The updated email of the user.
 * @param {string} [req.body.birthday] - The updated birthday of the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.patch('/users/:email',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Ensure the authenticated user has permission to update this user's data
         if (req.user.email !== req.params.email) {
            return res.status(403).send('Permission denied.');
         }

         // Validate the request body fields
         const allowedUpdates = ['firstname', 'lastname', 'password', 'email', 'birthday'];
         const updates = Object.keys(req.body);
         const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
         if (!isValidOperation) {
            return res.status(400).send({ error: 'Invalid updates.' });
         }

         // If password is present in the request body, hash it
         if (req.body.password) {
            req.body.password = await Users.hashPassword(req.body.password, 10);
         }

         // Find the user by email and update the user data
         const updatedUser = await Users.findOneAndUpdate(
            { email: req.params.email },
            { $set: req.body },
            { new: true } // Return the updated document
         );

         // Check if the user was found and updated successfully
         if (updatedUser) {
            res.status(200).json(updatedUser);
         } else {
            res.status(404).send('User not found.');
         }
      } catch (error) {
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Adds a favorite movie to the user's account.
 * @param {Object} req - The request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.email - The email of the authenticated user.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.email - The email of the user.
 * @param {string} req.params.movieId - The ID of the movie to add to favorites.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.post('/users/:email/favoriteMovies/:movieId',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Ensure the authenticated user has permission to add favorites to this user's account
         if (req.user.email !== req.params.email) {
            return res.status(403).send('Permission denied');
         }

         // Check if the provided movie ID is a valid MongoDB ObjectId
         if (!ObjectId.isValid(req.params.movieId)) {
            return res.status(400).send('Invalid movie ID');
         }

         // Update the user's favorite movies list
         const updatedUser = await Users.findOneAndUpdate(
            { email: req.params.email },
            { $addToSet: { favoriteMovies: req.params.movieId } }, // Use $addToSet to avoid duplicate entries
            { new: true } // Return the updated document
         );

         // Check if the user was found and updated successfully
         if (updatedUser) {
            res.status(201).json(updatedUser);
         } else {
            res.status(404).send('User not found');
         }
      } catch (error) {
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Removes a favorite movie from the user's account.
 * @param {Object} req - The request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.email - The email of the authenticated user.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.email - The email of the user.
 * @param {string} req.params.movieId - The ID of the movie to remove from favorites.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.delete('/users/:email/favoriteMovies/:movieId',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Ensure the authenticated user has permission to remove favorites from this user's account
         if (req.user.email !== req.params.email) {
            return res.status(403).send('Permission denied');
         }

         // Check if the provided movie ID is a valid MongoDB ObjectId
         if (!ObjectId.isValid(req.params.movieId)) {
            return res.status(400).send('Invalid movie ID');
         }

         // Update the user's favorite movies list to remove the specified movie
         const updatedUser = await Users.findOneAndUpdate(
            { email: req.params.email },
            { $pull: { favoriteMovies: req.params.movieId } },
            { new: true } // Return the updated document
         );

         // Check if the user was found and updated successfully
         if (updatedUser) {
            res.status(200).json(updatedUser);
         } else {
            res.status(404).send('User not found');
         }
      } catch (error) {
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

/**
 * Deletes a user account.
 * @param {Object} req - The request object.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.email - The email of the authenticated user.
 * @param {Object} req.params - The route parameters.
 * @param {string} req.params.email - The email of the user account to delete.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} A promise that resolves once the response is sent.
 */
app.delete('/users/:email',
   passport.authenticate('jwt', { session: false }),
   async (req, res) => {
      try {
         // Ensure the authenticated user has permission to delete the specified user account
         if (req.user.email !== req.params.email) {
            return res.status(403).send('Permission denied.');
         }

         // Delete the user account
         const deletedUser = await Users.findOneAndDelete({ email: req.params.email });

         // Check if the user account was found and deleted successfully
         if (!deletedUser) {
            res.status(404).send(req.params.email + ' was not found.');
         } else {
            res.status(200).send(req.params.email + ' was deleted.');
         }
      } catch (error) {
         console.error(error);
         res.status(500).send('Error: ' + error.message);
      }
   }
);

app.get('/', (req, res) => {
   res.send(
      'Welcome to MYFLIX - your favorite source of information about the movies you love.',
   );
});

// #endregion

// Error handling
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).send('Something broke!');
});

// Listen on port
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
   console.log('Listening on Port ' + port);
});
