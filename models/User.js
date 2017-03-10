var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var UserSchema = new mongoose.Schema({
	username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
	email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
	bio: String,
	image: String,
	// favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
	// following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	hash: String,
	salt: String
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});

UserSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');
	//generate random bytes. <Buffer 47 d8 7c b0 4d 0a bc 92 4c 5b 45 40 01 5a 57 24>
	//turn to hex d938cb169be9ac4694b019ca8b9ba83a
	console.log('crypto.randomBytes(16)', crypto.randomBytes(16));
	console.log('crypto.randomBytes(16.toString())', crypto.randomBytes(16).toString('hex'));
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	//hash: c0d0fbfea8d0a7e2fac4cd5f470d9e7b31619c45a8793607ec0f06f558833d04d1671630d6b150ac1b8df02dbcf37e2e98109baafc2efc0ae77a50031be14c451d73155e7fe124a538a70e69dafb0c4daa6a31775aee30ce98b06e533a33464d8901497575bd41dfddd6f491167e43c03710f52b8
	console.log('salt::', this.salt);
	console.log('hash::', this.hash);
};

UserSchema.methods.generateJWT = function() {
	var today = new Date();
	var exp = new Date(today);
	exp.setDate(today.getDate() + 60);

	return jwt.sign({
		id: this._id,
		username: this.username,
		exp: parseInt(exp.getTime() / 1000),
	}, secret);
};

UserSchema.methods.toAuthJSON = function(){
	return {
		username: this.username,
		email: this.email,
		token: this.generateJWT()
	};
};

mongoose.model('User', UserSchema);