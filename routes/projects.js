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


// This function will load /projects page.
// It includes all the Projects related related to this user,
// meaning Projects owned by him or shared with him.
router.get('/',
    ensureAuthenticated,            // Check if user is connected
    getActiveProjectsByUsername,    // Get all active projects of or for this user
    seperateProjects,               // Count owned and shared projects
    function(req, res){
		res.render('projects', {
			title: "Projects",
			projects: req.relatedProjects,
            projectsOwned: req.projectsOwned,
            projectsShared: req.projectsShared
		});
    });


// This function will load /projects/new page.
// It includes a form so the user can add a new project.
router.get('/new',
    ensureAuthenticated,            // Check if user is connected
    function(req, res){
        res.render('addproject', {
            title: "Add New Project",
        });
    });


// This function will load /projects/view/:projectId page.
// This is the main Project View page. It will display a specific will Project
// (based on it ID). The project must be active and the user must be related to
// it. He must be the Project owner or Project must be shared with him.
router.get('/view/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    // getActiveTasks,      // Find the active Tasks for this Project.
    function(req, res){
        // res.render('vp4_2', {
        res.render('vpm_2', {
            title: req.currentProject.name,
            project: req.currentProject,
            // tasks: req.activeTasks
            tasks: req.currentProject.tasks
    	});
});


// This function will load /projects/edit/:projectId page.
// It contains a form where the User can change varius values within a specific
// Project (based on it ID). The Project must  be active and the User must be
// related to it (must be the Project owner or Project must be shared with him.)
router.get('/edit/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    function(req, res){
  	res.render('editproject', {
  		title: 'Edit Project "' + req.currentProject.name + '"',
  		project: req.currentProject,
  	});
});



//------------------------ //
// Functions (router.post) //
//------------------------ //

// This function adds a new project in the Database.
// It reads input from /projects/new page, then creates the new Project and
// redirects to /dashboard .
router.post('/add',
    ensureAuthenticated,            // Check if user is connected
    createProject,               // Create the new Project
    function(req, res){
        res.redirect('/dashboard');
    });


// This function will check if Project Name of a specific Project
// (based on it ID) has been changed and if yes, it will save the change.
// It will also make a related log entry.
router.post('/editProjectName/:projectId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    changeProjectName,       // if Name is changed, save it and log it!
    function(req, res){
        res.redirect('/projects/edit/' + req.currentProject._id);
    });


// This function will check if Project Description of a specific Project
// (based on it ID) has been changed and if yes, it will save the change.
// It will also make a related log entry.
router.post('/editProjectDescription/:projectId',
    ensureAuthenticated,     // Check if user is connected
    findThisProject,         // Find specific Project based on it ID.
    changeProjectDescription,  // if Name is changed, save it and log it!
    function(req, res){
        res.redirect('/projects/edit/' + req.currentProject._id);
    });


// This function changes the Project Status to "deleted" for a specific Project,
// (based on it ID). In that way the project will be only visible in trash bin.
// The function will also make a related log entry.
router.post('/moveProjectToTrash/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    setProjectStatusToDeleted, // Changes Project Status to "deleted".
    function(req, res){
        // if(req.currentProject == null){
        //     res.redirect('/access-denied');
        // } else {
            res.redirect('/dashboard');
        // }
    });


// This function changes the Project Status to "active" for a specific Project,
// (based on it ID). In that way the project will be again visible in dashboard
// and no longer in trash bin. It also makes a related log entry.
router.post('/restoreProjectFromTrash/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    setProjectStatusToActive, // Changes Project Status to "active".
    function(req, res){
        res.redirect('/trash');
    });


// This function pernamenty deletes a Project, based on it Project ID.
// This move can take action from the /trash page. This aciton is not
// reversable.
router.post('/deleteProject/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    deleteThisProject,      // Permanently Delete this Project
    function(req, res){
        res.redirect('/trash');
    });


