var moment = require('moment');
var express = require('express');
var router = express.Router();

var Project = require('../models/project');
var User = require('../models/user');
var Task = require('../models/task');
var TaskType = require('../models/tasktype');
var Log = require('../models/log');


// This funciton is related to /tasks page.
// It will load all Tasks related to this user,
// meaning Tasks created by him or shared with him.
router.get('/',
    ensureAuthenticated,            // Check if user is connected
    getActiveProjectsByUserId,      // Get all active projects of or for this user
    function(req, res){
		res.render('tasks', {
			title: "Tasks Page",
            projects: req.relatedProjects
		});
    });


// This function is related to /tasks/addtask/:projectId page.
// It will load a form so User can add a Task to a specific Project, based
// on Project ID.
router.get('/addtask/:projectId',
    ensureAuthenticated,            // Check if user is connected
    findThisProject,                // Find specific Project based on it ID.
    function(req, res){
    	res.render('addtask', {
    		title: "Add Task",
    		project: req.currentProject,
    	});
    });


// This function adds a new Task in the Database.
// It reads input from /tasks/addtask/:projectId page, then creates the new
// Task and redirects to View Project page. It will also add a ref link to This
// Project plust a related entry in history log.
router.post('/addtask/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    createNewTask,             // Create thew new Task.
    function(req, res){
        res.redirect('/projects/view/' + req.currentProject._id);
});


// This function is related to /tasks/viewtask/:projectID/:taskId page.
// It has one and only puprose: to load the requested Task (based on it
// ID) and display it.
router.get('/view/:taskId',
    ensureAuthenticated,    // Check if user is connected
    // findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    function(req, res){
        res.render('viewtask', {
            title: "View Task",
            project: req.currentProject,
            task: req.currentTask
        });
    });


// This function adds a comment to a Task
router.post('/commentTask/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    addCommentToTask,       // Add the comment
    function(req, res){
        res.redirect('/tasks/view/' + req.currentProject._id + "/" + req.currentTask._id);
    });



// This function changes the status of a specific Task (based on it ID) to
// "deleted". Then the Task shows only in Trash Bin. The task must belong to
// a specific Project (based on it ID) and after the change there is a
// related entry at History Log.
router.post('/moveTaskToTrash/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    setTaskStatusToDeleted, // Changes Task Status to "deleted"
    function(req, res){
        res.redirect('/projects/view/' + req.params.projectId);
    });


// This function changes the status of a specific Task (based on it ID) to
// "open". Then the Task doesn't appear in Trash Bin any logner. The task
// must belong to a specific Project (foung by it ID) and after the change
// there is a related entry at History Log.
router.post('/restoreTaskFromTrash/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    setTaskStatusToOpen,   // Changes Task Status to "open"
    function(req, res){
        res.redirect('/trash');
    });


// This function changes the status of a specific Task (based on it ID) to
// "deleted". Then the Task shows only in Trash Bin. The task must belong to
// a specific Project (based on it ID) and after the change there is a
// related entry at History Log.
router.post('/closeTask/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    setTaskStatusToClosed, // Changes Task Status to "deleted"
    function(req, res){
        res.redirect('/projects/view/' + req.params.projectId);
    });


// This function permanently removes a Task (based on it ID). The Task must
// be of status "deleted". Right after, the function adds a related entry
// History Log. Deleting a Task is a non-reversable action.
router.post('/removeTask/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    removeThisTask,         // Permanently Delete this Task.
    function(req, res){
        res.redirect('/trash');
    });


// This function is related to /tasks/edittask/:projectId/:taskId page.
// It will provide a a form to edit a specific Task (based on it ID) and from
// a specific Project (based on it ID also).
router.get('/edittask/:projectId/:taskId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTask,           // Find specific Task based on it ID.
    function(req, res){
      	res.render('edittask', {
    		title: 'Edit Task "' + req.currentTask.title + '"',
    		project: {
                _id: req.currentProject._id,
                owner: req.currentProject.owner,
                users: req.currentProject.users,
                tasks: req.currentProject.tasks
            },
            tasktypes: req.currentProject.tasktypes,
            task: req.currentTask
        });
    });


