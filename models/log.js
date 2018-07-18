var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Log Schema
var LogSchema = mongoose.Schema({
	// parent: [{
	// 	type: Schema.ObjectId
	// }],
	project: {
		type: Schema.ObjectId,
		ref: 'Project'
	},
	task: {
		type: Schema.ObjectId,
		ref: 'Task'
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	owner: {
	    type: Schema.ObjectId,
	    ref: 'User'
	},
	created: {
	    date: String,
	    time: String
	},
	action: {
	    category: String,
	    method: String
	},
	description: {
	    type: String
	}
},
{
	collection: 'log'
});

var Log = module.exports = mongoose.model('Log', LogSchema);

module.exports.createLog = function(newLog, callback){
    newLog.save(callback);
}
