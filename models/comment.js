var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Comment Schema
var CommentSchema = mongoose.Schema({
	creator: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	action: {
		type: String
	},
	created: {
		date: String,
		time: String
	},
	description: {
		type: String
	}
});


var Comment = module.exports = mongoose.model('Comment', CommentSchema);
