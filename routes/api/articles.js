var router = require('express').Router();
var mongoose = require('mongoose');
var passport = require('passport');
var auth = require('../auth');

var Article = mongoose.model('Article');
var User = mongoose.model('User');
// var Comment = mongoose.model('Comment');

//for article params, get article, populate author, add to req body
router.param('article', function(req, res, next, slug){
	Article.findOne({slug: slug})
	//fills the author data
	.populate('author')
	.then(function(article){
		if(!article){ return res.sendStatus(404); }
		else{
			req.article = article;
			return next();
		}
	}).catch((next));
});