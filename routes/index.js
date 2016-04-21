var express = require('express');
var router = express.Router();
var jsforce = require('jsforce');
var conn = new jsforce.Connection();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/logout',function(req,res,next){
	conn.logout(function(err){
		if(err) {
			return console.error(err);
			res.send(401,'Error Cannot Logout or Already Logged Out')
		} else {
			res.redirect('/')
		}
	})
})

module.exports = router;
