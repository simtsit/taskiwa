var express = require('express');
var router = express.Router();

var Project = require('../models/project');


// Get /history page
router.get('/',
    ensureAuthenticated,    // Check if user is connected
    getProjectsByUserId,    // Get all projects of or for this user
    function(req, res){
        res.render('history', {
            title: "History",
            projects: req.relatedProjects,
            user: req.user,
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


// This function returns all the projects where:
// - user is owner
// - are shared with this user
function getProjectsByUserId(req, res, next){
  Project.find({ $or:[
      {owner: req.user._id },
      {users: req.user._id }
  ]}).populate('owner')
  .populate('users')
  .populate('tasks')
  .populate('tasktypes')
  .populate('taskgroups')
  .exec( function(err, relatedProjects) {
      console.log(relatedProjects);
      req.relatedProjects = relatedProjects;
      next();
  });
}

module.exports = router;
