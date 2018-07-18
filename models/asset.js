var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Comment Schema
var AssetSchema = mongoose.Schema({
	owner: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	created: {
		date: String,
		time: String
	},
	type: {
		type: String
	},
	name: {
		type: String
	},
	src: {
		type: String
	}
});

var Asset = module.exports = mongoose.model('Asset', AssetSchema);