// This function adds a user (found by his username) to a specific Project
// based on Project ID. Owner can't be added to Project Users. Action is
// saved at history log.
router.post('/addUser/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisUserByEmail,    // Find specific Project based on Email.
    // addUserToProject,       // Add this User to this Project.
    function(req, res){

        // If none was found...
        if (!req.currentUser){
            req.flash("error_msg", "Can't find this user!");
            res.redirect('/projects/edit/' + req.currentProject._id);
            return;
        }

        // Check if user is already added...
        for (var i=0; i<req.currentProject.users.length; i++) {
            if (req.currentProject.users[i].username == req.currentUser.username) {
                req.flash("error_msg", "User already added!");
                res.redirect('/projects/edit/' + req.currentProject._id);
                return;
            }
        }

        // in case the user to add is the project owner...
        if (req.currentUser.username == req.user.username){
            req.flash("error_msg", "Project Owner can't be in Users too!");
            res.redirect('/projects/edit/' + req.currentProject._id);
            return;
        } else {

            // If all controls passed, add this user to the project
            req.currentProject.users.push(req.currentUser._id);
            req.currentProject.save();

            // req.currentUser.keyring.push(req.currentProject._id);
            // req.currentUser.save();

            // Create a log entry
            var newLog = new Log({
                project: req.currentProject._id,
                user: req.currentUser._id,
                owner: req.user._id,
                created: {
                    date: new moment().format("DD/MM/YY"),
                    time: new moment().format("HH:mm:ss")
                },
                action:{
                    category: "Project",
                    method: "User Add",
                }
            });

            // Save the log entry
            Log.createLog(newLog, function(err, log){
                if (err) throw err;
            });

            req.flash('success_msg', 'User Added!');
        }
        res.redirect('/projects/edit/' + req.currentProject._id);
    });


// This function removes a user (found by his username) from a specific Project
// based on Project ID. This action is saved at history log. Removing a user
// is a non-reversable action.
router.post('/removeUser/:projectId/:userId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisUserById,       // Find specific Project based on his ID.
    removeThisUserFromProject, // Remove this User from this Project
    function(req, res){
        res.redirect('/projects/edit/' + req.params.projectId);
    });


// This function creates a new Task Type for a specific Project, based on
// it ID. Right after, a related entry is added to History Log.
router.post('/addTaskType/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    createTaskType,         // Create a Task Type.
    function(req, res){
        res.redirect('/projects/edit/' + req.currentProject._id);
    });


// This function removes a Task Type from a specific Project, (based on it ID).
// If there are tasks of this Task Type in the Project, the deletion can't
// happen and a related message follows. If not, Task Type is permanently
// deleted and a related log entry is written in History Log. Only Project Owners
// should be able to delete Task Types.
router.post('/removeTaskType/:projectId/:taskTypeId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskType,       // Find specific Task Type based on it ID.
    // isUserTheOnwer,         // Only Project Owner can delete Task Types
    isTaskTypeEngaged,      // Does any Task use this Task Type?
    removeThisTaskType,     // Permanently delete this Task Type
    function(req, res){
    	res.redirect('/projects/edit/' + req.params.projectId);
    });


// This function changes a Task Type Name from a specific Project, (based on it
// ID). After change, a related entry is written at History Log.
router.post('/editTaskTypeName/:projectId/:taskTypeId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskType,       // Find specific Task Type based on it ID.
    // isUserTheOnwer,         // Only Project Owner can delete Task Types
    changeTaskTypeName,     // if Name is changed, save it and log it!
    function(req, res){
        res.redirect('/projects/edit/' + req.params.projectId);
    });


// This function changes a Task Type Name from a specific Project, (based on it
// ID). After change, a related entry is written at History Log.
router.post('/editTaskTypeColor/:projectId/:taskTypeId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskType,       // Find specific Task Type based on it ID.
    // isUserTheOnwer,         // Only Project Owner can delete Task Types
    changeTaskTypeColor,     // if Name is changed, save it and log it!
    function(req, res){
    	res.redirect('/projects/edit/' + req.params.projectId);
    });