// This function will check if Task Title of a specific Task (found by it
// ID) has been changed and if yes, it will save the change.
// It will also make a related log entry.
router.post('/editTaskTitle/:projectId/:taskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    changeTaskTitle,           // if Title is changed, save it and log it!
    function(req, res){
        res.redirect('/tasks/edittask/' + req.params.projectId + '/' + req.params.taskId);
    });


// This function will check if Task Description of a specific Task (found by
// it ID) has been changed and if yes, it will save the change.
// It will also make a related log entry.
router.post('/editTaskDescription/:projectId/:taskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    changeTaskDescription,   // if Description is changed, save it and log it!
    function(req, res){
        res.redirect('/tasks/edittask/' + req.params.projectId + '/' + req.params.taskId);
    });


// This function will check if Task Priority of a specific Task (found by
// it ID) has been changed and if yes, it will save the change.
// It will also make a related log entry.
router.post('/editTaskPriority/:projectId/:taskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    changeTaskPriority,      // if Priority is changed, save it and log it!
    function(req, res){
        res.redirect('/tasks/edittask/' + req.params.projectId + '/' + req.params.taskId);
    });


// Add Task Connection
router.post('/addTaskConnection/:projectId/:taskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    createTaskConnection,    // Add the connection between Tasks.
    function(req, res){
        res.redirect('/tasks/editTask/' + req.params.projectId + '/' + req.params.taskId);
    });


// Remove Task Connection
router.post('/removeTaskConnection/:projectId/:taskId/:connectedTaskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    deleteTaskConnection,    // Delete this connection between Tasks.
    function(req, res){
        res.redirect('/tasks/editTask/' + req.params.projectId + '/' + req.params.taskId);
    });


// Add User in Task
router.post('/addUser/:projectId/:taskId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    findThisUserById,        // Find specific User based on his ID
    addUserToTask,           // Add this User to this Task.
    function(req, res){
        res.redirect('/tasks/editTask/' + req.params.projectId + '/' + req.params.taskId);
    });


// Remove User from Task
router.post('/removeUser/:projectId/:taskId/:userId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    findThisTask,            // Find specific Task based on it ID.
    removeUserFromTask,      // Removes a User from the Task.
    function(req, res){
        res.redirect('/tasks/editTask/' + req.params.projectId + '/' + req.params.taskId);
    });





//---------------- //
// Middleware      //
//---------------- //


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
        ]}).populate('tasktypes')
        .populate('tasks')
        .populate('owner')
        .populate('users')
        .exec(function(err, currentProject) {
            if (err) throw err;
            req.currentProject = currentProject;
            next();
        });
}


// This function returns a specific Task based on it ID. The Task must
// belong to a Project based on a specific ID as well.
function findThisTask(req, res, next){
    Task.findById(req.params.taskId)
    .populate('project')
    .populate('tasktypes')
    .populate('owner')
    .populate('users')
    // .populate('comments')
    .populate('comments.parent')
    .populate('comments.user')
    .exec(function(err, currentTask) {
        req.currentTask = currentTask;
        next();
    });
}


// This function will change Task's title and then save a related
// entry at history log.
function changeTaskTitle(req, res, next){

    var newTaskTitle = req.body.taskTitle;

    // if Task title have been changed...
    if (newTaskTitle != req.currentTask.title) {
        var logDescription = 'User @' + req.user.username + ' changed Task Title from "' + req.currentTask.title + '" to "' + newTaskTitle + '".';
        var logEntry = {
            user: {
              username: req.user.username
            },
            created: {
              date: new moment().format("DD/MM/YY"),
              time: new moment().format("HH:mm:ss")
            },
            action:{
              type: "Task",
              method: "Edit",
              result: req.currentTask._id
            },
            description: logDescription
        };
        req.currentTask.title = newTaskTitle;
        req.currentTask.log.push(logEntry);
        req.currentTask.save();
        req.flash('success_msg', 'Task Title Changed');
        } else {
        req.flash('success_msg', 'Nothing Changed!');
        }
        next();
}



