//jshint esversion:6
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://new-user:test123@cluster0.pqa3i.mongodb.net/userDB", {
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true);

const usersSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  facebookId:String
});

usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);

const User = mongoose.model("User", usersSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret:process.env.FB_CLIENT_SECRET,
    callbackURL: "/auth/facebook/secrets",
    proxy:true
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
       return cb(err, user);
     });
   }
 ));

app.get("/", function(req, res) {
  res.render('home');
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get("/auth/google/secrets",
  passport.authenticate('google', {
    failureRedirect: '/register'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/register' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });


app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect("/login");
  }
});

app.get("/login", function(req, res) {
  res.render('login');
});

app.get("/register", function(req, res) {
  res.render('register');
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


app.post("/register", function(req, res) {
  User.register({
      username: req.body.username
    },
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
});



app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });


});



app.listen(process.env.PORT || 3000, function(req, res) {
  console.log("Server 3000 is up and running");
})
