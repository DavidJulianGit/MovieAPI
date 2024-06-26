const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Models = require('./models.js'),
	passportJWT = require('passport-jwt');

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

/**
 * Configures Passport to use LocalStrategy for username/password authentication.
 *
 * @function
 * @name LocalStrategy
 * @param {Object} options - Options object for configuring LocalStrategy.
 * @param {string} options.usernameField - The field name for the username (email in this case).
 * @param {string} options.passwordField - The field name for the password.
 * @param {function} verifyCallback - Callback function for verifying username/password.
 */
passport.use(
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password'
		},

		/**
		 * Verify callback function for LocalStrategy.
		 *
		 * @param {string} username - The username (email) provided in the request.
		 * @param {string} password - The password provided in the request.
		 * @param {function} callback - The callback function to be called with the authentication result.
		 * @throws {Error} If an error occurs during the authentication process.}
		 */
		async (username, password, callback) => {
			console.log(`${username} ${password}`);

			await Users.findOne({ email: username })
				.then(user => {
					if (!user) {
						console.log('incorrect username.');

						return callback(null, false, {
							message: 'Incorrect username or password.'
						});
					}

					if (!user.validatePassword(password)) {
						console.log('incorrect password.');
						return callback(null, false, { message: 'Incorrect password.' });
					}

					console.log('successful login');
					return callback(null, user);
				})
				.catch(error => {
					if (error) {
						console.log(error);
						return callback(error);
					}
				});
		}
	)
);

/**
 * Configures Passport to use JWTStrategy for JSON Web Token (JWT) authentication.
 *
 * @function
 * @name JWTStrategy
 * @param {Object} options - Options object for configuring JWTStrategy.
 * @param {function} options.jwtFromRequest - Function to extract JWT from request headers.
 * @param {string} options.secretOrKey - Secret key used to verify JWT signatures.
 * @param {function} verifyCallback - Callback function for verifying JWT payload.
 */
passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm'
		},

		/**
		 * Verify callback function for JWTStrategy.
		 *
		 * @param {Object} jwtPayload - Decoded JWT payload containing user information.
		 * @param {function} callback - The callback function to be called with the authentication result.
		 * @throws {Error} If an error occurs during the authentication process.
		 */
		async (jwtPayload, callback) => {
			return await Users.findById(jwtPayload._id)

				.then(user => {
					return callback(null, user);
				})

				.catch(error => {
					return callback(error);
				});
		}
	)
);
