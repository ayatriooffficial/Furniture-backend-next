const fs = require("fs");
var request = require("request");
var { google } = require("googleapis");

// Load credentials from environment variable or key.json
let key;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  key = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  key = require("./key.json");
}

exports.getIndexing = async (req, res) => {
  try {
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ["https://www.googleapis.com/auth/indexing"],
      null
    );

    const urlToIndex = req.body.url;

    if (!urlToIndex) {
      return res.status(400).send("URL is required in the request body.");
    }

    jwtClient.authorize(function (err, tokens) {
      if (err) {
        // console.log(err);
        return res.status(500).send("Failed to authorize with Google API.");
      }
      const options = {
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify({
          url: urlToIndex,
          type: "URL_UPDATED",
        }),
      };

      const request = require("request");
      request(options, (err, resp, body) => {
        if (err) {
          // console.log(err);
          return res
            .status(500)
            .send("Failed to send URL to Google Indexing API.");
        }
        // console.log(body);
        res.status(200).send(body);
      });
    });
  } catch (error) {
    // console.log(error);
  }
};
