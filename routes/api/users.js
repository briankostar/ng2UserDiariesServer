var router = require( 'express' ).Router();
var passport = require( 'passport' );

//intended for /api/user
//get token, validate it, then find user by id, then res
router.get( '/user', auth.required, function( req, res, next ){
	User.findById( req.payload.id ).then( function( user ){
		if( !user ){
			return res.sendStatus( 401 );
		}

		return res.json( { user:user.toAuthJSON() } );
	} ).catch( next );
} );

router.post('/users', function(req, res, next){
	var user = new User();

	user.username = req.body.user.username;
	user.email = req.body.user.email;
	user.setPassword(req.body.user.password);

	user.save().then(function(){
		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});
