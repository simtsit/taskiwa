var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Task Schema
var TaskSchema = mongoose.Schema({
	project: {
		type: Schema.ObjectId,
		ref: 'Project'
	},
	owner: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	title: {
		type: String
	},
	created: {
		date: String,
		time: String
	},
	priority: {
		type: String
	},
	users: [{
		type: Schema.ObjectId,
		ref: 'User'
	}],
	type: {
		type: Schema.ObjectId,
		ref: 'TaskType'
	},
	description: {
		type: String
	},
	// assets: [{
	// 	type: Schema.ObjectId,
	// 	ref: 'Asset'
	// }],
	loc: {
		x: Number,
		y: Number,
	},
	connections: {
		type: Array
	},
	comments: [{
		parent: Schema.ObjectId,
		user: {
			type: Schema.ObjectId,
			ref: 'User'
		},
		created: {
			date: String,
			time: String
		},
		body: String
	}],
	status: {
		type: String
	}
});

var Task = module.exports = mongoose.model('Task', TaskSchema);

module.exports.createTask = function(newTask, callback){
    newTask.save(callback);
}
