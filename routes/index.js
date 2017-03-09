var app = require('express');
var router = app.Router();

//mount api router from api index
router.use('/api', require('./api'));

module.exports = router;