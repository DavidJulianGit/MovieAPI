const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Models = require('./models.js'),
	passportJWT = require('passport-jwt');

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

/**
 * Register Local Strategy
 */
passport.use(
	new LocalStrategy(
		// Options
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		// Callback
		async (username, password, callback) => {
			/**
			 * callback(error, user, info):
			 * "error" is an error object (if any),
			 * "user" is the authenticated user (if authentication is successful),
			 * "info" is an additional information object (if needed).
			 */
			console.log(`${username} ${password}`);

			/**
			 * Query DB to find user
			 */
			await Users.findOne({ email: username })
				.then((user) => {
					// User doesn't exist
					if (!user) {
						console.log('incorrect username');

						// no error, false = no user found, message
						return callback(null, false, {
							message: 'Incorrect username or password.',
						});
					}

					// User does exist and was found - return user
					console.log('finished');
					return callback(null, user);
				})
				.catch((error) => {
					if (error) {
						console.log(error);
						return callback(error);
					}
				});
		},
	),
);

/**
 * Register JWT Strategy
 */
passport.use(
	new JWTStrategy(
		/**
		 * Options
		 * How to extract the JWT token
		 * SecretKey
		 */
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm',
		},
		/**
		 * Callback for authentication logic
		 * @param jwtPayload    contains the decoded JWT payload
		 * @param callback      function that is called to indicate whether authentication was successful or not
		 *      callback(error, user):
		 *          "error" is an error object (if any),
		 *          "user" is the authenticated user (if authentication is successful)
		 */
		async (jwtPayload, callback) => {
			// Query DB for user
			return await Users.findById(jwtPayload._id)
				// User found
				.then((user) => {
					return callback(null, user);
				})
				// Error
				.catch((error) => {
					return callback(error);
				});
		},
	),
);
