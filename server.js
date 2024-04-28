require("dotenv").config();

const express = require("express");
const SpotifyWebAPI = require("spotify-web-api-node");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 4242;

app.use(bodyParser.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
);

app.get("/", (_, response) => {
    response.send("Spotify Settings");
});

app.post("/refresh", (request, response) => {
    const refreshToken = request.body.refreshToken;
    const spotifyAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: refreshToken,
    });
    spotifyAPI
        .refreshAccessToken()
        .then((data) => {
            console.log("Access token refreshed");
            console.log(data.body);
            response.json({
                accessToken: data.body.access_token,
                expiresIn: data.body.expires_in,
            });
        })
        .catch((err) => {
            console.error("Could not refresh accesss token", err);
        })
        .finally(() => {
            console.log("Done attempting access token refresh");
        });
});

app.post("/login", (request, response) => {
    const code = request.body.code;
    const spotifyAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: null,
    });
    spotifyAPI
        .authorizationCodeGrant(code)
        .then((data) => {
            response.json({
                accessToken: data.body.access_token,
                refreshToken: data.body.refresh_token,
                expiresIn: data.body.expires_in,
            });
        })
        .catch((err) => {
            const { body, statusCode } = err;
            console.log(err);
            console.error(body);
            console.log(statusCode);
        })
        .finally(() => {
            console.log("Done retrieval attempt of access token");
        });
});

app.listen(PORT, function (err) {
    if (err) console.log("Error in server setup");
    console.log("Server listening on Port", PORT);
});
