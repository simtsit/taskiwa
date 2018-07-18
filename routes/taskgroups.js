var moment = require('moment');
var express = require('express');
var router = express.Router();

var Task = require('../models/task');
var Project = require('../models/project');
var User = require('../models/user');
var TaskGroup = require('../models/taskgroup');
var Log = require('../models/log');



//------------------------ //
// Pages (router.get)      //
//------------------------ //


// This function will load the page /edit/:projectId/:taskGroupID.
// It contains forms to edit the Task Group properties, add or remove
// tasks in the group and change the Group Color.
router.get('/edit/:projectId/:taskGroupId',
    ensureAuthenticated,
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Task Gtoup based on it ID.
    function(req, res){

        res.render('edittaskgroup', {
            title: "Edit Task Group",
            project: req.currentProject,
            taskgroup: req.currentTaskGroup
    	});
});



//------------------------ //
// Functions (router.get)  //
//------------------------ //


// This function changes a Task Type Name from a specific Project, (based on it
// ID). After change, a related entry is written at History Log.
router.post('/editTaskGroupName/:projectId/:taskGroupId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Task Gtoup based on it ID.
    // isUserTheOnwer,      // Only Project Owner can delete Task Types
    changeTaskGroupName,    // if Name is changed, save it and log it!
    function(req, res){
      res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
});


// This function adds a user (found by his username) to a specific Project
// based on Project ID. Owner can't be added to Project Users. Action is
// saved at history log.
router.post('/addTask/:projectId/:taskGroupId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Project based on it ID.
    // findThisTask,           // Find specific Task based on it ID.
    function(req, res){

        Task.findOne({ _id: req.body.taskToAdd}, function(err, currentTask) {
            // if (err) throw err;
            req.currentTask = currentTask;

            // Check if task is already grouped...
            for (var i=0; i<req.currentTaskGroup.tasks.length; i++) {
              if (req.currentTaskGroup.tasks[i]._id == req.body.taskToAdd) {
                req.flash("error_msg", "Task is already added!");
                res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
                return;
              }
            }

            req.currentTaskGroup.tasks.push(req.currentTask._id);
            req.currentTaskGroup.save();

            // Create a log entry
            var newLog = new Log({
                project: req.params.projectId,
                task: req.currentTask._id,
                owner: req.user._id,
                created: {
                    date: new moment().format("DD/MM/YY"),
                    time: new moment().format("HH:mm:ss")
                },
                action: {
                    category: "Project",
                    method: "Task Group Task"
                },
                description: 'added Task "' + req.currentTask.title +'" to Task Group from "' + req.currentTaskGroup.name + ''
            });

            // Save the log entry
            Log.createLog(newLog, function(err, log){
                if (err) throw err;
            });

            req.flash('success_msg', 'Task Added!');
            res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);

        });

});


// This function adds a user (found by his username) to a specific Project
// based on Project ID. Owner can't be added to Project Users. Action is
// saved at history log.
router.post('/removeTask/:projectId/:taskGroupId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    removeTaskFromTaskGroup,// Remove this Task from this Task Group
    function(req, res){
        res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
});


// This function changes the color of a specific Task Group (based on it ID)
// and then adds a related entry at History Log.
router.post('/editColor/:projectId/:taskGroupId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Project based on it ID.
    changeTaskGroupColor,   // if Color is changed, save it and log it!
    function(req, res){
        res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
    });


// This function adds a Task Group to a specific Project based on Project ID.
// The newly created Task Group is empty of Tasks and has some basic by default
// values filled in. Afther creation, a related entry is added to history log.
router.post('/removeTaskGroup/:projectId/:taskGroupId',
ensureAuthenticated,    // Check if user is connected
findThisProject,        // Find specific Project based on it ID.
findThisTaskGroup,      // Find specific Project based on it ID.
removeThisTaskGroup,    // Permanently delete this Task Group.
function(req, res){
    res.redirect('/projects/edit/' + req.currentProject._id);
});


