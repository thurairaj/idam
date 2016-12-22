'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const MongoClient = require('mongodb').MongoClient
const moment = require('moment')
const session = require('client-sessions');
const crypto = require('crypto');

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(session({
  cookieName: 'session',
  secret: 'thurairaj92SecretSanta',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));


app.use(express.static('public'))
var debug = true;

app.get('/',function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post('/register', function(req,res){
	var response = {};
	if(! req.body.email || ! req.body.pass){
		response = {
			status : "ERROR",
			message : "Provide name and password!"
		}
		res.json(response);
		return;
	}

	//check if user exist or not
	MongoClient.connect('mongodb://travora.ca:27017/secretsanta', function(err, db){
	    if(err){
	    	response = {
				status : "ERROR",
				message : "Database error 101 : Try later!"
			}
			res.json(response);
			return;
	    }

	    db.collection("user").findOne({email:req.body.email}, {_id: true}, function(err, result){
			if(err || !!result){
				response = {
					status : "ERROR",
					message : "Name already exist :( , Some dumbass didn't follow instruction! "
				}
				res.json(response);
				return;				
			}else{
				var user = {}
				user.email = req.body.email;
				user.passsalt = generateRandomSalt(10);
				user.contentsalt = generateRandomSalt(5);
				user.password = sha512(req.body.pass, user.passsalt);
				user.secretsanta = "";
				user.selected = false;

				db.collection('user').insert(user, function(err){
			    	if(err){
				    	response = {
							status : "ERROR",
							message : "Database error 104 : Try later!"
						}
						res.json(response);
						return;
				    }
			    	user.contentPassword = sha512(req.body.pass , user.contentsalt);
			    	req.session.user = user;
					response = {
						status : "SUCCESS",
						message : "Got it",
						data : user
					}
					res.json(response);
					return;
			    })
			}
	    })
	})

	return;		
})

app.post('/login', function(req, res) {
	if(! req.body.email || ! req.body.pass){
		response = {
			status : "ERROR",
			message : "Provide email and password!"
		}
		res.json(response);
		return;
	}
	MongoClient.connect('mongodb://travora.ca:27017/secretsanta', function(err, db){
		if(err){
			response = {
				status : "ERROR",
				message : "Database error 201 : Try later!"
			}
			res.json(response);
			return;
		}				
		db.collection("user").findOne({email:req.body.email}, {}, function(err, user){
			if(err){
				response = {
					status : "ERROR",
					message : "Database error 201 : Try later!"
				}
				res.json(response);
				return;				
			}else if( !user){
				response = {
					status : "ERROR",
					message : "Username/Password doesn't match"
				}
				res.json(response);
				return;				
			}else{
				if(user.password == sha512(req.body.pass , user.passsalt)){
					user.contentPassword = sha512(req.body.pass , user.contentsalt);
					req.session.user = user;

					var response = {
						status : "SUCCESS",
						data : user
					}

					res.json(response).end();
					return;
				}else{
					response = {
						status : "ERROR",
						message : "Username/Password doesn't match"
					}
					res.json(response);
					return;	
				}
			}

	    })
	})
});

app.post('/getMySecretSanta', function(req, res){
	var user =  req.session.user;
	console.log("current user", user);
	var algorithm = 'aes-256-ctr';
	var currentDate = new Date();

	if(currentDate.getDate() < 8){
		var response = {
			status : "SUCCESS",
			message : "Secret Santa",
			data : "Wait for December 8 to know your secret santa :)"
		}
				
		res.json(response);
		return
	}


	if(! user && !user.contentPassword){
		response = {
			status : "LOGINERROR",
			message : "Session expired"
		}
		res.json(response);
		return;
	}

	if(user.secretsanta != ""){
		var decipher = crypto.createDecipher(algorithm, user.contentPassword)
		var dec = decipher.update(user.secretsanta,'hex','utf8')
		dec += decipher.final('utf8');

		var response = {
			status : "SUCCESS",
			message : "Secret Santa",
			data : dec
		}
				
		res.json(response);
		return

	}

	MongoClient.connect('mongodb://travora.ca:27017/secretsanta', function(err, db){
		if(err){
			response = {
				status : "ERROR",
				message : "Database error 301 : Try later!"
			}
			res.json(response);
			return;
		}		

		db.collection("user").find({'selected':false, 'email' : { '$ne' : user.email}}).toArray(function(err, users){
			if(err){
				var response = {
					status : "ERROR",
					message : "Database error 302 : Try later!"
				}
				res.json(response);
				return;
			}else if(users.legth < 1){
				var response = {
					status : "SUCCESS",
					data : "No Secret Santa yet, come back later! :( ",
				}
				res.json(response);
				return;
			}else{
				var index = Math.floor(Math.random() * users.length);
				
				var response = {
					status : "SUCCESS",
					message : "Secret Santa",
					data : users[index].email
				}
				

				db.collection("user").updateOne({'email' : user.email}, {'$set' : {"secretsanta" : crypto.createCipher(algorithm, user.contentPassword).update(users[index].email,'utf8','hex')}}, {}, 
					function(error, dbresponse){
					if(error){
						response = {
							status : "ERROR",
							message : "Database error 302 : Try later!"
						}
						res.json(response);
						return;
					}else{
						db.collection("user").updateOne({'email' : users[index].email} , {'$set' : {"selected" : true}}, {}, function(error, dbresponse){
							if(error){
								response = {
									status : "ERROR",
									message : "Database error 302 : Try later!"
								}
								res.json(response);
								return;
							}

							user.secretsanta = crypto.createCipher(algorithm, user.contentPassword).update(users[index].email,'utf8','hex');
							req.session.reset();
							req.session.user = user;
							res.json(response);
							console.log(req.session.user)
							return;
						})
					}
				})
			}
		})
	})
})


app.listen(2512, function(){
})


/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
function generateRandomSalt(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
function sha512(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return value
};