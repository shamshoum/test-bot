'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express();
const Parse = require('parse/node');

Parse.serverURL = 'http://bot-parse.herokuapp.com/parse';
Parse.initialize("botparse1967");

class FacebookUser extends Parse.Object {
  constructor(userId) {
    // Pass the ClassName to the Parse.Object constructor
    super('FacebookUser');
    this.set('facebookId', userId)
    var query = new Parse.Query(this);
    query.equalTo("facebookId", userId);
    query.first({
      success: function(result) {
        console.log(result);
        this.exists = true;
      },
      error: function(error) {
        this.exists = false;
      }
    });
  }

  exists() {
    return this.exists;
  }

  saveUser() {
    this.save(null, {
      success: function(gameScore) {
        // Execute any logic that should take place after the object is saved.
        // alert('New object created with objectId: ' + gameScore.id);
        console.log(gameScore);
      },
      error: function(gameScore, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        // alert('Failed to create new object, with error code: ' + error.message);
        console.log('failed saving');
      }
    });
  }
}

Parse.Object.registerSubclass('FacebookUser', FacebookUser);

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
  res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
    res.send(req.query['hub.challenge'])
  } else {
    res.send('Error, wrong token')
  }
})

// Spin up the server
app.listen(app.get('port'), function() {
  console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
  console.log('got message');
  let messaging_events = req.body.entry[0].messaging
  console.log(req.body.entry[0].messaging);
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id;

    if (event.message && event.message.text) {
      var user = new FacebookUser(sender);
      if(user.exists()) {
        // User Exists
        sendTextMessage(sender, "You already exist");
      } else {
        let text = event.message.text
        if (text === 'Generic') {
          sendGenericMessage(sender)
          continue
        }
        sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
      }
    }
  }
  res.sendStatus(200)
})

function sendTextMessage(sender, text) {
  let messageData = { text:text }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function sendGenericMessage(sender) {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "https://cdn.arstechnica.net/wp-content/uploads/sites/3/2016/10/Oculus-Rift-vs-HTC-Vive-vs-PlayStation-VR-1.jpg",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com",
            "title": "web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        }, {
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://gizmoandme.com/wp-content/uploads/2016/02/gearVR.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

const token = "EAATfBxAxmgUBAKfNj83fyrzZBZBU639QEPubGTZBmuJj7SZBOoCA5tLAQgYAI2tpZBsDJZCmZCK5vBoRaJxX7Fzeikrz9YS84ARk5e74eMKhhRfI3RfeRbhUGscOg9cNbGdBztVXbKSfTTGZCQz3fba79cvQppAQiPATlnXTAOBi7QZDZD"
