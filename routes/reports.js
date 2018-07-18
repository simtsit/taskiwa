var moment = require('moment');
var express = require('express');
var router = express.Router();

var Project = require('../models/project');
var User = require('../models/user');
var Task = require('../models/task');
var TaskType = require('../models/tasktype');





// #F01 - Get Projects Page - Loads the /projects page.
// This page displays all the projects related to this user.
// That means projectes owned by him or shared by him.
router.get('/',
    ensureAuthenticated,            // Check if user is connected
    function(req, res){

		res.render('Reports', {
			title: "Reports Page",
		});
});



// Middleware //

// This function ensure if user is logged in.
// If not, moves him to /login page.
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}



module.exports = router;
