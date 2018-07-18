var express = require('express');
var router = express.Router();

var Project = require('../models/project');


// Get Trash Can page
router.get('/',
    ensureAuthenticated,            // Check if user is connected
    getDeletedProjectsByUsername,   // Gets all deleted projects of or for this user
    getActiveProjectsByUsername,    // Get all projects of or for this user
    function(req, res){

      res.render('trashglobal', {
          title: "Trash Bin (Global)",
          trashProjects: req.trashProjects,
          projects: req.relatedProjects
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
function getDeletedProjectsByUsername(req, res, next){
  Project.find({
      $and: [
          {$or: [
              {owner: req.user._id},
              {users: req.user._id}
          ]},
          {status: "deleted" }
    ]}).populate('tasks')
    .populate('owner')
    .populate('users')
    .exec(function(err, trashProjects) {

      req.trashProjects = trashProjects;
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
    ]}).populate('tasks')
    .populate('owner')
    .populate('users')
    .exec(function(err, relatedProjects) {

      req.relatedProjects = relatedProjects;
      next();
  });
}

module.exports = router;
