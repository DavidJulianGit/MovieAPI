/**
 * Secret key used for JWT signing, also used in JWTStrategy
 * @type {string}
 */
const jwtSecret = '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm';

const jwt = require('jsonwebtoken'),
	passport = require('passport');

require('./passport');

let generateJWTToken = user => {
	return jwt.sign(user, jwtSecret, {
		subject: user.email,
		expiresIn: '7d',
		algorithm: 'HS256'
	});
};

/**
 * Module exporting route handler for user login authentication.
 */
module.exports = router => {
	/**
	 * Handles user login.
	 *
	 * When a POST request is made to '/login', it authenticates the user using Passport's local strategy.
	 * If authentication is successful, it generates a JWT token and returns it along with the user information.
	 * If authentication fails, it returns an error message and status 400.
	 * @route POST /login
	 * @group Authentication - Operations for user authentication
	 * @returns {object} 200 - Successfully authenticated user and JWT token
	 * @returns {object} 400 - Invalid credentials or other authentication error
	 * @returns {object} 500 - Internal server error
	 */
	router.post('/login', (req, res) => {
		// Authenticate user using local strategy
		passport.authenticate('local', { session: false }, (error, user, message) => {
			if (error) {
				return res.status(500).json({ message: error.message });
			}

			if (!user) {
				return res.status(400).json({
					message: message,
					user: user
				});
			}

			// Sucessful authentication
			req.login(user, { session: false }, error => {
				if (error) {
					res.send(error);
				}
				let token = generateJWTToken(user.toJSON());
				return res.json({ user, token });
			});
		})(req, res);
	});
};
