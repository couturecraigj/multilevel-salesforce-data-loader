var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jsforce = require('jsforce'), flash = require('connect-flash');
var conn = new jsforce.Connection();
var multer = require('multer'), upload = multer({dest:'uploads/'});
var configModRout = require('./config/route-models.js'), passport = require('passport');
var session = require('express-session'), helmet = require('helmet'),configSecrets= require('./config/secrets.js');
var accTok = '', instUrl = '';
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
// var QSQL = require('q-sqlite3');
var DB = null;
var db = new sqlite3.Database('mydb.db')
var uploads = require('./routes/uploads');
var basicCSV = require('basic-csv')
//var routes = require('./routes/index');
//var users = require('./routes/users');

var invcs, invcs2,custmr,custmr2,job,job2
var app = express();

db.serialize(function(){
  var jobArr = [];
  var custArr = [];
  var invArr = [];
  conn.login('salesforce username goes here', 'salesforce password goes here', function(err, userInfo) {
    if (err) { return console.error(err); }
    accTok = conn.accessToken;
    instUrl = conn.instanceUrl;
    conn.query('SELECT Id, Name, Account__c, Name__c, Active__c FROM Client__c',function(err,result){
      console.log("total : " + result.totalSize);
      console.log(result.records.length);
      var job = conn.bulk.createJob('Job_Type__c','query')
      var batch = job.createBatch();
      batch.execute('SELECT Id, Name, Client_Site__c, Active__c FROM Job_Type__c')
      .on("queue",function(batchInfo){
        batchId = batchInfo.id;
        jobId = batchInfo.jobId;
      })
      conn.bulk.query('SELECT Id, Name, Client_Site__c, Active__c FROM Job_Type__c')
      .stream().pipe()
    })
  });
  db.run('CREATE TABLE if not exists invoices (customer_num TEXT,invoice_num TEXT UNIQUE, job_num TEXT, invoice_date TEXT, posting_date TEXT, revenue_tot REAL, tax REAL, invoice_amt REAL, date_added TEXT, date_changed TEXT)');
  db.run('CREATE TABLE if not exists jobs (customer_num TEXT, job_num TEXT UNIQUE, uniquefield TEXT, sfdc_id TEXT, upidi TEXT)');
  db.run('CREATE TABLE if not exists customers (customer_num TEXT UNIQUE, uniquefield TEXT, sfdc_id TEXT, upidi TEXT, active TEXT, national TEXT)');
  db.parallelize(function(){
    invcs = db.prepare('INSERT OR IGNORE INTO invoices (customer_num,invoice_num,job_num,'+
    'invoice_date,posting_date,revenue_tot,tax,invoice_amt,date_added,date_changed) VALUES'+
    ' (?,?,?,?,?,?,?,?,?,?)');
    custmr = db.prepare('INSERT OR IGNORE INTO customers (customer_num,uniquefield,sfdc_id,upidi) VALUES'+
      ' (?1,?1,?2,?3)');
    job = db.prepare('INSERT OR IGNORE INTO jobs (job_num,uniquefield,customer_num,sfdc_id,upidi) VALUES'+
      ' (?1,?1,?2,?3,?4)');
  })

  basicCSV.readCSV('./uploads/1461176490246.csv',function(err,rows){
    var size = rows.length;
    var custcnt = 0;
    var jobcnt = 0;
    db.serialize(function(){
      for(var i = 0; i<size;i++){
        if(i==0)continue;
        invcs.run(rows[i]);
        if(size-1==i){
          var cnt = 0;
          invcs.finalize();
          db.serialize(function(){
            db.each('SELECT rowid AS id, customer_num,invoice_num,job_num FROM invoices',function(err,row){
              cnt++;
              // console.log(row);
              custmr.run(row.customer_num,'',null);
              job.run(row.job_num,row.customer_num,'','');
              if(cnt==size-1){
                custmr.finalize();
                job.finalize();
              }
            });
            db.get('SELECT COUNT(*) AS total_rows FROM customers',function(err,row){
              custcnt = row.total_rows;
              console.log(custcnt);
              return custcnt;
            })
            db.get('SELECT COUNT(*) AS total_rows FROM jobs',function(err,row){
              jobcnt = row.total_rows;
              console.log(jobcnt);
              return jobcnt;
            })
            db.get('SELECT COUNT(*) AS total_rows FROM invoices',function(err,row){
              size = row.total_rows;
              console.log(size);
              return size;
            })
            db.each('SELECT rowid AS row, customer_num AS Name, uniquefield AS UniqueField__c, sfdc_id AS id FROM customers',function(err,row){
              custArr.push(row);
            })
            db.each('SELECT rowid AS row, job_num AS Name, uniquefield AS UniqueField__c, customer_num AS Client_Site__c, sfdc_id AS id FROM jobs',function(err,row){
              jobArr.push(row);
            })
            db.close(function(){
              // console.log(custArr)
              // console.log(jobArr)
              return //console.log(size-1);
            });
          })
        }
      }
    })
  })
})

require('./config/passport')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: configSecrets.local })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

// app.use(configModRout.routes.path, require(configModRout.routes.route));

//app.use('/', routes);
//app.use('/users', users);
app.use('/uploads', uploads);



require('./routes/routes.js')(app, passport);

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
