const jwtSecret = '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm'; // the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
	passport = require('passport');

require('./passport');

/**
 * Generate JWT tokens for authentication
 *
 * @param {Object} user  payload of the JWT, contains information about the user
 */
let generateJWTToken = (user) => {
	/**
	 * @param {String} jwtSecret secret key used to sign the JWT
	 * @returns {String} The JWT token
	 */
	return jwt.sign(
		user,
		jwtSecret,
		// Options
		{
			subject: user.email, // represents the entity (username = email) to which the token refers
			expiresIn: '7d', // This specifies that the token will expire in 7 days
			algorithm: 'HS256', // This is the algorithm used to “sign” or encode the values of the JWT
		},
	);
};

/**
 * Defines a route handler for handling user login requests
 *
 * @param {Express Router Object} router An isolated instance of middleware and routes
 * @returns {Object} if sucesfful: user, JWT token | Otherwise: error
 */
module.exports = (router) => {
	router.post('/login', (req, res) => {
		/**
		 * @param {String} firstParamenter 'local' refers to the local strategy to authenticate the user
		 * @param {Object} session disable session support
		 * @callback gets called after the authentication process is completed.
		 *  It receives three parameters:
		 *  error (if any),
		 *  user (the authenticated user object),
		 *  and info (additional information)
		 */
		passport.authenticate('local', { session: false }, (error, user, info) => {
			// error occurred or authentication unsucessful
			if (error || !user) {
				return res.status(400).json({
					message: 'Something is not right',
					user: user,
				});
			}
			// sucessful authentication: generate and return token
			req.login(user, { session: false }, (error) => {
				if (error) {
					res.send(error);
				}
				let token = generateJWTToken(user.toJSON());
				return res.json({ user, token });
			});
		})(req, res);
	});
};