function changeTaskDescription(req, res, next){
  var newTaskDescription = req.body.taskDescription;
  if (newTaskDescription != req.currentTask.description) {
      var logDescription = 'User @' + req.user.username + ' changed Task Description from "' + req.currentTask.description + '" to "' + newTaskDescription + '".';
      var logEntry = {
        user: {
          username: req.user.username
        },
        created: {
          date: new moment().format("DD/MM/YY"),
          time: new moment().format("HH:mm:ss")
        },
        action:{
          type: "Task",
          method: "Edit",
          result: req.currentTask._id
        },
        description: logDescription
      };
      req.currentTask.description = newTaskDescription;
      req.currentTask.log.push(logEntry);
      req.currentTask.save();
      req.flash('success_msg', 'Task Description Changed');
    } else {
      req.flash('success_msg', 'Nothing Changed!');
    }
    next();
}


// This function will change the Task's priority and save a related entry
// to history log.
function changeTaskPriority(req, res, next){
  var newTaskPriority = req.body.taskPriority;
  if (newTaskPriority != req.currentTask.priority) {
      var logDescription = 'User @' + req.user.username + ' changed Task Priority from "' + req.currentTask.priority + '" to "' + newTaskPriority + '".';
      var logEntry = {
        user: {
          username: req.user.username
        },
        created: {
          date: new moment().format("DD/MM/YY"),
          time: new moment().format("HH:mm:ss")
        },
        action:{
          type: "Task",
          method: "Edit",
          result: req.currentTask._id
        },
        description: logDescription
      };
      req.currentTask.priority = newTaskPriority;
      req.currentTask.log.push(logEntry);
      req.currentTask.save();
      req.flash('success_msg', 'Task Priority Changed');
    } else {
      req.flash('success_msg', 'Nothing Changed!');
    }
    next();
}


// This function returns a specific User based on it ID.
// User must be "active" and not "banned".
// This function returns a specific User based on his Username.
function findThisUserById(req, res, next) {
  User.findOne({_id: req.body.userToAdd}, function(err, currentUser) {
      // if (err) throw err;
      req.currentUser = currentUser;
      next();
  });
}


// This function returns all the active projects where:
// - user is owner
// - are shared with this user
function getActiveProjectsByUserId(req, res, next){
  Project.find({
      $and: [
          {$or: [
              {owner: req.user._id},
              {users: req.user._id}
          ]},
          {status: "active" }
    ]})
    .populate({ path: 'tasks',
                populate: { path: 'type'}
            })
    .populate('owner')
    .populate('users')
    .exec(function(err, relatedProjects) {

      req.relatedProjects = relatedProjects;
      next();
  });
}


// This function creates a new Task and then adds the ref ID to the parent
// Project (found by it ID). It will add a related log entry right after.
function createNewTask(req, res, next){

    var taskTitle = req.body.taskTitle.trim();

    // if Task title is too long, cancel the action.
    if (taskTitle.length > 40) {
        req.flash('error_msg', 'Task Title is too long!');
        return next();
    }

    // If the Task title is empty, cancel the action also.
    if(taskTitle.length == 0) {
        req.flash('error_msg', "Task Title can't be empty!");
        return next();
    }

    var comments;

    // Create the Task Entry
    var newTask = new Task({
        project: {
            _id: req.currentProject._id
        },
        owner: {
            _id: req.user._id
        },
        title: taskTitle,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        priority: req.body.taskPriority,
        description: req.body.taskDescription,
        type: {
            _id: req.body.taskType
        },
        // users: {},
        loc: {
            x: 10,
            y: 10
        },
        comments: comments,
        assets: {},
        log: {},
        //   connections: connections,
        status: 'open'
    });

    // Create the new Task
    Task.createTask(newTask, function(err, task){
        if(err) throw err;

        // Add Reference to the Project
        req.currentProject.tasks.push(task._id);

        // Create Log entry
        var newLog = new Log({
            project: req.currentProject._id,
            task: newTask._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Task",
                method: "Create"
            }
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        // Save the Project
        req.currentProject.save();
    });

    req.flash('success_msg', 'Task Created');
    next();
}


// This function changes Task Status to "deleted" and saves the change to
// Database. It will also add a related entry to log plus it will return an
// informational message to screen.
function setTaskStatusToDeleted(req, res, next){
    req.currentTask.status = 'deleted';

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "Delete"
        },
        description: 'user:' + req.user._id + ' moved task:' + req.currentTask._id + ' to Trash.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    // Save the Project
    req.currentTask.save();

    req.flash('success_msg', 'Task Moved to Trash Bin!');
    next();
}


