var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// // Task Group Schema
var TaskGroupSchema = mongoose.Schema({
	name: {
		type: String
	},
	// description: {
	// 	type: String
	// },
	color: {
		type: String
	},
	tasks: [{
		type: Schema.ObjectId,
		ref: 'Task'
	}],
	created: {
		date: String,
		time: String
	},
	creator: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	loc:{
		from: {
			x: { type: Number },
			y: { type: Number }
		},
		to: {
			x: { type: Number },
			y: { type: Number }
		}
	},
	tasks: [{
		type: Schema.ObjectId,
		ref: 'Task'
	}]
});

var TaskGroup = module.exports = mongoose.model('TaskGroup', TaskGroupSchema);


module.exports.createTaskGroup = function(newTaskGroup, callback){
    newTaskGroup.save(callback);
}
