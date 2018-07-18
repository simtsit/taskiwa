var moment = require('moment');
var express = require('express');
var router = express.Router();

var Project = require('../models/project');
var User = require('../models/user');
var Task = require('../models/task');

// Get Homepage
router.get('/',
    countUsers,         // Count all users
    countProjects,      // Count all active Projects
    countTasks,         // Count all active Tasks
    function(req, res){

    var nowDate = new moment().format("DD/MM/YY");
    var nowHour = new moment().format("HH:mm:ss");

        res.render('index', {
            title: "Taskiwa",
            nowDate: nowDate,
            nowHour: nowHour,
            userCount: req.userCount,
            projectCount: req.projectCount,
            taskCount: req.taskCount
        });
});


// This function counts all Usrs and returns their number.
function countUsers(req, res, next) {
    User.count({}, function (err, count) {
        req.userCount = count;
        // console.log("Users: " + count);
        next();
    })
}


// This function counts all Projects where status is active  and returns
// their number.
function countProjects(req, res, next) {
    Project.count({status: "active"}, function (err, count) {
        req.projectCount = count;
        // console.log("Projects: " + count);
        next();
    })
}


// This function counts all Tasks where status is active  and returns
// their number.
function countTasks(req, res, next) {
    Task.count({status: "active"}, function (err, count) {
        req.taskCount = count;
        // console.log("Tasks: " + count);
        next();
    })
}


module.exports = router;
