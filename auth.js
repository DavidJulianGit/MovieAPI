const jwtSecret = '41EEgvzXTg9carCP64hT3eJ8HwGMFsHm'; // the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
   passport = require('passport');

require('./passport');

// Generate JWT 
let generateJWTToken = (user) => {

   return jwt.sign(
      user,
      jwtSecret,
      {
         subject: user.email,
         expiresIn: '7d',
         algorithm: 'HS256',
      },
   );
};

// Define route handler user login requests
module.exports = (router) => {
   router.post('/login', (req, res) => {

      // Authenticate user using local strategy
      passport.authenticate('local', { session: false }, (error, user, message) => {

         // error occurred || authentication unsucessful
         if (!user) {
            return res.status(400).json({
               message: message,
               user: user,
            });
         }

         // Sucessful authentication: generate and return token
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
