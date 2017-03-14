var router = require( 'express' ).Router();
var mongoose = require( 'mongoose' );
var passport = require( 'passport' );
var auth = require( '../auth' );

var Article = mongoose.model( 'Article' );
var User = mongoose.model( 'User' );
// var Comment = mongoose.model('Comment');

//for article params, get article, populate author, add to req body
router.param( 'article', function( req, res, next, slug ){
	Article.findOne( { slug:slug } )
	//fills the author data
	.populate( 'author' )
	.then( function( article ){
		if( !article ){
			return res.sendStatus( 404 );
		}
		else {
			req.article = article;
			return next();
		}
	} ).catch( (next) );
} );

router.param( 'comment', function( req, res, next, value ){
	Comment.findById( value ).then( function( comment ){
		if( !comment ){
			return res.sendStatus( 404 );
		} else {
			req.comment = comment;
			return next();
		}
	} ).catch( next )
} );

//get all articles. params: limit, offset, author
router.get( '/', function( req, res, next ){
	var query = {};
	var limit = 20;
	var offset = 0;
	if( typeof req.query.limit !== 'undefined' ){
		limit = req.query.limit
	}
	;
	if( typeof req.query.offset !== 'undefined' ){
		offset = req.query.offset;
	}


	Promise.all( [
		req.query.author ? User.findOne( { username:req.query.author } ) : null
	] ).then( function( results ){
		var author = results[ 0 ];

		if( author ){
			query.author = author._id;
		}
	} );

	//find all {}, or {author: id}
	return Promise.all( [
		Article.find( query )
		.limit( Number( limit ) )
		.skip( Number( offset ) )
		.sort( { createdAt:'desc' } )
		.populate( 'author' )
		.exec(),
		Article.count( query ).exec(),
		req.payload ? User.findById( req.payload.id ) : null
	] )
	//find articles by author or article count by author, and User if passed
	.then( function( results ){
		var articles = results[ 0 ];
		var articlesCount = results[ 1 ];
		var user = results[ 2 ];

		return res.json( {
			//json each article with user populated if exists
			articles     :articles.map( function( article ){
				return article.toJSONFor( user );
			} ),
			articlesCount:articlesCount
		} );
} ).catch( next );
}) ;

//create article
router.post( '/', auth.required, function( req, res, next ){
	User.findById( req.payload.id )
	.then( function( user ){
		if( !user ){
			return res.setStatus( 401 )
		}
		else {
			//should validate
			var article = new Article( req.body.article );

			article.author = user;

			return article.save().then( function(){
				console.log( article.author );
				return res.json( { article:article.toJSONFor( user ) } );
			} );
		}
	} ).catch( next );
} );

//get specific article, param can be user
router.get('/:article', auth.optional, function(req, res, next) {
	Promise.all([
		req.payload ? User.findById(req.payload.id) : null,
		//populate article
		req.article.populate('author').execPopulate()
	]).then(function(results){
		var user = results[0];

		//if user passed, populate articles field w that user.
		return res.json({article: req.article.toJSONFor(user)});
	}).catch(next);
});


// update article/
//find this user. if this article's author id matches:
//set title, desc, body if exists, save and return new article
router.put('/:article', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user){
		if(req.article.author._id.toString() === req.payload.id.toString()){
			if(typeof req.body.article.title !== 'undefined'){
				req.article.title = req.body.article.title;
			}

			if(typeof req.body.article.description !== 'undefined'){
				req.article.description = req.body.article.description;
			}

			if(typeof req.body.article.body !== 'undefined'){
				req.article.body = req.body.article.body;
			}

			req.article.save().then(function(article){
				return res.json({article: article.toJSONFor(user)});
			}).catch(next);
		} else {
			return res.sendStatus(403);
		}
	});
});

// delete article
//find this user. if this article's author id matches this user id, remove the article
router.delete('/:article', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user){
		if (!user) { return res.sendStatus(401); }

		if(req.article.author._id.toString() === req.payload.id.toString()){
			return req.article.remove().then(function(){
				return res.sendStatus(204);
			});
		} else {
			return res.sendStatus(403);
		}
	}).catch(next);
});


// return an article's comments
//if article exists, find user, populate comments, return comments
router.get('/:article/comments', auth.optional, function(req, res, next){
	Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
		return req.article.populate({
			path: 'comments',
			populate: {
				path: 'author'
			},
			options: {
				sort: {
					createdAt: 'desc'
				}
			}
		}).execPopulate().then(function(article) {
			return res.json({comments: req.article.comments.map(function(comment){
				return comment.toJSONFor(user);
			})});
		});
	}).catch(next);
});

// create a new comment
//if this user exists, create new comment, link comment article and author and save
//when saved, push this comment to the article's comments and save that too
router.post('/:article/comments', auth.required, function(req, res, next) {
	User.findById(req.payload.id).then(function(user){
		if(!user){ return res.sendStatus(401); }

		var comment = new Comment(req.body.comment);
		comment.article = req.article;
		comment.author = user;

		return comment.save().then(function(){
			req.article.comments.push(comment);

			return req.article.save().then(function(article) {
				res.json({comment: comment.toJSONFor(user)});
			});
		});
	}).catch(next);
});

//if this user is the comment's author
//remove comment then remove the article's comment
router.delete('/:article/comments/:comment', auth.required, function(req, res, next) {
	if(req.comment.author.toString() === req.payload.id.toString()){
		req.article.comments.remove(req.comment._id);
		req.article.save()
		.then(Comment.find({_id: req.comment._id}).remove().exec())
		.then(function(){
			res.sendStatus(204);
		});
	} else {
		res.sendStatus(403);
	}
});

module.exports = router;











