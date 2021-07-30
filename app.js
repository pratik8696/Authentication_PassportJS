//jshint esversion:6
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const encrypt=require('mongoose-encryption')
const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const usersSchema = new mongoose.Schema({
  email: String,
  password: String
})

usersSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User = mongoose.model("User", usersSchema);

app.get("/", function(req, res) {
  res.render('home');
});


app.get("/login", function(req, res) {
  res.render('login');
});

app.get("/register", function(req, res) {
  res.render('register');
});

app.post("/register", function(req, res) {
  const new_user = new User({
    email: req.body.username,
    password: req.body.password
  });
  new_user.save(function(err) {
    if (err) {
      console.log(err);
    }
  });
  res.render('secrets');
});

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({
    email: username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password===password) {
          res.render("secrets");
        }
      }
    }
  })


});



app.listen(3000, function(req, res) {
  console.log("Server 3000 is up and running");
})
