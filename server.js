const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Mongoose section - start
const Schema = mongoose.Schema;

const entrySchema = new Schema({
  username: String,
  exercises: [{
    name: String,
    duration: Number,
    date: {type: Date, default: new Date()}
  }]
})

let user = mongoose.model('User', entrySchema)

const createUser = (name,  res) => {
  let newUser = new user({username: name})
  
  user.findOne({username: name}).exec((err, data) => {
    if (err) return res.json(err)
    
    if (data !== null) {
      return res.json('User already created!')
    } else {
      
      newUser.save((err, data) => {
        if (err) return res.json(err)
        user.findById(data._id).select('username _id').exec((err, data) => {
          res.json(data)
        })
      })
      
    }
  })
}

const addExercise = (exercise, res) => {
  user.findById(exercise.userId, (err, data) => {
    if (err) return res.json(err)
    const newExercise = {name: exercise.description, duration: exercise.duration, date: exercise.date || new Date()}
    data.exercises.push(newExercise)
    data.save((err, data) => {
      if (err) return res.json(err)
      res.json(newExercise)
    })
  })
}

const showUser = (id, res) => {
  user.findById(id).select('-__v -exercises._id').exec((err, data) => {
    if (data === null) {
      res.json('Unknown ID')
    } else {
      res.json(data)
    }
  })
}

app.use((req, res, next) => {
  const path = req.path;
  
  if (path === '/api/exercise/new-user') {
    console.log('New user created!')
    createUser(req.body.username, res)
  } else if (path === '/api/exercise/add') {
    console.log('New exercise add!')
    addExercise(req.body, res)
  } else if (path === '/api/exercise/log') {
    console.log('Checking API!')
    showUser(req.query.userId, res)
  } else next()
})
// Mongoose section - end

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
