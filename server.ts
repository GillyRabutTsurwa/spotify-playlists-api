import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import SpotifyWebAPI from "spotify-web-api-node";

const app: Express = express();
const PORT: number | string = process.env.PORT || 4242;

dotenv.config();

app.use(bodyParser.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
);

app.get("/", (_, response: Response) => {
    response.send(`Spotify Settings depuis ${process.env.CLIENT_URL}`);
});

app.post("/refresh", (request: Request, response: Response) => {
    const refreshToken: string = request.body.refreshToken;
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
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

app.post("/login", (request: Request, response: Response) => {
    const code: string = request.body.code;
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
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

app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});