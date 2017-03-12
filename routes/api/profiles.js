var router = require('router').Router();
var mongoose = require('mongoose');

var User = mongoose.model('User');

var auth = require('../auth');

router.param('username', function(req, res, next, username){
	User.findOne({username: username})
	.then(function(user){
		if(!user){
			return res.sendStatus(404);
		}else{
			res.profile = user;
			return next()
		}
	}).catch();
});

//
router.get('/:username', auth.optional, function(req, res, next){
	//if user token was passed fill user
	if(req.payload){
		User.findById(req.payload.id).then(function(user){
			if(!user){ return res.json({profile: req.profile.toProfileJSONFor(false)}); }

			return res.json({profile: req.profile.toProfileJSONFor(user)});
		});
	} else {
		return res.json( { profile:req.profile.toProfileJSONFor( false ) } );
	}
});

module.exports = router;



