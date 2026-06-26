const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'moviesData.db')
let db = null
app.use(express.json())
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertSnakeCaseToCamelCase = eachMovie => {
  return {
    movieName: eachMovie.movie_name,
  }
}

// Returns a list of all movie names in the movie table

app.get('/movies/', async (request, response) => {
  const getAllMoviesQuery = `Select * from Movie`
  const moviesArray = await db.all(getAllMoviesQuery)
  response.send(
    moviesArray.map(eachMovie => convertSnakeCaseToCamelCase(eachMovie)),
  )
})

// Creates a new movie in the movie table. movie_id is auto-incremented

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails

  const addMovieQuery = `Insert into 
  Movie (director_id,movie_name,lead_actor) Values 
  (
     ${directorId},
    '${movieName}',
    '${leadActor}'

  )`

  const newMovie = await db.run(addMovieQuery)
  const movieId = newMovie.lastId
  response.send('Movie Successfully Added')
})

// Returns a movie based on the movie ID

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `Select * from Movie where movie_id = ${movieId}`
  const movieResult = await db.get(getMovieQuery)
  response.send({
    movieId: movieResult.movie_id,
    directorId: movieResult.director_id,
    movieName: movieResult.movie_name,
    leadActor: movieResult.lead_actor,
  })
})

// Updates the details of a movie in the movie table based on the movie ID

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body

  const {directorId, movieName, leadActor} = movieDetails

  const updateMovieQuery = `Update Movie Set 
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  Where movie_id = ${movieId}`

  const updatedMovie = await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

// Deletes a movie from the movie table based on the movie ID

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  Delete from Movie where movie_id = ${movieId}
  `
  const deletedMovie = await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

// Returns a list of all directors in the director table
const convertDirectorNametoCamelCase = eachDirector => {
  return {
    directorId: eachDirector.director_id,
    directorName: eachDirector.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `Select * from director`
  const directorsArray = await db.all(getAllDirectorsQuery)
  response.send(
    directorsArray.map(eachDirector =>
      convertDirectorNametoCamelCase(eachDirector),
    ),
  )
})

// Returns a list of all movie names directed by a specific director
const convertToCamelCase = eachMovie => {
  return {
    movieName: eachMovie.movie_name,
  }
}

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getMoviesBasedOnDirectorQuery = `Select * from movie where director_id = ${directorId}`
  const allMoviesArray = await db.all(getMoviesBasedOnDirectorQuery)
  response.send(allMoviesArray.map(eachMovie => convertToCamelCase(eachMovie)))
})

module.exports = app
