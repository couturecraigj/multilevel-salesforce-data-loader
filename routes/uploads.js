var express = require('express');
var router = express.Router();
var util = require("util");
var fs = require("fs"); 
var multer = require('multer')
var storage = multer.diskStorage({
	destination:function(req,file,cb){
		cb(null,'uploads/')
	},
	filename:function(req,file,cb){
		cb(null,Date.now()+'.csv')
	}
})
var upload = multer({storage:storage})
router.get('/', function(req, res) {
  res.render("uploadPage", {title: "I love files!"});
  console.log('uploadPage loaded');
}); 

router.post("/upload", upload.single('myFile'), function(req, res, next){
	res.send("Well, there is no magic for those who don’t believe in it!");
	console.log(req.file)
	if (req.files) {
		console.log(util.inspect(req.files));
		if (req.file.size === 0) {
		            return next(new Error("Hey, first would you select a file?"));
		}
		fs.exists(req.file.path, function(exists) {
			if(exists) {
				res.send("Got your file!");
			} else {
				res.send("Well, there is no magic for those who don’t believe in it!");
			}
		});
	}
});
module.exports = router;