// Express Dependencies
var express = require('express');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var session = require('express-session');

// Passport Dependencies
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// Database Dependencies
var mongo = require('mongodb');
var mongoose = require('mongoose');

// Other Dependencies
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var moment = require('moment');
var flash = require('connect-flash');


// Init App
var app = express();

//mongoose connection
mongoose.connect('mongodb://localhost/taskiwa');
var db = mongoose.connection;

var dashboard = require('./routes/dashboard');  // Related to Dashboard
var users = require('./routes/users');          // Related to Users
var tasks = require('./routes/tasks');          // Related to Tasks
var projects = require('./routes/projects');    // Related to Projects
var p404 = require('./routes/p404');            // Related to Page Not Found
var p403 = require('./routes/p403');            // Related to Access Denied
var history = require('./routes/history');      // Related to History Log
var trash = require('./routes/trash');          // Related to Trash Bin
var reports = require('./routes/reports');      // Related to Reports
var taskgroups = require('./routes/taskgroups');// Related to Task Groups
var log = require('./routes/log');              // Related to Log
var routes = require('./routes/index');


// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');    // Keeps the Success Message
  res.locals.error_msg = req.flash('error_msg');        // Keeps the Error Message
  res.locals.error = req.flash('error');                // Keeps the Error
  res.locals.user = req.user || null;                   // Keeps User Information
  next();
});

app.use('/', routes);                       // Related to homepage
app.use('/dashboard', dashboard);           // Related to dashboard
app.use('/users', users);                   // Related to users page
app.use('/tasks/', tasks);                  // Related to tasks page
app.use('/projects', projects);             // Related to Projects
app.use('/trash', trash);                   // Related to Trash Bin
app.use('/page-not-found', p404);           // Related to Page 404
app.use('/access-denied', p403);            // Related to Page 403
app.use('/history', log);                   // Related to History Log page
// app.use('/history', history);               // Related to History Log page
app.use('/reports', reports);               // Related to Reports page
app.use('/taskgroups', taskgroups);         // Related to Task Groups page

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function(req, res){
  res.render('p404');
});

// Set Port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});
