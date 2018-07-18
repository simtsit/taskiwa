var express = require('express');
var router = express.Router();

var Project = require('../models/project');


// Get Homepage
router.get('/',
    ensureAuthenticated,            // Check if user is connected
    getActiveProjectsByUsername,    // Get all active projects of or for this user
    seperateProjects,               // Count owned and shared projects
    function(req, res){

      res.render('dashboard', {
          title: "Dashboard",
          projects: req.relatedProjects,
          projectsOwned: req.projectsOwned,
		      projectsShared: req.projectsShared,
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

module.exports = router;
