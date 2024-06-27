# Movie API

## Overview

This repository hosts the server-side component of the MYFLIX application, developed using the MERN stack (MongoDB, Express, React, Node.js).

The MYFLIX project provides users with detailed information about movies, directors, and genres, while also allowing them to manage their personal accounts and favorite movie lists.

## Features

-  Retrieve a list of all movies.
-  Retrieve detailed information about a single movie by its title.
-  Retrieve information about a genre by its name.
-  Retrieve detailed information about a director by their name.
-  Register a new user.
-  Update user information (username, password, email, date of birth).
-  Add a movie to a user’s list of favorites.
-  Remove a movie from a user’s list of favorites.
-  Delete an existing user.

## Technology

-  Built with Node.js and Express.
-  Follows RESTful architecture principles.
-  Database: MongoDB
-  Business logic and data modeling handled by Mongoose.
-  Authentication via basic HTTP authentication JWT

# Installation

1. Cone the repository

   ```bash
   git clone https://github.com/your-username/myflix-server
   cd myflix-server
   ```

2. Install dependencies

   ```bash
    npm install
   ```

3. Configure environment variables:

   -  Create a .env file in the root directory.
   -  Add necessary environment variables (e.g., CONNECTION_URI for database connection, jwtSecret (used in auth.js and passport.js)).

4. Start the server

   ```bash
   npm start
   ```

# API Documentation

## Movie Schema

| Field       | Data type             | Required |
| ----------- | --------------------- | -------- |
| actors      | String                | No       |
| awards      | String                | No       |
| country     | String                | No       |
| description | String                | Yes      |
| director    | Object                | No       |
| genres      | Array of objects      | No       |
|             | - name: String        |          |
|             | - description: String |          |
| images      | Array of Strings      | No       |
| imdbID      | String                | No       |
| imdbRating  | String                | No       |
| imdbVotes   | String                | No       |
| language    | String                | No       |
| metascore   | String                | No       |
| poster      | String                | No       |
| rated       | String                | No       |
| released    | String                | No       |
| runtime     | String                | No       |
| title       | String                | Yes      |
| type        | String                | No       |
| writer      | String                | No       |
| year        | Date                  | No       |

## User Schema

| Field          | Data type          | Required |
| -------------- | ------------------ | -------- |
| birthday       | Date               | No       |
| email          | String             | Yes      |
| favoriteMovies | Array of objectIds | No       |
| firstname      | String             | Yes      |
| lastname       | String             | Yes      |
| password       | String             | Yes      |

## API Endpoints

| Operation                                 | Request | URL                                   | Response                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **List of all movies**                    | GET     | /movies                               | - **200**: An array of movie objects<br>- **500**: Internal server error (string)                                                                                                                                                                                                                                                     |
| **All data of a single movie by title**   | GET     | /movies/:title                        | - **200**: The movie object matching the title (object)<br>- **404**: Movie not found (string)<br>- **500**: Internal server error message with details (string)                                                                                                                                                                      |
| **Description of a genre by name**        | GET     | /genres/:name                         | - **200**: The genre object matching the name (object)<br>- **404**: Genre not found (string)<br>- **500**: Internal server error message with details (string)                                                                                                                                                                       |
| **All data of a director by name**        | GET     | /directors/:name                      | - **200**: Information about the director (object)<br>- **404**: Director or movie not found (string)<br>- **500**: Internal server error message with details (string)                                                                                                                                                               |
| **Register a new user**                   | POST    | /users                                | - **201**: Successful registration - returns the created user (object)<br>- **422**: Validation errors - (object) with key "errors", containing an array of errors.<br>- **500**: Internal server error - (object) with key "message"                                                                                                 |
| **Login user**                            | POST    | /login                                | - **200**: Successfully authenticated user and JWT token (object)<br>- **400**: Invalid credentials or other authentication error (object)<br>- **500**: Internal server error (object)                                                                                                                                               |
| **Update data of existing user**          | PATCH   | /users/:email                         | - **200**: The updated user object (object)<br>- **400**: Invalid updates or missing required fields in request body (object)<br>- **403**: Permission denied if authenticated user does not match the email in path (string)<br>- **404**: User not found (string)<br>- **500**: Internal server error message with details (string) |
| **Add movie to a user's favorite movies** | POST    | /users/:email/favoriteMovies/:movieId | - **201**: The updated user object with added favorite movie (object)<br>- **400**: Invalid movie ID format (string)<br>- **403**: Permission denied if authenticated user does not match the email in path (string)<br>- **404**: User not found (string)<br>- **500**: Internal server error message with details (string)          |
| **Delete favorite movie of user**         | DELETE  | /users/:email/favoriteMovies/:movieId | - **200**: The updated user object with removed favorite movie (object)<br>- **403**: Permission denied if authenticated user does not match the email in path (string)<br>- **404**: User not found (string)<br>- **500**: Internal server error message with details (string)                                                       |
| **Delete user's account by email**        | DELETE  | /users/:email                         | - **200**: Success message indicating the user account was deleted (string)<br>- **403**: Permission denied if authenticated user does not match the email in path (string)<br>- **404**: User not found (string)<br>- **500**: Internal server error message with details (string)                                                   |

## Example Request Bodies

### Register or update user

```json
{
	"firstname": "John",
	"lastname": "Doe",
	"password": "password",
	"email": "john.doe@example.com",
	"birthday": "1990-12-24"
}
```

### Login

```json
{
	"email": "john.doe@example.com",
	"password": "password"
}
```
