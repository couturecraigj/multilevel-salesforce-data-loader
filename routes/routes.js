var express = require('express');
var router = express.Router();
var less = require('less');
// load up the user model
var jsforce = require('jsforce');
var conn = new jsforce.Connection();
var User = conn.sobject('Contact');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res, next) {
        res.render('productapp.jade', { title: 'Products', ngapp: 'productApp', user: req.user, userId: userIdValue(req.user), loggedIn: req.isAuthenticated() });
        console.log('productspage has been loaded')
    });


    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/userpage', isLoggedIn, function(req, res) {
        res.render('profile', { title: 'UserPage', ngapp: 'app', user: req.user, loggedIn: req.isAuthenticated() }); // get the user out of session and pass to template
        console.log('userpage has been loaded')
    });


    app.get('/user/:id', isLoggedIn, isAbleToEdit, function(req, res, next) {
        var _id = req.params.id;
        var rec = req.body;
        User.find({Id:_id}, function (err, post) {
            if (err) return next(err);
            res.json(post);
        });
    });

    /*app.put('/user/:id', isLoggedIn, isAbleToEdit, function(req, res, next) {
        var rec = req.body;
        var _id = req.params.id;
        User.update({Id:_id},function(err,rets){
            if(err) { return console.error(err);}
            console.log('updated sucessfully: ' + ret.id)
        });
    });*/

    /*----
    **TAKE NOTE: use req.user to pass user information and passing _id is as easy on inserts as user._id**
    ----*/

    app.get('/loggedin', function(req, res) {
        res.send(req.isAuthenticated() ? req.user : '0');
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/userpage#/', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/userpage#/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    /* GET manufacturers page. */
    // app.get('/manufacturerapp', function(req, res, next) {
    //     res.render('manuapp', { title: 'Manufacturers', ngapp: 'app', user: req.user, loggedIn: req.isAuthenticated() });
    //     console.log('manufacturersapp has been loaded')
    // });

    // /*GET retailers page. */
    // app.get('/retailerapp', function(req, res, next) {
    //     res.render('retailerapp', { title: 'Retailers', ngapp: 'app', user: req.user, loggedIn: req.isAuthenticated() });
    //     console.log('retailerapp has been loaded')
    // });

    /* GET product-selection page. */
    
};
function userIdValue(User){
    var UserIdString
    if(!User) {
        UserIdString = '';
    } else {
        UserIdString = User._id;
    };
    return UserIdString;
};
// route middleware to make sure a user is logged in
function isAbleToEdit(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.user.privilege.admin){
        return next()
    } else if (req.user.id == req.params.id) {
        return next()
    } else 
        res.status(401);

    // if they aren't redirect them to the home page
    res.status(401);
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.status(401);

};