// Requirements
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Importing database modules
const mongoose = require('mongoose');
const Models = require('./models.js');

// Mongoose Models
const Movies = Models.Movie;
const Users = Models.User;
mongoose.connect('mongodb://localhost:27017/movieDB');


const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Cross-Origin Resource Sharing 
const cors = require('cors');
app.use(cors());

// Importing authentication and passport module
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport');


// Create write stream to "log.txt"
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
	flags: 'a',
});

// Setting up morgan
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('common'));

// serve static files from 'public'
app.use(express.static('public'));

// #region Endpoints

// Get all movies.
app.get('/movies',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.find()
			.then((movies) => {
				res.status(201).json(movies);
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	},
);

// Get all data for movie by name
app.get('/movies/:title/',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Query DB
		await Movies.findOne({ title: req.params.title })
			.then((movie) => {
				res.json(movie);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	},
);

// Get description of a genre by name
app.get('/genres/:name/',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
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
	},
);

// Get director by name
app.get('/directors/:name',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ 'director.name': req.params.name })
			.then((movie) => {
				res.status(201).json(movie.director);
			})
			.catch((err) => {
				console.error(err);
				res.status(500).send('Error: ' + err);
			});
	},
);

// Register new user
app.post('/users',
	// Validation logic
	[
		check('firstname', 'First name is required').trim().notEmpty(),
		check('lastname', 'Last name is required').trim().notEmpty(),
		check('password', 'Password must be at least 8 characters long.').trim().isLength({ min: 8 }),
		check('email', 'Email does not appear to be valid').trim().isEmail(),
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
			.toDate(),
	],
	async (req, res) => {

		// check the validation object for errors
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		// hash password
		let hashedPassword = Users.hashPassword(req.body.password);

		await Users.findOne({ email: req.body.email })
			.then((user) => {
				// If user already exists, error
				if (user) {
					return res.status(400).send(req.body.email + ' already exists');
				}
				// Create new user
				else {
					Users.create({
						firstname: req.body.firstname,
						lastname: req.body.lastname,
						password: hashedPassword,
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

// Update user data by email
app.put('/users/:email',
	// Validation logic
	[
		check('firstname', 'First name is required').trim().notEmpty(),
		check('lastname', 'Last name is required').trim().notEmpty(),
		check('password', 'Password must be at least 8 characters long.').trim().isLength({ min: 8 }),
		check('email', 'Email does not appear to be valid').trim().isEmail(),
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
			.toDate(),
	],
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {

		if (req.user.email !== req.params.email) {
			return res.status(400).send('Permission denied');
		}

		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.password);

		await Users.findOneAndUpdate(
			{ email: req.params.email },
			{
				$set: {
					firstname: req.body.firstname,
					lastname: req.body.lastname,
					password: hashedPassword,
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
	},
);

// Add favorite movie to user
app.post(
	'/users/:email/favoriteMovies/:movieId',

	passport.authenticate('jwt', { session: false }),
	async (req, res) => {

		if (req.user.email !== req.params.email) {
			return res.status(400).send('Permission denied');
		}

		await Users.findOneAndUpdate(
			{ email: req.params.email },
			{
				$push: { favoriteMovies: req.params.movieId },
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
	},
);

// Remove favorite movie from user
app.delete(
	'/users/:email/favoriteMovies/:movieId',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Users.findOneAndUpdate(
			{ email: req.params.email },
			{
				$pull: { favoriteMovies: req.params.movieId },
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
	},
);

// Delete user account
app.delete(
	'/users/:email',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {

		// Making sure that the username in the request body matches the one in the request parameter
		if (req.user.email !== req.params.email) {
			return res.status(400).send('Permission denied');
		}

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
	},
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
