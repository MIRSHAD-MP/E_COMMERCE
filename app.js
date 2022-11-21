// Requiring modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars')
const db = require('./config/connection')
const session = require('express-session')
const dotenv=require('dotenv')

dotenv.config()

//Import the routes
const userRouter = require('./routes/user/users');
const adminRouter = require('./routes/admin/admin');

//Global variables
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'userLayout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))

//Use parsing middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use (session ({secret:"Key",cookie:{maxAge:600000}}))
app.use(function (req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

//DB connection
db.connect((err)=>{
  if (err) console.log("Connection Error"+err);
  else console.log("Database Connected to port 27017");
})
//Using routes
app.use('/admin', adminRouter);
app.use('/', userRouter);

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
  // res.status(err.status || 500);
  // res.render('error');
  res.render('user/500')
});

module.exports = app;
