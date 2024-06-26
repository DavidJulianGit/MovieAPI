const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

/**
 * Schema for storing movie information.
 * @typedef {Object} MovieSchema
 * @property {string} title - The title of the movie (required).
 * @property {string} description - The description of the movie (required).
 * @property {string} imdbRating - The IMDB rating of the movie.
 * @property {string} imdbVotes - The number of IMDB votes for the movie.
 * @property {string} imdbID - The IMDB ID of the movie.
 * @property {Date} year - The year of release of the movie.
 * @property {string} rated - The rating of the movie.
 * @property {string} released - The release date of the movie.
 * @property {string} runtime - The duration of the movie.
 * @property {Object[]} genres - Array of genre objects.
 * @property {string} genres.name - The name of the genre.
 * @property {string} genres.description - The description of the genre.
 * @property {Object} director - Object containing director information.
 * @property {string} director.name - The name of the director.
 * @property {string} director.bio - The biography of the director.
 * @property {Date} director.birth - The birth date of the director.
 * @property {Date} director.death - The death date of the director.
 * @property {string} writer - The writer of the movie.
 * @property {string} actors - The actors in the movie.
 * @property {string} language - The language of the movie.
 * @property {string} country - The country where the movie was produced.
 * @property {string} awards - The awards won by the movie.
 * @property {string} poster - The URL of the movie poster.
 * @property {string} metascore - The metascore rating of the movie.
 * @property {string} type - The type of the movie.
 * @property {string[]} images - Array of URLs of images related to the movie.
 */
const movieSchema = mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	imdbRating: String,
	imdbVotes: String,
	imdbID: String,
	year: Date,
	rated: String,
	released: String,
	runtime: String,
	genres: {
		type: Object,
		required: true,
		name: { type: String },
		description: { type: String }
	},
	director: {
		name: String,
		bio: String,
		birth: Date,
		death: Date
	},
	writer: String,
	actors: String,
	language: String,
	country: String,
	awards: String,
	poster: String,
	metascore: String,
	type: String,
	images: [String]
});

/**
 * Schema for storing user information.
 * @typedef {Object} UserSchema
 * @property {string} firstname - The first name of the user (required).
 * @property {string} lastname - The last name of the user (required).
 * @property {string} password - The hashed password of the user (required).
 * @property {string} email - The email address of the user, used as unique userID (required).
 * @property {Date} birthday - The birthday of the user.
 * @property {mongoose.Schema.Types.ObjectId[]} favoriteMovies - Array of movie IDs that the user has favorited.
 */
const userSchema = mongoose.Schema({
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	password: { type: String, required: true },
	email: { type: String, required: true },
	birthday: { type: Date },
	favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

userSchema.statics.hashPassword = password => {
	return bcryptjs.hashSync(password, 10);
};

// Compares submitted hashed password to hashed password in DB
userSchema.methods.validatePassword = function (password) {
	return bcryptjs.compareSync(password, this.password);
};

const Movie = mongoose.model('movies', movieSchema);
const User = mongoose.model('users', userSchema);
module.exports.Movie = Movie;
module.exports.User = User;
