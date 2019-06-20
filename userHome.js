module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var transporter = require('./mailer.js');
    var latex = require('node-latex');
    var fse = require('fs-extra');
    var formidable = require('formidable');

    //get the number of awards for current user
    function getUserAwardNum(res, mysql, context, id, complete){
        var sql= "SELECT COUNT(*) AS total FROM user_awards WHERE user_id = ? AND active_flag=1";
        var data= id;
        mysql.pool.query(sql, data, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.total = results[0].total;
                complete();
            }
           
        });
    }
    //get a list of users capable of getting awards
    function getUsers(res, mysql, context, complete){
        mysql.pool.query("SELECT user_id, first_name, last_name FROM users WHERE admin_flag=0 AND active_flag=1", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.users = results;
                complete()
            }
        });
    }
    //get list of awards
    function getAwardList(res, mysql, context, complete){
        mysql.pool.query("SELECT award_id, award_name FROM awards WHERE award_id=1 OR award_id=2", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.awardNames = results;
                complete()
            }
        });
    }
    //get info on a user
    function getUserInfo(res, mysql, context, id, complete){
        mysql.pool.query("SELECT * FROM users WHERE user_id=?", id, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.user = results[0];
                complete();
            }
        })
    }
    //get awards to populate manage awards page
    function getAwardsBySend(res, mysql, context, id, complete){    
        var sql = "SELECT a.award_name, DATE_FORMAT(ua.award_date, '%Y-%m-%d') as award_date, u.first_name, u.last_name, ua.user_award_id FROM user_awards ua INNER JOIN awards a ON a.award_id = ua.award_id INNER JOIN users u ON ua.user_id = u.user_id WHERE ua.created_by=? AND us.active_flag=1";
        mysql.pool.query(sql, id, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.awards = results;
                complete();
            }
        })

    }
        //get awards to populate manage awards page
    function getAwardsBySend(res, mysql, context, id, complete){    // V fix below V need to get awardee name
        var sql = "SELECT a.award_name, DATE_FORMAT(ua.award_date, '%Y-%m-%d') as award_date, u.first_name, u.last_name, ua.user_award_id FROM user_awards ua INNER JOIN awards a ON a.award_id = ua.award_id INNER JOIN users u ON ua.user_id = u.user_id WHERE ua.created_by=? AND ua.active_flag=1";
        mysql.pool.query(sql, id, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.awards = results;
                complete();
            }
        })

    }
    //get awards to populate my awards page
    function getMyAwards(res, mysql, context, id, complete){    // V fix below V need to get awardee name
        var sql = "SELECT a.award_name, DATE_FORMAT(ua.award_date, '%Y-%m-%d') as award_date, u.first_name, u.last_name, ua.user_award_id FROM user_awards ua INNER JOIN awards a ON a.award_id = ua.award_id INNER JOIN users u ON ua.created_by= u.user_id WHERE ua.user_id=? AND ua.active_flag=1";
        mysql.pool.query(sql, id, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                context.awards = results;
                complete();
            }
        })

    }
    //function to make sure session is still active
    function isLoggedIn(req, res, next){
        if(req.session.loggedin){
            return next();
        }
        else{
            res.redirect('/');
        }
    }
    //set up user home page
    router.get('/', isLoggedIn, function(req, res){
        var id = req.session.context.user_id;
        var context={};
        var callbackcount=0;
        var mysql = req.app.get('mysql');
        getUserAwardNum(res, mysql, context, id, complete);
        getUserInfo(res, mysql, context, id, complete)
        
        function complete(){
            callbackcount++;
            if(callbackcount >= 2){
                context.layout = 'admin';
                res.render('userHome', context);
            }
        }
       
    });
    //page to manage awards given by current user
    router.get('/manageawards', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var context={};
        context.jsscripts =["deleteAward.js"];
        var callbackcount=0;
        var id = req.session.context.user_id;
        getAwardsBySend(res, mysql, context, id, complete);
        function complete(){
            callbackcount++;
            if(callbackcount >=1){
                res.render('manageawards', context);
            }
        }
    });

    //setup for deleting award
    router.delete('/manageawards/:id', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var id = [req.params.id];
        mysql.pool.query("DELETE FROM user_awards WHERE user_award_id =?", id, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                res.status(202).end();
            }
        });
    });
    //page for viewing awards recieved
    router.get('/myAwards', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var context = {};
        var callbackcount=0;
        var id = req.session.context.user_id;
        getMyAwards(res, mysql, context, id, complete);
        function complete(){
            callbackcount++;
            if(callbackcount>=1){
                res.render('viewawards', context);
            }
        }
    });
    //page for edit profile
    router.get('/editProfile', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var id = req.session.context.user_id;
        var context ={};
        var callbackcount=0;
        context.jsscripts = ["editUser.js"];
        getUserInfo(res, mysql, context, id, complete);
        function complete(){
            callbackcount++;
            if(callbackcount >= 1){
                res.render('editProfile', context);
            }
        }

    });

    //router for editing profile
    router.put('/editProfile/:id', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        if(req.files.sigImg.size == 0 ){
            var context = [req.fields.first_name, req.fields.last_name, req.fields.email, req.fields.password, req.params.id];  //edit user signiture
            var sql = "UPDATE users SET first_name=?, last_name=?, email=?, password=? WHERE user_id=?"     //insert usert signiture
        }
        else{
            var name = req.params.id + "." + req.files.sigImg.name.split('.').pop();
            
            var context = [req.fields.first_name, req.fields.last_name, req.fields.email, req.fields.password, name, req.params.id];  //edit user signiture
            var sql = "UPDATE users SET first_name=?, last_name=?, email=?, password=?, signature=? WHERE user_id=?"     //insert usert signiture
        }
        mysql.pool.query(sql, context, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                //move file into images folder
                fse.copy(req.files.sigImg.path, './public/images/'+name)
                res.status(200);
                res.end();
            }
        });
    });

    //get router for displaying newAward page
    router.get('/newAward', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var context ={};
        var callbackcount=0;
        getUsers(res, mysql, context, complete);
        getAwardList(res, mysql,context, complete);
        function complete(){
            callbackcount++;
            if(callbackcount >= 2){
                context.layout = 'admin';
                res.render('newAward', context);
            }
        }
        
    });
    //post router to add award to DB
    router.post('/newAward', isLoggedIn, function(req, res){
        var mysql = req.app.get('mysql');
        var id = req.session.context.user_id;
        req.fields.createDate = new Date();
        var sql = 'INSERT INTO user_awards (user_id, award_id, award_date, created_by, created_date, active_flag) VALUES(?,?,?,?,?, 1)';
        var data = [req.fields.name, req.fields.aType, req.fields.date, id,req.fields.createDate];
        
        mysql.pool.query(sql, data, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            else{
                //create award
                //convert user_id to first name and last name
                var callbackcount =0;
                var recv={};
                var send={};
                getUserInfo(res, mysql, recv, req.fields.name, complete)
                getUserInfo(res, mysql, send, req.session.context.user_id, complete)
                function complete(){
                    callbackcount++;
                    if(callbackcount>=2){
                        //process date string
                        var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
                        dateSplit = req.fields.date.split("-");
                        req.fields.year = dateSplit[0];
                        req.fields.month = months[parseInt(dateSplit[1])-1];
                        req.fields.day = dateSplit[2];
                        //insert data into latex form
                        var options ={                    
                            args: ["\\def\\monVar{"+req.fields.month+" }\\def\\recvVar{"+recv.user.first_name+" "+recv.user.last_name+"}\\def\\dayVar{"+req.fields.day+" }\\def\\yearVar{"+req.fields.year+"}\\def\\sendVar{"+send.user.first_name+" "+send.user.last_name+"}\\def\\sendSig{"+send.user.user_id+"}"],
                            errorLogs:"./public/error.txt"
                        }
                        // setup mail options
                        var mailoptions={
                            from:'467Kudos@gmail.com',
                            to: recv.user.email,      //test email, change to email recipient 
                            bcc: '467Kudos@gmail.com',
                            subject:'You have a new award',
                            text:'New award is the attached file',
                            attachments: [{path: './public/award.pdf'}]
                        };
                        //make Employee of the Month award
                        if(req.fields.aType == "1"){
                            var input = fse.createReadStream('./public/EmpOfMon.tex');
                            var output = fse.createWriteStream('./public/award.pdf');
                            var pdf = latex(input, options).pipe(output);
                            pdf.on('error', err => console.error(err));
                            pdf.on('finish', () => {
                                //send email award
                                transporter.sendMail(mailoptions, function(error, info){
                                    if(error){
                                        console.log(error);
                                    }
                                });
                            });
                            res.redirect('/userHome');
                        }
                        //make Outstanding contribution award
                        else if(req.fields.aType == "2"){
                            var input = fse.createReadStream('./public/OutCont.tex');
                            var output = fse.createWriteStream('./public/award.pdf');
                            var pdf = latex(input, options).pipe(output);
                            pdf.on('error', err => console.error(err));
                            pdf.on('finish', () => {
                                //send email award
                                transporter.sendMail(mailoptions, function(error, info){
                                    if(error){
                                        console.log(error);
                                    }
                                });
                            });
                            res.redirect('/userHome');
                        }
                    }
                }
            }
        });
 
    });
    
    return router;

}();
