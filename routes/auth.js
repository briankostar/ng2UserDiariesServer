var jwt = require( 'express-jwt' );
var secret = require( '../config' ).secret;

//get token function used by jwt middleware
function getTokenFromHandler( req ){
	//if header has authorization header, where first block is 'Token', second block is the auth code
	if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
		return req.headers.authorization.split(' ')[1];
	}

	return null;
}

//express-jwt validates token. jwt() takes in config obj, validates token and set req.payload (instead of req.user) for next middleware
var auth = {
	required: jwt({
		secret: secret,
		userProperty: 'payload',
		getToken: getTokenFromHandler
	}),
	optional: jwt({
		secret: secret,
		userProperty: 'payload',
		credentialsRequired: false,
		getToken: getTokenFromHandler
	})
};

module.exports = auth;