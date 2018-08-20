// Required modules
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var moment = require('moment');
var bcrypt = require('bcryptjs');


var fileUpload = require('express-fileupload');

// var uploader = express();
// uploader.use(fileUpload());
router.use(fileUpload());
// var app = express();
// // default options
// app.use(fileUpload());

var path = require('path');



// Required Models
var User = require('../models/user');
var Project = require('../models/project');
var Log = require('../models/log');



// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Register User
router.post('/register',
 	ensureUsernameUnique,
	ensureEmailUnique,
	// findThisUserByUsername,
	function(req, res){

	// Check if username is already captured...
	if (req.userByUsername) {
		if (req.userByUsername.username) {
		    console.log("Username already captured!");
		    req.flash("error_msg", "Username is already captured!");
		    res.redirect('/users/register');
		    return;
		}
	}

	// Check if email is already captured...
	if (req.userByEmail) {
			if (req.userByEmail.email) {
			  console.log("Email already captured!");
			  req.flash("error_msg", "Email is already captured!");
			  res.redirect('/users/register');
			  return;
			}
  }

	var nameFirst = req.body.nameFirst;
	var nameLast = req.body.nameLast;
	var email = req.body.email.toLowerCase();
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var preview = "defaultUserPreview.png";

	// var nameFirst = "Simos";
	// var nameLast = "Tsitoglou";
	// var email = "simostsitoglou@taskiwa.com";
	// var username = simostsitoglou;
	// var password = "1";
	// var password2 = "1";
	// var preview = "defaultUserPreview.png";


	// Validation
	req.checkBody('nameFirst', 'First Name is required').notEmpty();
	req.checkBody('nameLast', 'Last Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	// req.checkBody('password', 'The password length must be between 8 and 100.').isLength({min: 8, max: 20});

	var error = req.validationErrors();

	if(error){
		// Show What Happened
		console.log ("Error Found in User Registration:");
		console.log(error);
		res.render('register',{
			error: error
		});
	} else {
			var keyring;
			var newUser = new User({
			name: {
				first: nameFirst,
				last: nameLast
			},
			email:email,
			username: username,
			password: password,
			preview: preview,
			keyring: keyring,
			created: {
				date: new moment().format("DD/MM/YY"),
				time: new moment().format("HH:mm:ss")
			},
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;

			// Show What Happened
			console.log("User Registration Successfull:");
			console.log(user);
		});



		// Create Log entry
	    var newLog = new Log({
	        user: newUser._id,
	        owner: newUser._id,
	        created: {
	            date: new moment().format("DD/MM/YY"),
	            time: new moment().format("HH:mm:ss")
	        },
	        action: {
	            category: "User",
	            method: "Registration"
	        }
	    });

	    // Save the log entry
	    Log.createLog(newLog, function(err, log){
	        if (err) throw err;
	    });


		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}

});


passport.use(new LocalStrategy(
  function(email, password, done) {
	  var emailLowerCase = email.toLowerCase();
	  emailLowerCase.toString();
	  // var emailLowerCase = email;

   User.getUserByEmail(emailLowerCase, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'Unknown User'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {
	  successRedirect:'/dashboard',
	  failureRedirect:'/users/login',
	  failureFlash: true
  }),

  function(req, res) {
    res.redirect('/dashboard');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');
	res.redirect('/users/login');
});


router.get('/view/:username',
	ensureAuthenticated,
	findThisUserByUsername,
	getActiveProjectsByUsername,
	seperateProjects,
	function(req, res){

		// console.log(req.currentUser);

		res.render('userprofile', {
			title: "User Profile",
			currentUser: req.currentUser,
			projects: req.relatedProjects,
			projectsOwned: req.projectsOwned,
			projectsShared: req.projectsShared
		});
});



router.get('/myprofile',
	ensureAuthenticated,
	findThisUserByUsername,
	getActiveProjectsByUsername,
	seperateProjects,
	function(req, res){

		res.render('edituser', {
			title: "My Profile",
			// user: req.user,
			projects: req.relatedProjects,
			projectsOwned: req.projectsOwned,
			projectsShared: req.projectsShared
		});
});



// Change User's Password
router.post('/changepassword', ensureAuthenticated, function(req, res){

	// if the passwords do not match...
	if (req.body.userNewPassword != req.body.userNewPasswordConfirmation) {
		req.flash('error_msg', "Passwords doesn't match!");
		res.redirect('/users/view/' + req.user.username);
		return;
	}


	// if the passwords do not match...
	if (req.body.userNewPassword.length < 8) {
		req.flash('error_msg', "Inapropriate password length!");
		res.redirect('/users/view/' + req.user.username);
		return;
	}


	// req.checkBody(req.body.userNewPassword, 'The password length must be between 8 and 100.').isLength({min: 8, max: 20});
	//
	// var error = req.validationErrors();
	//
	// if(error){
	// 	// Show What Happened
	// 	console.log ("Error Found in User Registration:");
	// 	console.log(error);
	// 	req.flash('error_msg', "Inapropriate password length!");
	// 	res.render('/users/view/' + req.user.username);
	// 	return;
	// }


	// check if the password match user password...
		User.comparePassword(req.body.userCurrentPassword, req.user.password, function(err, isMatch){
			if(err) throw err;
			if(isMatch){
					// req.user.password = req.body.userNewPassword;
					// req.user.save();
					bcrypt.genSalt(10, function(err, salt) {
					    bcrypt.hash(req.body.userNewPassword, salt, function(err, hash) {
					        req.user.password = hash;
					        req.user.save();
					    });
					});

					req.flash('success_msg', "Password changed!");
					res.redirect('/users/view/' + req.user.username);
					return;
			} else {
					req.flash('error_msg', "Wrong Password!");
					res.redirect('/users/view/' + req.user.username);
					return;
			}
		});

});






// Get global trash Page
router.get('/trash/:userId', ensureAuthenticated, function(req, res){

    // // Project.findOne({ users:{username: req.user.username}, _id: req.params.id }, function(err, currentProject) {
    // Project.findOne({
    //     $and: [
    //         {$or: [
    //             {owner:{username: req.user.username}},
    //             {users:{username: req.user.username}}
    //         ]},
    //         {_id: req.params.id }
    //     ]}, function(err, currentProject) {
		//
    //     if (err) throw err;
		//
    //     var project = currentProject;
		// // console.log(project);
		// // console.log(req.params.id);

	//  res.render('vp3_2', {
    res.render('globaltrash', {
		// title: project.name,
		// project: project,
		username: req.user.username
		});
	// });
});


// Edit User's First Name
router.post('/changefirstname/', ensureAuthenticated, function(req, res){

	User.findOne({ username: req.user.username }, function (err, user){
		user.name.first = req.body.userFirstName;
		user.save();
	});

	req.flash('success_msg', 'First Name Changed.');
	res.redirect('/users/view/' + req.user.username);
});


// Edit User's Last Name
router.post('/changelastname/', ensureAuthenticated, function(req, res){

	User.findOne({ username: req.user.username }, function (err, user){
		user.name.last = req.body.userLastName;
		user.save();
	});

	req.flash('success_msg', 'Last Name Changed.');
	res.redirect('/users/view/' + req.user.username);
});


// Edit User's Preview Image
router.post('/changePreview/', ensureAuthenticated, function(req, res){

	// console.log(req.files);

	if(!req.files) {
		req.flash('error_msg', 'No file we	re uploaded.');
		res.redirect('/users/myprofile');
		return;
	}

	var newPreview = req.files.userPreview;

	// var previewPath = path.join(__dirname, 'public/img/users/123.png');
	var previewPath = "C:\\cygwin64\\home\\Simos\\taskiwa\\public\\img\\users\\123.png";

	newPreview.mv(previewPath, function(err) {
		if(err){
			res.status(500).send(err);
		} else {
			req.flash('success_msg', 'Preview Changed!');
			res.redirect('/users/myprofile');
		}
	});

	req.user.preview = '123.png';
	req.user.save();
});




// Edit User's Email
router.post('/editEmail/',
		ensureAuthenticated,
		countEmails,
		function(req, res){

			req.checkBody('userEmail', 'Email is required').notEmpty();
			req.checkBody('userEmail', 'Email is not valid').isEmail();

			var error = req.validationErrors();

			if(error){
				// Show What Happened
				console.log ("Error Found in User Registration:");
				console.log(error);

				req.flash('error_msg', error[0].msg);
				res.redirect('/users/view/' + req.user.username);
				return;

			} else {

					User.findOne({ username: req.user.username }, function (err, user){
						user.email = req.body.userEmail;
						user.save();
					});

					req.flash('success_msg', 'Email Changed.');
					res.redirect('/users/view/' + req.user.username);
					return;
				}








				req.flash('success_msg', 'Nothing Changed!');
				res.redirect('/users/view/' + req.user.username);
});





// This function returns a specific User based on it ID.
// User must be "active" and not "banned".
// This function returns a specific User based on his Username.
function findThisUserByUsername(req, res, next) {
  User.findOne({username: req.params.username}, function(err, currentUser) {
      // if (err) throw err;
      req.currentUser = currentUser;

	//   console.log(req.currentUser);

      next();
  });
}




// This function returns all the active projects where:
// - user is owner
// - are shared with this user
function getActiveProjectsByUsername(req, res, next){
  Project.find({
      $and: [
          {$or: [
              {owner: req.user._id},
              {users: req.user._id}
          ]},
          {status: "active" }
    ]}).populate('owner')
    .populate('users')
    .exec( function(err, relatedProjects) {

      req.relatedProjects = relatedProjects;
      next();
  });
}


// This function makes a count on:
// - how many projects are owned of this user
// - how many projects are shared with this user
function seperateProjects(req, res, next){
  var projectsOwned =  0;
  var projectsShared = 0;

  for (var i=0; i < req.relatedProjects.length; i++) {
      if (req.relatedProjects[i].owner.username == req.user.username) {
        projectsOwned++;
      } else {
        projectsShared++;
      }
    }
  req.projectsOwned = projectsOwned;
  req.projectsShared = projectsShared;
  next();
}



function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}



function ensureUsernameUnique(req, res, next){
	User.findOne({username: req.body.username}, function(err, userByUsername){
  		req.userByUsername = userByUsername;
		next();
	});
}

function ensureEmailUnique(req, res, next){
	User.findOne({email: req.body.email}, function(err, userByEmail){
  		req.userByEmail = userByEmail;
		next();
	});
}

function countEmails(req, res, next){
	User.find({email: req.body.userEmail}, function(err, users){

		if(users.length == 0) {
			return next();
		}

		if(users.length == 1) {
				if(users[0].username == req.user.username) {
						req.flash('success_msg','Nothing Changed!');
				} else {
						req.flash('error_msg','This email is already captured!');
				}
				res.redirect('/users/view/' + req.user.username);
		}

	});
}



module.exports = router;
