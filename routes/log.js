var moment = require('moment');
var express = require('express');
var router = express.Router();

var Task = require('../models/task');
var Project = require('../models/project');
var User = require('../models/user');
var TaskType = require('../models/tasktype');
var TaskGroup = require('../models/taskgroup');
var Log = require('../models/log');



//------------------------ //
// Pages (router.get)      //
//------------------------ //

// This funciton is related to /projects page.
// It will load all Projects related to this user,
// meaning Projects owned by him or shared with him.
router.get('/',
    ensureAuthenticated,    // Check if user is connected
    getProjectsByUserId,    // Get all projects of or for this user
    createLogSearchList,    // Find Projects and Users related to this User.
    fetchLogEntries,        // Get the Log Entries related.
    function(req, res){
        // console.log(req.searchList);
		res.render('history', {
			title: "History",
            projects: req.relatedProjects,
            logEntries: req.logEntries
		});
    });



//------------------------ //
// Functions (Middleware)  //
//------------------------ //


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


// This function returns all projecets related to a specific User (based on
// his ID. User must be owner of a Project or Project must be shared with him.
function getProjectsByUserId(req, res, next){
  Project.find({ $or:[
      {owner: req.user._id },
      {users: req.user._id }
  ]}).populate('owner')
  .populate('users')
  // .populate('project')
  // .populate('tasks')
  // .populate('tasktypes')
  // .populate('taskgroups')
  .exec( function(err, relatedProjects) {
    //   console.log(relatedProjects);
      req.relatedProjects = relatedProjects;
      next();
  });
}


// This function will create a list with all all Project IDs related to
// a specific user.
function createLogSearchList(req, res, next){
    var searchList=[];

    // Add related projects to the search list.
    for (var i=0; i<req.relatedProjects.length; i++) {

        searchList.push(req.relatedProjects[i]._id);

        // if owner is not already in the list...
        if (searchList.indexOf(req.relatedProjects[i].owner._id)) {
            // ...add the owner to the search list.
            searchList.push(req.relatedProjects[i].owner._id);
        }

        // add their users in the search list.
        for (var k=0; k<req.relatedProjects[i].users.length; k++){
            // if the user is not already in the list...
            if (searchList.indexOf(req.relatedProjects[i].users[k]._id)) {
                // ...add this user to the search list.
                searchList.push(req.relatedProjects[i].users[k]._id);
            }
        }
    }

    req.searchList = searchList;
    next();
}


// This function will read the SearchList and find all related log entries.
function fetchLogEntries(req, res, next){
    Log.find({})
    .populate('project')
    .populate('owner')
    .populate('user')
    .populate('task')
    .exec(function (err, logEntries){

        // console.log(logEntries);

        if(err) throw err;

        req.logEntries = logEntries;
        next();
    });
}

module.exports = router;