// This function changes a Task Type Name from a specific Project, (based on it
// ID). After change, a related entry is written at History Log.
router.post('/editTaskGroupColor/:projectId/:taskTypeId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,       // Find specific Task Type based on it ID.
    // isUserTheOnwer,         // Only Project Owner can delete Task Types
    changeTaskTypeColor,     // if Name is changed, save it and log it!
    function(req, res){
    	res.redirect('/projects/edit/' + req.params.projectId);
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


// This function returns a specific Project
// based on it ID. User must be owner of this Project
// or Project must be shared with him.
function findThisProject(req, res, next){
  Project.findOne({
      $and: [
          {$or: [
              {owner: req.user._id},
              {users: req.user._id}
          ]},
          {_id: req.params.projectId }
      ]}).populate('owner')
      .populate('users')
      .populate('tasks')
      .populate('tasktypes')
      .populate('taskgroups')
      // .populate({path: 'tasks.type'})
      .exec(function(err, currentProject) {

          //   if (err) throw err;
          if (err) {
              res.redirect('/page-not-found');
          }

          if(currentProject == null){
              res.redirect('/access-denied');
          }

            req.currentProject = currentProject;
            next();
        });
      }


// This function returns all Active tasks of a Project.
function getActiveTasks(req, res, next){

    // Task.find({$in: {"_id": req.currentProject.tasks}}, function (err, tasks){
    // Task.find({ _id: { $in: req.currentProject.tasks } }, function (err, tasks){

    // req.currentProject.aggregate()
    //                     .match({status: "active"})
    //                     .exec(callback);
    //
    //                     console.log(callback);
    //
    //     req.activeTasks = tasks;
        next();
}


// This funciton changes the Task Group Name for a specific Task Group (based
// on it ID) and then adds a related entry to history log.
function changeTaskGroupName(req, res, next) {

    var newTaskGroupName = req.body.taskGroupName;

    if (newTaskGroupName != req.currentTaskGroup.name){
        var logDescription = 'User @' + req.user.username + ' Changed Task Group Name from "' + req.currentTaskGroup.name + '" to "' + req.body.taskGroupName +'" in Project #' + req.currentProject._id + '.';

        // Create a log entry
        var newLog = new Log({
            project: req.params.projectId,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Project",
                method: "Task Group Edit"
            },
            description: 'changed Task Group name from "' + req.currentTaskGroup.name + '" to "' + newTaskGroupName + '"'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        req.currentTaskGroup.name = newTaskGroupName;
        req.currentTaskGroup.save();

        req.flash('success_msg', 'Task Group Name Changed!');
    } else {
        req.flash('success_msg', 'Nothing Changed!');
        res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
        return;
    }
    next();
}


// This funciton changes the Task Group Color  for a specific Task Group (based
// on it ID) and then adds a related entry to history log.
function changeTaskTypeColor(req, res, next) {

  var newTaskTypeColor = req.body.actualTaskTypeColor;
  if (newTaskTypeColor != req.currentTaskType.color) {

      req.currentTaskType.color = newTaskTypeColor;
      req.currentTaskType.save();

      var newLog = new Log({
          project: req.params.projectId,
          owner: req.user._id,
          created: {
              date: new moment().format("DD/MM/YY"),
              time: new moment().format("HH:mm:ss")
          },
          action: {
              type: "Project",
              method: "Edit Task Type",
          },
          description: 'changed Task Group color from ' + req.currentTaskGroup.name + ' to ' + newTaskGroupName + ''
      });

      // Save the log entry
      Log.createLog(newLog, function(err, log){
          if (err) throw err;
      });

      req.flash('success_msg', 'Task Type Color Changed!');
    } else {
      req.flash('success_msg', 'Nothing Changed!');
      res.redirect('/projects/edit/' + req.currentProject._id);
      return;
    }
    next();
}

// This function returns a specific Task Group based on it ID.
function findThisTaskGroup(req, res, next){
  TaskGroup.findOne( {_id: req.params.taskGroupId})
  .populate('creator')
  .populate('tasks')
  .exec(function(err, currentTaskGroup) {

      // if (err) throw err;

      req.currentTaskGroup = currentTaskGroup;
      next();
  });
}


// This function returns a specific Task based on it ID. The Task must
// belong to a Project based on a specific ID as well.
function findThisTask(req, res, next){
    Task.findOne({ _id: req.params.taskId}, function(err, currentTask) {

        // if (err) throw err;

        req.currentTask = currentTask;
        next();
    });
}


// This function changes the color for a specific Task Group, based on it ID.
// If the color has been changed, there is an error message and exit. If it
// has been changed, it will save the change and add a related log entry.
function changeTaskGroupColor(req, res, next){

    // Check if it's the same color...
    if (req.currentTaskGroup.color == req.body.taskGroupColor) {
        req.flash("error_msg", "It's the same color!");
        res.redirect('/taskgroups/edit/' + req.currentProject._id + '/' + req.currentTaskGroup._id);
        return;
    }

    var oldTaskGroupColor = req.currentTaskGroup.color;

    req.currentTaskGroup.color = req.body.taskGroupColor;
    req.currentTaskGroup.save();

    // Create a log entry
    var newLog = new Log({
        project: req.params.projectId,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Task Group Edit"
        },
        description: 'changed Task Group Color from ' + oldTaskGroupColor + ' to ' + req.currentTaskGroup.color + ''
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Color Changed!');
    next();
}


// This function removes a specific Task (based on it ID) from a specific
// Task Group (based on it ID). It will add then a related log entry.
function removeTaskFromTaskGroup(req, res, next){
    req.currentTaskGroup.tasks.remove(req.currentTask._id);
    req.currentTaskGroup.save();

    // Create a log entry
    var newLog = new Log({
        project: req.params.projectId,
        task: req.currentTask._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Task Group Task"
        },
        description: 'removed Task "' + req.currentTask.title +'" from Task Group "' + req.currentTaskGroup.name + ''
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Task Removed!');
    next();
}


// This function will permanently delete a Task Group (based on it ID) and it
// will add then a related log entry.
function removeThisTaskGroup(req, res, next){
    req.currentTaskGroup.remove();

    // Create a log entry
    var newLog = new Log({
        project: req.params.projectId,
        task: req.currentTask._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Task Group Task"
        },
        description: 'deleted task group ' + req.currentTaskGroup.name + ''
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });
    req.flash('success_msg', 'Task Group Deleted!');
    next();
}

module.exports = router;
