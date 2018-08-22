var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String
	},
	password: {
		type: String
	},
	preview: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		first: String,
		last: String,
	},
	// keyring: [{
	// 	type: Schema.ObjectId
	// }],
	created: {
		date: String,
		time: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	// bcrypt.genSalt(10, function(err, salt) {
	    // bcrypt.hash(newUser.password, salt, function(err, hash) {
	    //     // newUser.password = hash;
	    //     newUser.password = "1";
	        newUser.save(callback);
	    // });
	// });
}

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserByEmail = function(email, callback){
	var query = {email: email};
	User.findOne(query, callback);
}


module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
