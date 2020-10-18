var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
require('./models');
var bcrypt = require('bcrypt');
var expressSession = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = mongoose.model('User');



mongoose.connect('mongodb://localhost:27017/saas-tutorial-db', {useNewUrlParser: true, useUnifiedTopology: true});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'vsdiubvei54h8g',
  resave: true,
  saveUninitialized: true

}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, 
  function(email, password, next) {
    User.findOne({
      email: email
    }, function(err, user) {
      if (err) return next(err);
      if (!user | !bcrypt.compareSync(password, user.passwordHash)) {
        return next({message: 'Email or Password incorrect'})
      }
      next(null, user);
    })
  }));

  passport.use('signup-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, 
    function(email, password, next) {
      User.findOne({
        email: email
      }, function(err, user) {
        if (err) return next(err);
        if (user) return next({
          message: "User alreay exists!"
        });
        let newUser = new User({
          email: email,
          passwordHash: bcrypt.hashSync(password, 10)
        })
        newUser.save(function(err) {
          next(err, newUser);
        });
      });
    }));

  passport.serializeUser(function(user, next) {
    next(null, user._id)
  });

  passport.deserializeUser(function(id, next) {
    User.findById(id, function(err, user) {
      next(err, user);
    })
  })

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

app.get('/', function (req, res, next) {
  res.render('index', {title: "Saas Tutorial!"})
})

app.get('/main', function (req, res, next) {
  res.render('main')
})

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login-page' }),
  function(req, res) {
    res.redirect('/main');
  });

  app.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
  })

app.get('/login-page', function(req, res) {
  res.render('login-page');
})

app.get('/billing', function(req, res) {

const stripe = require('stripe')('sk_test_51HdHlLDwyvYmmjapJx5VeHYgofK0wENHqA4EHkjiSq4OqXBu3TtYXLRA30qPH3OWUYLrGt33mdRq5kNEywtC5OJZ00WTXMdxMJ');

const session = stripe.checkout.sessions.create({
  success_url: 'https://localhost:3000/billing?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
  customer_email: req.user.email,
  payment_method_types: ['card'],
  line_items: [
    {price: 'price_1HdHnBDwyvYmmjaptey2unoj', quantity: 2},
  ],
  mode: 'payment',
}, function(err, session) {
  if (err) return next(err);
  res.render('billing', {sessionId: session.id})  
});

  res.render('billing');
})

app.post('/signup', 
  passport.authenticate('signup-local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/main');
  });

app.get('/login-page', function(req, res) {
  res.render('login-page');
})

app.post('/signup', function (req, res, next) {

})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