// This function adds a Task Group to a specific Project based on Project ID.
// The newly created Task Group is empty of Tasks and has some basic by default
// values filled in. Afther creation, a related entry is added to history log.
router.post('/addTaskGroup/:projectId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    createTaskGroup,        // Create a new Task Group.
    function(req, res){
        res.redirect('/projects/edit/' + req.currentProject._id);
    });


// This function adds a Task Group to a specific Project based on Project ID.
// The newly created Task Group is empty of Tasks and has some basic by default
// values filled in. Afther creation, a related entry is added to history log.
router.post('/removeTaskGroup/:projectId/:taskGroupId',
    ensureAuthenticated,    // Check if user is connected
    findThisProject,        // Find specific Project based on it ID.
    findThisTaskGroup,      // Find specific Project based on it ID.
    deleteThisTaskGroup,    // Permanently delete this Task Group.
    function(req, res){
        res.redirect('/projects/edit/' + req.currentProject._id);
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
  if(req.relatedProjects) {
  for (var i=0; i < req.relatedProjects.length; i++) {
      if (req.relatedProjects[i].owner.username == req.user.username) {
        projectsOwned++;
      } else {
        projectsShared++;
      }
    }
  }
  req.projectsOwned = projectsOwned;
  req.projectsShared = projectsShared;
  next();
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


// This function returns a specific Task Type
// based on it ID.
function findThisTaskType(req, res, next){
  TaskType.findOne({ _id: req.params.taskTypeId}, function(err, currentTaskType) {

      // if (err) throw err;

      req.currentTaskType = currentTaskType;
      next();
  });
}


// This function checks if Project name has been changed.
// If yes, it saves the new Project Name and saves a log entry.
// If not, returns a related message.
function changeProjectName(req, res, next){

    // if Project Name is too long, cancel the action.
    if (req.body.projectName.length > 100) {
        req.flash('error_msg', 'Project Name too long!');
        return next();
    }

    // Remove spaces from start and end of the new name.
    var newProjectName = req.body.projectName.trim();

    // If the new name is empty, cancel the action.
    if (newProjectName.length == 0) {
        req.flash('error_msg', "Project Name can't be empty!");
        return next();
    }

    // At last, if new name is not equal to the old name do the change.
    if (newProjectName != req.currentProject.name) {

        // Create a log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action:{
                category: "Project",
                method: "Edit",
            },
            description: 'Changed name from "' + req.currentProject.name + '" to "' + newProjectName + '".'
        });

        // Save the new name
        req.currentProject.name = newProjectName;
        req.currentProject.save();

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        req.flash('success_msg', 'Project Name Changed');
    } else {
  		req.flash('success_msg', 'Nothing Changed!');
  	}
    next();
}


// This function checks if Project name has been changed.
// If yes, it saves the new Project Name and saves a log entry.
// If not, returns a related message.
function changeProjectDescription(req, res, next){
    var newProjectDescription = req.body.projectDescription;

    // If description is really changed...
    if (newProjectDescription != req.currentProject.description) {

        // ...create a log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action:{
                category: "Project",
                method: "Edit",
            },
            description: 'Changed description from "' + req.currentProject.description + '" to "' + newProjectDescription + '".'
        });

        // Save the new description
        req.currentProject.description = newProjectDescription;
        req.currentProject.save();

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        req.flash('success_msg', 'Project Description Changed');
    } else {
  		req.flash('success_msg', 'Nothing Changed!');
	}
    next();
}


