var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Project Schema
var ProjectSchema = mongoose.Schema({
	name: {
		type: String,
		// index: true
	},
	description: {
		type: String
	},
	owner: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	created: {
		date: String,
		time: String
	},
	users: [{
		type: Schema.ObjectId,
		ref: 'User'
	}],
	tasktypes: [{
		type: Schema.ObjectId,
		ref: 'TaskType'
	}],
	tasks: [{
		type: Schema.ObjectId,
		ref: 'Task'
	}],
	taskgroups: [{
		type: Schema.ObjectId,
		ref: 'TaskGroup'
	}],
	settings:{
		theme: {
			name: { type: String },
			path: { type: String }
		},
		color: {
			type: String
		},
		showComplete: {
			type: Boolean
		}
	},
	status: {
		type: String
	}
});

var Project = module.exports = mongoose.model('Project', ProjectSchema);

module.exports.createProject = function(newProject, callback){
    newProject.save(callback);
}
