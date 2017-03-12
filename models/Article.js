var mongoose = require( 'mongoose' );
var uniqueValidator = require( 'mongoose-unique-validator' );
var slug = require( 'slug' );
var User = mongoose.model( 'User' );

//first define schema
var ArticleSchema = new mongoose.Schema( {
	slug       :{
		type:String,
		lowercase:true,
		unique:true
	},
	title      :String,
	description:String,
	body       :String,
	comments   :[ {
		type:mongoose.Schema.Types.ObjectId,
		ref :'Comment'
	} ],
	author     :{
		type:mongoose.Schema.TYpe.ObjectId,
		ref :'User'
	}
}, { timestamp:true } );

//define methods
ArticleSchema.plugin( uniqueValidator, { message:'is already taken' } );

ArticleSchema.pre( 'validate', function(next){
	this.slugify();
	next();
} );

Article.methods.slugify = function(){
	this.slug = slug(this.title);
};

//format to json here instead of at the route
ArticleSchema.methods.toJSONFor = function(user){
	return {
		slug: this.slug,
		title: this.title,
		description: this.description,
		body: this.body,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
		author: this.author.toProfileJSONFor(user)
	};
};

//load schema
mongoose.model('Article', ArticleSchema);


