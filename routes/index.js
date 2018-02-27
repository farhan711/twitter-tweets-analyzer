var express = require('express');
var router = express.Router();
var myTwit = require("../tweetsofinterest");
var flatten = require('../flatten');
var https = require('https');
var url = require('url');
var querystring = require('querystring');
var extend = require('util')._extend;




var service_url, service_username, service_password;

if (process.env.VCAP_SERVICES) {
  console.log('Parsing VCAP_SERVICES');
  var services = JSON.parse(process.env.VCAP_SERVICES);
  //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
  var service_name = 'user_modeling';

  if (services[service_name]) {
    var svc = services[service_name][0].credentials;
    service_url = svc.url;
    service_username = svc.username;
    service_password = svc.password;
  }
  
  else {
    console.log('The service '+service_name+' is not in the VCAP_SERVICES, did you forget to bind it?');
  }

}

else {
  console.log('No VCAP_SERVICES found in ENV, using defaults for local development');
}

var auth = 'Basic ' + new Buffer(service_username + ':' + service_password).toString('base64');



/* GET home page. */
router.get('/', function(req, res) {
  //res.render('index', { title: 'Express' });
  res.location("gethandle");
  res.redirect("gethandle");
});

router.get('/gethandle', function(req, res){
  res.render('testboot');
});

router.post('/showtweets', function(req, res){
  if (req.body.button == "Controversial Tweets") {
    var handle = req.body.handle;
    myTwit.controversialTweets(handle, function(tweets){
      console.log("In router: " + tweets.length);
      
      
      if (tweets.length==0) {
        tweets = ["This user does not appear to have tweeted anything controversial or their tweets are not publicly available.",
                  "Alternatively, you may be blocked out of the Twitter API for making too many requests :P. If this is the case, please wait up to 15 minutes and try again."];
      }
      res.render('showtweets', {tweetlist: tweets, tweeter: handle});
    });
  }
  else{

    var handle = req.body.handle;
    
    
    myTwit.getTweets(handle, function(tweetString){
      
      var parts = url.parse(service_url.replace(/\/$/,''));
      
      var profile_options = { host: parts.hostname,
      port: parts.port,
      path: parts.pathname + "/api/v2/profile",
      method: 'POST',
      headers: {
        'Content-Type'  :'application/json',
        'Authorization' :  auth }
      };
    
    create_profile_request(profile_options, tweetString)(function(error,profile_string) {
      if (error) res.render('index',{'error': error.message});
      else {
        // parse the profile and format it
        var profile_json = JSON.parse(profile_string);
        var flat_traits = flatten.flat(profile_json.tree);
  
        // Extend the profile options and change the request path to get the visualization
        // Path to visualization is /api/v2/visualize, add w and h to get 900x900 chart
        var viz_options = extend(profile_options, { path :  parts.pathname +
         "/api/v2/visualize?w=900&h=900&imgurl=%2Fimages%2Fapp.png"});
  
        // create a visualization request with the profile data
        create_viz_request(viz_options,profile_string)(function(error,viz) {
          if (error) res.render('index',{'error': error.message});
          else {
            return res.render('watson', {'traits': flat_traits, 'viz':viz, tweeter: handle});
          }
        });
      }
    });
    
    
    });
  }
  //
});

router.get('/testjade', function(req,res){
  res.render('testjade', {title: "Welcome to Test Jade! ! !"});
});

router.get('/testboot', function(req,res){
  res.render('testboot', {title: "Welcome to Test Boot!!!"});
});

router.get('/showtweets', function(req,res){
  var tweets = ["hello", "hi", "whatup"];
  res.render('showtweets', {tweetlist: tweets});
});



/*
 *Functions used by Bluemix for Watson Service
 *
 */

var create_profile_request = function(options,content) {
  return function (/*function*/ callback) {
    // create the post data to send to the User Modeling service
    var post_data = {
      'contentItems' : [{
        'userid' : 'dummy',
        'id' : 'dummyUuid',
        'sourceid' : 'freetext',
        'contenttype' : 'text/plain',
        'language' : 'en',
        'content': content
      }]
    };
    // Create a request to POST to the User Modeling service
    var profile_req = https.request(options, function(result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function(chunk) {
        response_string += chunk;
      });

      result.on('end', function() {

        if (result.statusCode != 200) {
          var error = JSON.parse(response_string);
          callback({'message': error.user_message}, null);
        } else
          callback(null,response_string);
      });
    });

    profile_req.on('error', function(e) {
      callback(e,null);
    });

    profile_req.write(JSON.stringify(post_data));
    profile_req.end();
  };
};

var create_viz_request = function(options,profile) {
  return function (/*function*/ callback) {
    // Create a request to POST to the User Modeling service
    var viz_req = https.request(options, function(result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function(chunk) {
        response_string += chunk;
      });

      result.on('end', function() {
        if (result.statusCode != 200) {
          var error = JSON.parse(response_string);
          callback({'message': error.user_message}, null);
        } else
          callback(null,response_string);      });
    });

    viz_req.on('error', function(e) {
      callback(e,null);
    });
    viz_req.write(profile);
    viz_req.end();
  };
};






module.exports = router;
