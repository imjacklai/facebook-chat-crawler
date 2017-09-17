const fs = require("fs");
const readlineSync = require('readline-sync');
const prependFile = require("prepend-file");
const login = require("facebook-chat-api");

var timestamp = null;

if (fs.existsSync('appstate.json')) {
  loginWithFile()
} else {
  loginWithEmailAndPassword()
}

function loginWithFile() {
  login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if (err) return console.error(err);
    askThredId(api);
  });
}

function loginWithEmailAndPassword() {
  var email = readlineSync.question("Facebook Email: ");
  var password = readlineSync.question("Facebook Password: ", { hideEchoBack: true });
  const credentials = { email: email, password: password };

  login(credentials, (err, api) => {
    if (err) return console.error(err);
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    askThredId(api);
  });
}

function askThredId(api) {
  var threadId = readlineSync.question("ThreadId: ");
  fetchMessages(api, threadId);
}

function fetchMessages(api, threadId) {
  api.getThreadHistory(threadId, 50, timestamp, (err, history) => {
      if (err) return console.error(err);

      /*
          Since the timestamp is from a previous loaded message,
          that message will be included in this history so we can discard it unless it is the first load.
      */
      if (timestamp != undefined) history.pop();

      /*
          Handle message history
      */

      var text = "";

      for (const message of history) {
        text = text + `${message.senderName}: ${message.body}\n`;
      }

      prependFile('history.txt', text, function (err) {
        if (err) return console.log(err);
      });

      timestamp = history[0].timestamp;

      fetchMessages(api, threadId);
  });
}