// This function changes Project Status to "deleted" and saves the change to
// Database. It will also add a related entry to log plus it will return an
// informational message to screen.
function setProjectStatusToDeleted(req, res, next){

    if(req.currentProject == null){
        res.redirect('/access-denied');
    }



    // Set status to 'deleted'
    req.currentProject.status = 'deleted';
    req.currentProject.save();

    // Create a log entry
    var newLog = new Log({
        project: req.currentProject._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action:{
            category: "Project",
            method: "Delete",
        }
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Project Moved to Trash Bin!');
    next();
}


// This function changes Project Status to "active" and saves the change to
// Database. It will also add a related entry to log plus it will return an
// informational message to screen.
function setProjectStatusToActive(req, res, next){

    // Set status to 'deleted'
    req.currentProject.status = 'active';
    req.currentProject.save();

    // Create a log entry
    var newLog = new Log({
        project: req.currentProject._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action:{
            category: "Project",
            method: "Restore",
        }
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Project Restored from Trash Bin!');
    next();
}


// This function returns a specific Task based on it ID. The Task must
// belong to a Project based on a specific ID as well.
function findThisTask(req, res, next){
    for (var i=0; i< req.currentProject.tasks.length; i++) {
        if (req.currentProject.tasks[i]._id == req.params.taskId){
            req.currentTask = req.currentProject.tasks[i];
        }
    }
    next();
}


// This function deletes permanently a specific Project.
// Only owner should perform this action.
// There is no need to keep log for a totaly deleted Project.
function deleteThisProject(req, res, next){

    // if Project is not in Trash, cancel the action.
    if (req.currentProject.status == "active") {
        req.flash("error_msg", "You have to move the Project to Trash first");
        return next();
    }

    // Permanently delete this project.
    req.currentProject.remove();

    req.flash('success_msg', 'Project Permanently Deleted.');
    next();
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


// This function returns a specific User based on his Username.
function findThisUserByUsername(req, res, next) {
  User.findOne({username: req.body.userUsername}, function(err, currentUser) {
      // if (err) throw err;
      req.currentUser = currentUser;
      next();
  });
}


// This function returns a specific User based on his ID.
function findThisUserById(req, res, next) {
  User.findOne({_id: req.params.userId}, function(err, currentUser) {
      // if (err) throw err;
      req.currentUser = currentUser;
      next();
  });
}


// This function returns a specific User based on his Email.
function findThisUserByEmail(req, res, next) {

    // Remove spaces from the requested email
    var userEmail = req.body.userEmail.trim();

    // Make the entry lowercase
    var userEmail = userEmail.toLowerCase();

  User.findOne({email: userEmail}, function(err, currentUser) {
      // if (err) throw err;
      req.currentUser = currentUser;
      next();
  });
}

// This function checks if there are Tasks of a specific Task Type (based on
// it ID) exist in a specific Project (based on it ID).
function isTaskTypeEngaged(req, res, next) {
    Task.findOne({type: req.currentTaskType._id}, function(err, task) {
      if (err) throw err;

      if (task!=null) {
          req.flash('error_msg','Task Type is used by one ore more Tasks!');
          res.redirect('/projects/edit/' + req.currentProject._id);
          return next();
        }
        next();
    });
}


// This function returns a specific Task Group based on it ID.
function findThisTaskGroup(req, res, next){
  TaskGroup.findOne( {_id: req.params.taskGroupId}, function(err, currentTaskGroup) {

      // if (err) throw err;

      req.currentTaskGroup = currentTaskGroup;
      next();
  });
}


// This function creates a new Project plus a related log entry
function createProject(req, res, next) {

    var projectName = req.body.projectName.trim();

    // if Project Name is too long, cancel the action.
    if (projectName.length > 100) {
        req.flash('error_msg', 'Project Name too long!');
        return next();
    }

    // If the new name is empty, cancel the action.
    if(projectName.length == 0) {
        req.flash('error_msg', "Project Name can't be empty!");
        return next();
    }

    // If everything is ok, proceed!

    // Create the default Task Type
    var defaultTaskType = new TaskType({
        name: "Default",
        color: "#a7c8fa"
    });

    TaskType.createTaskType(defaultTaskType, function(err, taskType){
        if(err) throw err;
    });

    var tasks;
    var users;
    var taskgroups;

    var newProject = new Project({
        name:        projectName,
        description: req.body.projectDescription,
        owner:       req.user._id,
        tasktypes:   defaultTaskType._id,
        tasks:       tasks,
        users:       users,
        taskgroups:  taskgroups,
        status:      "active",
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        }
    });

    Project.createProject(newProject, function(err, project){
		if(err) throw err;
        req.project = project;
    })

    // Create Log entry
    var newLog = new Log({
        project: newProject._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Create"
        }
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Project Created');
    return next();
}


// This function removes a specific user (based on his ID) from a specific
// Project (based on it ID) and then adds a related log entry.
function removeThisUserFromProject(req, res, next) {

    // Create Log entry
    var newLog = new Log({
        project: req.currentProject._id,
        user: req.currentUser._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "User Remove"
        }
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    // Remove this user from Project.
    req.currentProject.users.remove(req.params.userId);
    req.currentProject.save();

    // req.currentUser.keyring.remove(req.currentProject._id);
    // req.currentUser.save();

    req.flash('success_msg', 'User Removed');

    next();
}


// This function creats a new Task Type for a specific Project, based on
// it ID. Right after, a related log entry is added to log.
function createTaskType(req, res, next) {

    var taskTypeName = req.body.taskTypeName.trim();

    // if Task Type Name is too long, cancel the action.
    if (taskTypeName.length > 40) {
        req.flash('error_msg', 'Task Type Name is too long!');
        return next();
    }

    // If the new name is empty, cancel the action.
    if(taskTypeName.length == 0) {
        req.flash('error_msg', "Task Type Name can't be empty!");
        return next();
    }


    // Create a new Task Type
    var newTaskType = new TaskType({
        name: taskTypeName,
        color: req.body.taskTypeColor
    });

    // Save the Task Type
    TaskType.createTaskType(newTaskType, function(err, taskType){
        if(err) throw err;
    });

    // Create Log entry
    var newLog = new Log({
        project: req.currentProject._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Task Type Create"
        },
        description: 'added Task Type "' + newTaskType.name + '"'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    // Update the current Project
    req.currentProject.tasktypes.push(newTaskType._id);
    req.currentProject.save();

    req.flash('success_msg', 'Task Type Added!');
    next();
}


// This function permanently deletes a specific Task Type (based on it ID) and
// then adds a related log entry is added.
function removeThisTaskType(req, res, next) {

    TaskType.findOne({_id: req.params.taskTypeId}, function(err, taskType){

        // Remove the Task Type from this Projects Collection.
        req.currentProject.tasktypes.pull(req.params.taskTypeId);
        req.currentProject.save();

        // Remove this Task Type from Task Types Collection.
        req.currentTaskType.remove();

        // Create Log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Project",
                method: "Task Type Remove"
            },
            description: 'deleted Task Type "' + taskType.name + '"'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });
    });

    req.flash('success_msg', 'Task Type Removed');
    next();
}


// This function changes the name of a specific Task Type (based on it ID).
// After the action, a related log entry is added in log.
function changeTaskTypeName(req, res, next) {

    var newTaskTypeName = req.body.actualTaskTypeName.trim();

    // if Task Type Name is too long, cancel the action.
    if (newTaskTypeName.length > 40) {
        req.flash('error_msg', 'Task Type Name is too long!');
        return next();
    }

    // If the new name is empty, cancel the action.
    if(newTaskTypeName.length == 0) {
        req.flash('error_msg', "Task Type Name can't be empty!");
        return next();
    }

    // If the new name is not the same with current name...
    if (newTaskTypeName != req.currentTaskType.name) {

        // Create Log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Project",
                method: "Task Type Edit"
            },
            description: 'Changed name from "' + req.currentTaskType.name + '" to "' + newTaskTypeName + '".'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        // Change the Task Type Name
        req.currentTaskType.name = newTaskTypeName;
        req.currentTaskType.save();

        req.flash('success_msg', 'Task Type Name Changed!');
    } else {
        req.flash('success_msg', 'Nothing Changed!');
        res.redirect('/projects/edit/' + req.currentProject._id);
        return;
    }
    next();
}


// This function changes the color of a specific Task Type (based on it ID)
// and then adds a related entry at history log.
function changeTaskTypeColor(req, res, next) {

    var newTaskTypeColor = req.body.actualTaskTypeColor.trim();

    // If new color is not equal to the current color...
    if (newTaskTypeColor != req.currentTaskType.color) {

        // Create Log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Project",
                method: "Task Type Edit"
            },
            description: 'Changed color from ' + req.currentTaskType.color + ' to "' + newTaskTypeColor + '.'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        // Change the Task Type Color
        req.currentTaskType.color = newTaskTypeColor;
        req.currentTaskType.save();

      req.flash('success_msg', 'Task Type Color Changed!');
    } else {
      req.flash('success_msg', 'Nothing Changed!');
      res.redirect('/projects/edit/' + req.currentProject._id);
      return;
    }
    next();
}


// This function creates a Task Group for a specific Project (base on it
// ID. The function then adds a related log entry.
function createTaskGroup(req, res, next){

    var taskGroupName = req.body.taskGroupName.trim();

    // if Task Group Name is too long, cancel the action.
    if (taskGroupName.length > 40) {
        req.flash('error_msg', 'Task Group Name is too long!');
        return next();
    }

    // If the Task Group name is empty, cancel the action also.
    if(taskGroupName.length == 0) {
        req.flash('error_msg', "Task Group Name can't be empty!");
        return next();
    }

    //If things are ok, proceed and create new Task Group entry.
    newTaskGroup = new TaskGroup({
        name: taskGroupName,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        creator: req.user._id,
        color: '#b8eeff',
        loc: {
            from: {
                x: 10,
                y: 10
            },
            to: {
                x: 110,
                y: 110
            }
        }
    });

    // Save the Task Group
    TaskGroup.createTaskGroup(newTaskGroup, function(err, taskGroup){
        if(err) throw err;

        var taskGroupEntry = {
            _id: taskGroup._id
        }

        // Add the Task Group ID to Project related section.
        req.currentProject.taskgroups.push(taskGroupEntry);

        // Create Log entry
        var newLog = new Log({
            project: req.currentProject._id,
            owner: req.user._id,
            created: {
                date: new moment().format("DD/MM/YY"),
                time: new moment().format("HH:mm:ss")
            },
            action: {
                category: "Project",
                method: "Task Group Create"
            },
            description: 'created Task Group "' + taskGroup.name + '"'
        });

        // Save the log entry
        Log.createLog(newLog, function(err, log){
            if (err) throw err;
        });

        // Save the Project
        req.currentProject.save();

    });
    req.flash('success_msg', 'Task Group Added!');
    next();
}


function deleteThisTaskGroup(req, res, next) {
    // Permanently delete this Task Group
    req.currentTaskGroup.remove();

    //Remove the task Group from Project too.
    req.currentProject.taskgroups.remove(req.params.taskGroupId);
    req.currentProject.save();

    // Create Log entry
    var newLog = new Log({
        project: req.currentProject._id,
        owner: req.user._id,
        created: {
            date: new moment().format("DD/MM/YY"),
            time: new moment().format("HH:mm:ss")
        },
        action: {
            category: "Project",
            method: "Task Group Delete"
        },
        description: 'deleted Task Group "' + req.currentTaskGroup.name + '"'
    });

    // Save the log entry
    Log.createLog(newLog, function(err, log){
        if (err) throw err;
    });

    req.flash('success_msg', 'Task Group Deleted!');
    next();
}


// Export
module.exports = router;
