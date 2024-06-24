const passport = require('passport'),
   LocalStrategy = require('passport-local').Strategy,
   Models = require('./models.js'),
   passportJWT = require('passport-jwt');

let Users = Models.User,
   JWTStrategy = passportJWT.Strategy,
   ExtractJWT = passportJWT.ExtractJwt;

//Local Strategy
passport.use(
   new LocalStrategy(

      {
         usernameField: 'email',
         passwordField: 'password',
      },
      // Callback
      async (username, password, callback) => {

         console.log(`${username} ${password}`);

         // Query DB to find user
         await Users.findOne({ email: username })
            .then((user) => {

               // User doesn't exist
               if (!user) {
                  console.log('incorrect username.');

                  return callback(null, false, {
                     message: 'Incorrect username or password.',
                  });
               }

               // Password doesn't match
               if (!user.validatePassword(password)) {
                  console.log('incorrect password.');
                  return callback(null, false, { message: 'Incorrect password.' });
               }

               // Success -> return user
               console.log('successful login');
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

// JWT Strategy
passport.use(
   new JWTStrategy(
      {
         jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
         secretOrKey: '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm',
      },

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
