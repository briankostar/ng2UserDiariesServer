var mongoose = require( 'mongoose' );
var router = require( 'express' ).Router();
var passport = require( 'passport' );
var User = mongoose.model( 'User' );
var auth = require( '../auth' );

//intended for /api/user
//get token, validate it, then find user by id, then respond with username/email/token
router.get( '/user', auth.required, function( req, res, next ){
	console.log('req.body.user', req.body.user);
	console.log('req.body.payload', req.body.payload);
	console.log('req.payload', req.payload);
	User.findById( req.payload.id ).then( function( user ){
		if( !user ){
			console.log('NO USER');
			return res.sendStatus( 401 );
		}

		return res.json( { user:user.toAuthJSON() } );
	} ).catch( next );
} );

//auth.required checks token, if success sets req.payload (instead of req.user) for next middleware.
router.put('/user', auth.required, function(req, res, next){
	User.findById(req.payload.id).then(function(user){
		if(!user){ return res.sendStatus(401); }

		// only update fields that were actually passed...
		if(typeof req.body.user.username !== 'undefined'){
			user.username = req.body.user.username;
		}
		if(typeof req.body.user.email !== 'undefined'){
			user.email = req.body.user.email;
		}
		if(typeof req.body.user.bio !== 'undefined'){
			user.bio = req.body.user.bio;
		}
		if(typeof req.body.user.image !== 'undefined'){
			user.image = req.body.user.image;
		}
		if(typeof req.body.user.password !== 'undefined'){
			user.setPassword(req.body.user.password);
		}

		return user.save().then(function(){
			return res.json({user: user.toAuthJSON()});
		});
	}).catch(next);
});

//use login with passport. returns token if success
router.post( '/users/login', function( req, res, next ){
	if( !req.body.user.email ){
		return res.status( 422 ).json( { errors:{ email:"can't be blank" } } )
	}
	if( !req.body.user.password ){
		return res.status( 422 ).json( { errors:{ password:"can't be blank" } } )
	}

	//uses local strategy with no session. if user exists callback function is called with user populated.
	//how is email/password passed to passport? Magic.
	passport.authenticate( 'local', { session:false }, function( err, user, info ){
		if( err ){
			return next( err );
		}

		if( user ){
			user.token = user.generateJWT();
			return res.json( { user:user.toAuthJSON() } );
		} else {
			return res.status( 422 ).json( info );
		}
	} )( req, res, next );

	console.log( 'passport after auth' );
} );

router.post( '/users', function( req, res, next ){
	var user = new User();

	user.username = req.body.user.username;
	user.email = req.body.user.email;
	user.setPassword( req.body.user.password );

	//after saving user, return data with username, email and token
	user.save().then( function(){
		return res.json( { user:user.toAuthJSON() } );
	} ).catch( next );
} );

module.exports = router;