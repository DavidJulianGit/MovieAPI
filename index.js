const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Models = require('./models.js');
const { ObjectId } = require('mongoose').Types;

// Mongoose Models
const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cors = require('cors');

// Define allowed origins for CORS
let allowedOrigins = [
	'http://localhost:8080',
	'http://localhost:1234',
	'http://localhost:4200',
	'https://davidsmyflix.netlify.app',
	'https://davidjuliangit.github.io'
];

// CORS configuration
app.use(
	cors({
		origin: (origin, callback) => {
			console.log('Incoming origin:', origin);
			if (!origin) return callback(null, true);

			if (allowedOrigins.indexOf(origin) === -1) {
				let message =
					'The CORS policy for this application doesn’t allow access from origin ' + origin;
				return callback(new Error(message), false);
			}
			return callback(null, true);
		}
	})
);

// Import authentication and Passport configuration modules.
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport');

// Setup logging to "log.txt" file
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a'
});

// Morgan middleware setup for request logging
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('common'));

app.use(express.static('public'));

// #region Endpoints

/**
 * Retrieves a list of all movies.
 * Requires JWT authentication.
 *
 * @route GET /movies
 * @group Movies - Operations related to movies
 * @security JWT
 * @returns {Array.<Object>} 200 - An array of movie objects
 * @returns {string} 500 - Internal server error
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const movies = await Movies.find();
		res.status(200).json(movies);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

/**
 * Retrieves details of a movie by its title.
 * Requires JWT authentication.
 *
 * @route GET /movies/{title}
 * @group Movies - Operations related to movies
 * @security JWT
 * @param {string} title.path.required - The title of the movie to retrieve
 * @returns {Object} 200 - The movie object matching the title
 * @returns {string} 404 - Movie not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.get('/movies/:title/', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const movie = await Movies.findOne({ title: req.params.title });

		if (movie) {
			res.status(200).json(movie);
		} else {
			res.status(404).send('Movie not found');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

/**
 * Retrieves the description of a genre by its name.
 * Requires JWT authentication.
 *
 * @route GET /genres/{name}
 * @group Genres - Operations related to genres
 * @security JWT
 * @param {string} name.path.required - The name of the genre to retrieve
 * @returns {Object} 200 - The description of the genre
 * @returns {string} 404 - Genre or movie not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.get('/genres/:name/', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const movie = await Movies.findOne({ 'genres.name': req.params.name });

		if (movie) {
			const genre = movie.genres.find(genre => {
				return genre.name.toLowerCase() === req.params.name.toLowerCase();
			});

			if (genre) {
				res.status(200).json({ description: genre.description });
			} else {
				res.status(404).send('Genre not found.');
			}
		} else {
			res.status(404).send('Movie not found.');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

/**
 * Retrieves information about a movie director by name.
 * Requires JWT authentication.
 *
 * @route GET /directors/{name}
 * @group Directors - Operations related to movie directors
 * @security JWT
 * @param {string} name.path.required - The name of the director to retrieve
 * @returns {Object} 200 - Information about the director
 * @returns {string} 404 - Director or movie not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const movie = await Movies.findOne({
			'director.name': req.params.name
		});

		if (movie) {
			res.status(200).json(movie.director);
		} else {
			res.status(404).send('Director not found.');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

/**
 * Registers a new user with the provided user data.
 * Checks if the user already exists, hashes the password, and creates a new user.
 *
 * @param {Object} userData - The user data to register.
 * @param {string} userData.firstname - The first name of the user.
 * @param {string} userData.lastname - The last name of the user.
 * @param {string} userData.password - The password of the user.
 * @param {string} userData.email - The email address of the user.
 * @param {Date} userData.birthday - The birthday of the user.
 * @throws {Error} If the user with the provided email already exists.
 * @throws {Error} If an error occurs while hashing the password or creating the user.
 */
async function registerUser(userData) {
	const { firstname, lastname, password, email, birthday } = userData;

	const existingUser = await Users.findOne({ email });
	if (existingUser) {
		throw new Error(`User '${email}' already exists.`);
	}

	const hashedPassword = await Users.hashPassword(password);

	const newUser = await Users.create({
		firstname,
		lastname,
		password: hashedPassword,
		email,
		birthday
	});

	return newUser;
}

/**
 * Handles user registration based on provided user data.
 * Validates the input fields (firstname, lastname, password, email, birthday),
 * creates a new user if input is valid, and responds with appropriate HTTP status.
 *
 * @route POST /users
 * @param {Object} req - The request object containing user registration data.
 * @param {Object} req.body - The request body containing user registration details.
 * @param {string} req.body.firstname - The first name of the user.
 * @param {string} req.body.lastname - The last name of the user.
 * @param {string} req.body.password - The password of the user (at least 8 characters long).
 * @param {string} req.body.email - The email address of the user.
 * @param {string} [req.body.birthday] - The birthday of the user (optional, format: YYYY-MM-DD).
 * @param {Object} res - The response object used to send HTTP responses.
 * @returns {Object} 201 - On successful registration, returns the created user object.
 * @returns {Object} 422 - On validation errors, returns an array of validation errors.
 * @returns {Object} 500 - On internal server error, returns an object with key "message".
 */
