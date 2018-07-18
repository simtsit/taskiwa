var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// // TaskType Schema
var TaskTypeSchema = mongoose.Schema({
	name: {
		type: String
	},
	color: {
		type: String
	}
});

var TaskType = module.exports = mongoose.model('TaskType', TaskTypeSchema);

module.exports.createTaskType = function(newTaskType, callback){
    newTaskType.save(callback);
}
