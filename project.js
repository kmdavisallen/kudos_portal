/********************************************************************************************************
Team: Tabit
Authors: Kevin Allen, Lonnie Clark, Christina Curran
Date: 2/8/2018
Class: CS467, Section 400
********************************************************************************************************/

/********************************************************************************************************
Variable Setup
********************************************************************************************************/
// express/handlebar setup
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//MySQL setup
var mysql = require('./dbcon.js');
app.set('mysql', mysql);

//Session setup
var session = require('express-session');
app.use(session({secret: 'TabitNotSoSecret', resave: true, saveUninitialized:true}));

//Formidable setup fom handling multipart data
var eFormidable = require('express-formidable');
app.use(eFormidable());

//other settings
app.use('/static', express.static('public')); //public file storage
app.set('port', process.argv[2]);         //determine port number to run
var transporter = require('./mailer.js'); //for emailing password reset

//render the login page
app.get('/', function(req, res){
  res.render('genHome');
})

//POST request to confirm login info, login coding adapted from https://codeshack.io/basic-login-system-nodejs-express-mysql
app.post('/', function(req, res){
  mysql.pool.query("SELECT * FROM users WHERE email=? AND password=?", [req.fields.email, req.fields.password], function(error, results, fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    if(Object.keys(results).length !=0){
      req.session.loggedin =true;
      req.session.context= results[0];
      
      if(results[0].admin_flag == 1){ //if admin go to admin home
        res.redirect('/manageusers');
      }
      else{
        res.redirect('/userHome');  //else go to userhome
      }
    }
    else{
      res.send("Incorrect user name and/or password");
    }
  })
})

//page for retrieveing password
app.get('/forgotpassword', function(req, res){
  res.render('forgotpassword');
})
//handle post to forgotpassword, check if email in database
app.post('/forgotpassword', function(req, res){
  mysql.pool.query("SELECT password FROM users WHERE active_flag=1 AND email=?", [req.fields.email], function(error, results, fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    if(Object.keys(results).length !=0){
      var mailoptions={
        from:'467Kudos@gmail.com',
        to: req.fields.email,      //test email, change to email recipient 
        bcc: '467Kudos@gmail.com',
        subject:'Kudos login',
        text:'Your password: '+results[0].password,
      }
      transporter.sendMail(mailoptions, function(error, info){
        if(error){
          console.log(error);
        }
      });
      res.render('passsent');
    }
    else{
      //go to create user page
      res.render('emailnotfound');
    }
  })
})

//page for logging out
 app.get('/logout', function(req, res){
    req.session.destroy(function(error){
      if(error){
        console.log(error);
      }
      else{
        res.redirect('/');
      }
    });
  })

//pages after sucessful login  
app.use('/userHome', require('./userHome.js'));
app.use('/manageusers', require('./adminHome.js'));

//error pages
app.use(function(req,res){
    res.status(404);
    res.render('404');
  });
  
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
  });

  app.listen(app.get('port'), function(){
    console.log('Express started on localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
  });