const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const axios = require('axios');

// Modules for autentification
const cookieSession = require('cookie-session')
const passport = require('passport')

// getting the local authentication type
const LocalStrategy = require('passport-local').Strategy

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

//connect with mongo db using mongoose

const mongodb_conn_module = require('./mongodbConnModule');
var db = mongodb_conn_module.connect();

//use axios to bring data from jsonplaceholder's API

async function getRemotePosts() {
  
	let res = await axios.get('https://jsonplaceholder.typicode.com/posts');
  
	let pulledPosts = res.data;
	//console.log(pulledPosts);
  }
  
getRemotePosts();

//use axios to bring data from jsonplaceholder's API

async function getRemoteUsers() {
	
	  let res = await axios.get('https://jsonplaceholder.typicode.com/users');
	
	  let pulledUsers = res.data;
	  //console.log(pulledUsers);
	}
	
getRemoteUsers();

//Load models to work with mongoose

var Post = require("../models/post");

//Get all posts from mongo

app.get('/posts', (req, res) => {
  Post.find({}, 'title description', function (error, posts) {
	  if (error) { console.error(error); }
	  res.send({
			posts: posts
		})
	}).sort({_id:-1})
})

//add new post to mongo

app.post('/add_post', (req, res) => {
	var db = req.db;
	var title = req.body.title;
	var description = req.body.description;
	var new_post = new Post({
		title: title,
		description: description
	})

	new_post.save(function (error) {
		if (error) {
			console.log(error)
		}
		res.send({
			success: true
		})
	})
})

//edit a post in mongo

app.put('/posts/:id', (req, res) => {
	var db = req.db;
	Post.findById(req.params.id, 'title description', function (error, post) {
	  if (error) { console.error(error); }

	  post.title = req.body.title
	  post.description = req.body.description
	  post.save(function (error) {
			if (error) {
				console.log(error)
			}
			res.send({
				success: true
			})
		})
	})
})

//delete a post in mongo

app.delete('/posts/:id', (req, res) => {
	var db = req.db;
	Post.remove({
		_id: req.params.id
	}, function(err, post){
		if (err)
			res.send(err)
		res.send({
			success: true
		})
	})
})

//Get one element in mongo

app.get('/post/:id', (req, res) => {
	var db = req.db;
	Post.findById(req.params.id, 'title description', function (error, post) {
	  if (error) { console.error(error); }
	  res.send(post)
	})
})

// set cookie expiration date

const publicRoot = '../dist'
app.use(express.static(publicRoot))

app.use(bodyParser.json())
app.use(cookieSession({
    name: 'mysession',
    keys: ['vueauthrandomkey'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours 
  }))

app.use(passport.initialize());
app.use(passport.session());

let users = [
    {
        id: 1,
        name: "guest",
        email: "guest",
        password: "guest",
        snapshot : {
            timestamp_login : 1551378370,
            timestamp_logout : 1551378477,
            state : "inactive",
            token : ""
            }
    },
]

app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: publicRoot })
})

// login endpoint

app.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        
        if (!user) {
            return res.status(400).send([user, "Cannot log in", info])
        }

        req.login(user, (err) => {
            res.send("Logged in")
        })
    })(req, res, next)
})

//logout endpoint

app.get('/logout', function(req, res){
    req.logout();
    console.log("logged out")
    return res.send();
});

//auth middleware

const authMiddleware = (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.status(401).send('You are not authenticated')
    } else {
        return next()
    }
}

//get users endpoint from local storage

app.get("/user", authMiddleware, (req, res) => {
    let user = users.find((user) => {
        return user.id === req.session.passport.user
    })
    console.log([user, req.session])
    res.send({user: user})
})

//passport checks if user and password match

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, 
  (username, password, done) => {
      let user = users.find((user) => {
          return user.email === username && user.password === password
      })
      
      if (user) {
          done(null, user)
      } else {
          done(null, false, {message: 'Incorrect username or password'})
      }
  }
))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  let user = users.find((user) => {
      return user.id === id
  })

  done(null, user)
})

//api listen to pot 8081

app.listen(process.env.PORT || 8081)
