const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

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
    description: { type: String },
  },
  director: {
    name: String,
    bio: String,
    birth: Date,
    death: Date,
  },
  writer: String,
  actors: String,
  language: String,
  country: String,
  awards: String,
  poster: String,
  metascore: String,
  type: String,
  images: [String],
});

const userSchema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true }, // email is unique username / userID
  birthday: { type: Date },
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

// hash the password
userSchema.statics.hashPassword = (password) => {
  return bcryptjs.hashSync(password, 10);
};

// compare submitted hashed password to hashed password in DB
userSchema.methods.validatePassword = function (password) {
  return bcryptjs.compareSync(password, this.password);
};



const Movie = mongoose.model('movies', movieSchema);
const User = mongoose.model('users', userSchema);
module.exports.Movie = Movie;
module.exports.User = User;
