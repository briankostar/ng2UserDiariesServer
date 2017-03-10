var fs = require( 'fs' ),
	http = require( 'http' ),
	path = require( 'path' ),
	methods = require( 'methods' ), //http methods
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ), //parse data for req.body
	session = require( 'express-session' ), //express session data save
	cors = require( 'cors' ),
	passport = require( 'passport' ),
	errorhandler = require( 'errorhandler' ),
	mongoose = require( 'mongoose' );

//check if env is production
var isProduction = process.env.NODE_ENV === 'production';

//create express server app
var app = express();

//config express
app.use( cors() );
app.use( require( 'morgan' )( 'dev' ) ); //morgan is express logger.
app.use( bodyParser.urlencoded( { extended:false } ) );
app.use( bodyParser.json() );

app.use( require( 'method-override' )() );
app.use( express.static( __dirname + '/public' ) );

app.use( session( {
	secret           :'userDiaries',
	cookie           :{ maxAge:60000 },
	resave           :false,
	saveUninitialized:false
} ) );

//use error handler on dev
if( !isProduction ){
	app.use( errorhandler() );
}

if( isProduction ){
	mongoose.connect( process.env.MONGOB_URL );
} else {
	mongoose.connect( 'mongodb://localhost/userdiaries' );
	mongoose.set( 'debug', true );
}

require('./models/User');
// require('./models/Article');
// require('./models/Comment');
// require('./config/passport');
app.use(require('./routes'));

//if error, pass 404 and forward to next handler
app.use( function( req, res, next ){
	var err = new Error( 'Not Found' );
	err.status = 404;
	next( err );
} );

//on dev, log error stack and send 500. add the err msg
if( !isProduction ){
	app.use( function( err, req, res, next ){
		console.log( err.stack );

		res.status( err.status || 500 );

		res.json( {
			'errors':{
				message:err.message,
				error  :err
			}
		} );
	} );
}

//throw error but show no stack trace
app.use( function( err, req, res, next ){
	res.status( err.status || 500 );
	res.json( {
		'errors':{
			message:err.message,
			error  :{}
		}
	} );
} );


var server = app.listen( process.env.PORT || 3000, function(){
	console.log( 'Listening on port', server.address().port );
} );




