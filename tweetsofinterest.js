/*Given an array of tweets
 *uses sentiment analysis to identify tweets of interest
 *
 */



var getOneTweets = require ("./getalltweets");
//var getAllTweets = require ("./getalltweetsarray");
var sentiment = require ("sentiment")


var controArray;

/*Removes all uninteresting tweets from an array of tweets
 */



function oneArraySentiment(tweetsArray, callback) {
    controArray = [];
    var newTweetsArray = tweetsArray
    sentimentSeries(newTweetsArray.shift(), newTweetsArray, callback );
}



/*Accept handle
 *Print out all tweets and two scores
 */
function tweetsOfInterestCalibrate(handle){
    getOneTweets.getId(handle, function(newId){
        getOneTweets.getTweets(newId, function(tweetsArray){
            var newTweetsArray = tweetsArray;
            console.log(newId);
            calibrateSeries(newTweetsArray.shift(), newTweetsArray);
        });
    });
}

function calibrateSeries(tweet, newTweetsArray) {
    if(tweet){
        var textOf;
        
        if (tweet.retweeted_status) {
            textOf = tweet.retweeted_status.text + " (Retweet)";
        }
        else{
            textOf = tweet.text;
        }
        
        var tweetSentiment = (sentiment(textOf)).score;
        var tweetComparative = (sentiment(textOf)).comparative;
        
        console.log(textOf + "\nSentiment: " + tweetSentiment + "\nComparative: " +tweetComparative);
        console.log("\n\n\n\n");
        calibrateSeries(newTweetsArray.shift(), newTweetsArray);
    }
    else{
        //done
    }
}


function sentimentSeries(tweet, newTweetsArray, callback){
    if (tweet){
        var textOf;
        if (tweet.retweeted_status) {
            textOf = tweet.retweeted_status.text + " (Retweet)";
        }
        else{
            textOf = tweet.text;
        }
        if (tweet.created_at) {
            textOf = textOf + "    *" +tweet.created_at.substring(4,10) + " " + tweet.created_at.substring(26,32)  + "*    ";
        }
        else{ //should only come here if rate limit exceeded
            console.log("\n\nRate Limit Exceeded?????\n\n");
        }
        
        var tweetSentiment = (sentiment(textOf)).score;
        var tweetComparative = (sentiment(textOf)).comparative;
        if (tweetSentiment<-3 || tweetComparative<-0.5){
            controArray.push(textOf);
            //console.log(tweet.text + "\nSentiment: " + tweetSentiment + "\nComparative: " +tweetComparative);
            //console.log("\n\n\n\n");
            //console.log(textOf);
        }
        /*if (tweetComparative<-.5) {
            console.log(tweet.text + "\nComparative: " +tweetComparative);
            console.log("\n\n\n\n");
        }*/
        sentimentSeries(newTweetsArray.shift(), newTweetsArray, callback);
    }
    else{
        //callback();
        //console.log("done");
        //callback(controArray);
        callback(controArray);
    }
}

/*Takes an id
 *feeds the callback an array of controversial tweets from that id
 */
function controversialTweets(id, callback) {
    console.log("In controversial. Id = " + id);
    getOneTweets.getId(id, function(newId){
        if (newId == "error") {
            callback([]);
        }
        else{
            getOneTweets.getTweets(newId, function(tweetsArray){
                oneArraySentiment(tweetsArray,callback);
            })
        };
    });
    
}

/*Takes and handle and callback. Gives the callback all tweets
 */
function getTweets(handle, callback){
    getOneTweets.getId(handle, function(newId){
        getOneTweets.getTweets(newId, function(tweetsArray){
            var tweetString;
            for (var i = 0; i<tweetsArray.length; i++){
                var tweet = tweetsArray[i];
                var textOf;
                if (tweet.retweeted_status) {
                    textOf = tweet.retweeted_status.text;
                }
                else{
                    textOf = tweet.text;
                }
                tweetString += " " + textOf;
            }
            
            callback(tweetString);
       });
    });
    
}

function printTweets(array) {
    //console.log(array[array.length-1]);
    for (var i = 0; i <array.length; i++){
        console.log(array[i].text);
    }
}


exports.controversialTweets = controversialTweets;
exports.getTweets = getTweets;
//getOneTweets.getTweets(441383436, oneArraySentiment);//faraz
//controversialTweets(441383436, printTweets);
//tweetsOfInterestCalibrate("KobeBryant");
 