// This function changes Task Status to "open" and saves the change to
// Database. It will also add a related entry to log plus it will return an
// informational message to screen.
function setTaskStatusToOpen(req, res, next){

    if (req.currentTask.status == "closed") {
        req.flash('success_msg', 'Task Opened!');
        var logDescription = 'user:' + req.user._id + ' re-opened task:' + req.currentTask._id + '.';
        var logMethod = "Open";
    }

    if (req.currentTask.status == "deleted") {
        req.flash('success_msg', 'Task Restored!');
        var logDescription = 'user:' + req.user._id + ' restored task:' + req.currentTask._id + ' from Trash.';
        var logMethod = "Restore";
    }


    req.currentTask.status = 'open';

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: logMethod
        },
        description: logDescription
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    // Save the Project
    req.currentTask.save();
    next();
}


// This function deletes permanently a specific Task. Only owner should perform
// this action. There is no need to keep log for a totaly deleted Project.
function removeThisTask(req, res, next){

    // Permanently delete this project.
    req.currentTask.remove();

    req.flash('success_msg', 'Task Permanently Deleted.');
    next();
}




// This function changes Task Status to "deleted" and saves the change to
// Database. It will also add a related entry to log plus it will return an
// informational message to screen.
function setTaskStatusToClosed(req, res, next){
    req.currentTask.status = 'closed';

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "Close"
        },
        description: 'user:' + req.user._id + ' closed task:' + req.currentTask._id + '.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    // Save the Project
    req.currentTask.save();

    req.flash('success_msg', 'Task is Closed!');
    next();
}


// This function creates a connection between tasks and adds it to the Source
// Task. It will add a related log entry right after.
function createTaskConnection(req, res, next){

    // Construct the connection entry
    var taskConnectionEntry = {
        to: req.body.taskToConnect
    };

    // Push the connection and save...
    req.currentTask.connections.push(taskConnectionEntry);
    req.currentTask.save();

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "Connection"
        },
        description: 'user:' + req.user._id + ' connected task: ' + req.currentTask._id + ' with task:' + req.body.taskToConnect + '.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Connection Added!');
    next();
}


// This function permanently deletes a connection between tasks from the Source
// Task. It will add a related log entry right after.
function deleteTaskConnection(req, res, next){

    // Remove the connection and save...
    req.currentTask.connections.remove({to: req.params.connectedTaskId});
    req.currentTask.save();

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "Connection"
        },
        description: 'user:' + req.user._id + ' removed connection of task: ' + req.currentTask._id + ' with task:' + req.body.taskToConnect + '.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Connection Removed!');
    next();
}


// This function will add a User to a Task and then it will make a
// related log entry.
function addUserToTask(req, res, next){

    // Add the User ID and save...
    req.currentTask.users.push(req.currentUser._id);
    req.currentTask.save();

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "User"
        },
        description: 'user:' + req.user._id + ' added user:' + req.currentUser._id + ' to task:' + req.currentTask._id + '.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'User Added!');
    next();
}


// This function finds a User based on his ID from Parameters and removes
// him from the Task. It will add a related log entry right after.
function removeUserFromTask(req, res, next){

    // Find this User from Parameters...
    User.findOne({_id: req.params.userId}, function(err, currentUser) {
        if (err) throw err;
        req.currentUser = currentUser;

        // ... and then remove him from the Task Users and save.
        req.currentTask.users.remove(req.params.userId);
        req.currentTask.save();

        // Create Log entry
        var newLog = new Log({
            parent: req.currentTask._id,
            user: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Task",
                method: "User"
            },
            description: 'user:' + req.user._id + ' remove user:' + req.currentUser._id + ' from task:' + req.currentTask._id + '.'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });
    });

    req.flash('success_msg', 'User Removed!');
    next();
}




// this function adds a comment bla bla bla
function addCommentToTask(req, res, next){

    var commentEntry = {
        parent: req.currentProject._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
    body: req.body.taskComment,
    };

    // Add the Comment and save the Task.
    req.currentTask.comments.push(commentEntry);
    req.currentTask.save();

    // Create Log entry
    var newLog = new Log({
        parent: req.currentTask._id,
        user: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Task",
            method: "Comment"
        },
        description: 'user:' + req.user._id + ' commented on task:' + req.currentTask._id + '.'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Comment added!');
    next();
}


module.exports = router;