app.post(
	'/users',
	[
		check('firstname', 'First name is required.').trim().notEmpty(),
		check('lastname', 'Last name is required.').trim().notEmpty(),
		check('password', 'Password must be at least 8 characters long.')
			.trim()
			.notEmpty()
			.isLength({ min: 8 }),

		check('email', 'E-Mail does not appear to be valid.').trim().isEmail().normalizeEmail(),

		check('birthday')
			.optional({ checkFalsy: true })
			.custom(value => {
				if (value) {
					const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/; // (YYYY-MM-DD)
					if (!dateFormatRegex.test(value)) {
						throw new Error('Invalid date format for birthday.');
					}
					const [year, month, day] = value.split('-').map(Number);
					if (month < 1 || month > 12) {
						throw new Error('Month must be between 01 and 12.');
					}
					if (day < 1 || day > 31) {
						throw new Error('Day must be between 01 and 31.');
					}
				}
				return true;
			})
			.toDate()
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}

			const result = await registerUser(req.body);

			res.status(201).json(result);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: error.message });
		}
	}
);

/**
 * Endpoint for updating user data.
 * Allows authenticated user to update their own data (firstname, lastname, password, email, birthday).
 *
 * @route PATCH /users/{email}
 * @param {string} email.path.required - The email address of the user to update.
 * @param {Object} req.body - The request body containing fields to update (firstname, lastname, password, email, birthday).
 * @returns {Object} 200 - The updated user object
 * @returns {Object} 400 - Invalid updates or missing required fields in request body
 * @returns {string} 403 - Permission denied if authenticated user does not match the email in path
 * @returns {string} 404 - User not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.patch('/users/:email', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		if (req.user.email !== req.params.email) {
			return res.status(403).send('Permission denied.');
		}

		// Validate the request body fields
		const allowedUpdates = ['firstname', 'lastname', 'password', 'email', 'birthday'];
		const updates = Object.keys(req.body);
		const isValidOperation = updates.every(update => allowedUpdates.includes(update));
		if (!isValidOperation) {
			return res.status(400).send({ error: 'Invalid updates.' });
		}

		if (req.body.password) {
			req.body.password = await Users.hashPassword(req.body.password, 10);
		}

		const updatedUser = await Users.findOneAndUpdate(
			{ email: req.params.email },
			{ $set: req.body },
			{ new: true } // Return the updated document
		);

		if (updatedUser) {
			res.status(200).json(updatedUser);
		} else {
			res.status(404).send('User not found.');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

/**
 * Endpoint for adding a movie to user's favorite movies list.
 * Allows authenticated user to add a movie by its ID to their favorite movies.
 *
 * @route POST /users/{email}/favoriteMovies/{movieId}
 * @param {string} email.path.required - The email address of the user to add favorite movie.
 * @param {string} movieId.path.required - The ID of the movie to add to user's favorite movies.
 * @returns {Object} 201 - The updated user object with added favorite movie
 * @returns {string} 400 - Invalid movie ID format
 * @returns {string} 403 - Permission denied if authenticated user does not match the email in path
 * @returns {string} 404 - User not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.post(
	'/users/:email/favoriteMovies/:movieId',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			if (req.user.email !== req.params.email) {
				return res.status(403).send('Permission denied');
			}

			if (!ObjectId.isValid(req.params.movieId)) {
				return res.status(400).send('Invalid movie ID');
			}

			const updatedUser = await Users.findOneAndUpdate(
				{ email: req.params.email },
				{ $addToSet: { favoriteMovies: req.params.movieId } }, // Use $addToSet to avoid duplicate entries
				{ new: true } // Return the updated document
			);

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
 * Endpoint for removing a movie from user's favorite movies list.
 * Allows authenticated user to remove a movie by its ID from their favorite movies.
 *
 * @route DELETE /users/{email}/favoriteMovies/{movieId}
 * @param {string} email.path.required - The email address of the user to remove favorite movie.
 * @param {string} movieId.path.required - The ID of the movie to remove from user's favorite movies.
 * @returns {Object} 200 - The updated user object with removed favorite movie
 * @returns {string} 403 - Permission denied if authenticated user does not match the email in path
 * @returns {string} 404 - User not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.delete(
	'/users/:email/favoriteMovies/:movieId',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			if (req.user.email !== req.params.email) {
				return res.status(403).send('Permission denied');
			}

			const updatedUser = await Users.findOneAndUpdate(
				{ email: req.params.email },
				{ $pull: { favoriteMovies: req.params.movieId } },
				{ new: true }
			);

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
 * Endpoint for deleting a user account by email.
 * Allows authenticated user to delete their own account.
 *
 * @route DELETE /users/{email}
 * @param {string} email.path.required - The email address of the user to delete.
 * @returns {string} 200 - Success message indicating the user account was deleted
 * @returns {string} 403 - Permission denied if authenticated user does not match the email in path
 * @returns {string} 404 - User not found
 * @returns {string} 500 - Internal server error message with details.
 */
app.delete('/users/:email', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		if (req.user.email !== req.params.email) {
			return res.status(403).send('Permission denied.');
		}

		const deletedUser = await Users.findOneAndDelete({
			email: req.params.email
		});

		if (!deletedUser) {
			res.status(404).send(req.params.email + ' was not found.');
		} else {
			res.status(200).send(req.params.email + ' was deleted.');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error: ' + error.message);
	}
});

app.get('/', (req, res) => {
	res.send('Welcome to MYFLIX - your favorite source of information about the movies you love.');
});

// #endregion

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
	console.log('Listening on Port ' + port);
});
