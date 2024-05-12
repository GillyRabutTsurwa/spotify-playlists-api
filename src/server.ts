import path from "path";
import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import SpotifyWebAPI from "spotify-web-api-node";
import NodeCache from "node-cache";
import mongoose from "mongoose";
import { instantiateSpotify } from "./functions/spotify";
import { Afrique, House, Favourites, Vapourwave } from "./models/track";
import { populatePlaylist } from "./functions/playlists";
import { populateFavourites } from "./functions/favourites";

dotenv.config({
    path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
});

const app: Express = express();
const PORT: number | string = process.env.PORT || 4242;
const cache = new NodeCache({
    stdTTL: 3600,
});
const DATABASE_URL: string = process.env.MONGODB_URI as string;

console.log(process.env.CLIENT_URL);
console.log(process.env.CLIENT_REDIRECT_URI);
console.log(process.env.MONGODB_URI);

(async () => {
    try {
        const dbServer = await mongoose.connect(DATABASE_URL, {
            dbName: "spotify",
        });
        console.log(`Connected to the ${dbServer.connection.db.databaseName} database @ host ${dbServer.connection.host}`);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.set("debug", true);
    }
})();

app.use(bodyParser.urlencoded({ extended: true })); //@todo: ne pas oublier de le changer à bodyParser.json() quand tout est prêt de deployer
app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (_, response: Response) => {
    response.send("Spotify Settings Una");
});

// Authorisation & Token Handling

app.get("/authorisation", (_, response: Response) => {
    const redirectURL = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLIENT_REDIRECT_URI}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing`;

    response.json({
        url: redirectURL,
    });
});

app.post("/login", async (request: Request, response: Response) => {
    const code: string = request.body.code;
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    try {
        const authResponse = await spotifyAPI.authorizationCodeGrant(code);
        const data = authResponse.body;
        console.log(data);
        cache.set("accessToken", data.access_token);
        response.json({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        });
    } catch (err) {
        console.error("Could not refresh accesss token", err);
    } finally {
        console.log("Done retrieval attempt of access token");
    }
});

app.post("/refresh", async (request: Request, response: Response) => {
    const refreshToken: string = request.body.refreshToken;
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: refreshToken,
    });

    try {
        const tokenResponse = await spotifyAPI.refreshAccessToken();
        const data = tokenResponse.body;
        console.log(data);
        cache.set("accessToken", data.access_token);
        response.json({
            accessToken: data.access_token,
            expiresIn: data.expires_in,
        });
    } catch (err) {
        console.error("Could not refresh accesss token", err);
    } finally {
        console.log("Done attempting access token refresh");
    }
});

// ================================================================================================

// Track Management

app.post("/playlists/afrique", async (_, response: Response) => {
    await populatePlaylist(response, cache, "1x1JZBiYCWxOcinqkZnhGO", Afrique);
});

app.get("/playlists/afrique", async (_, response: Response) => {
    const songs = await Afrique.find();
    response.json(songs);
});

app.post("/playlists/house", async (_, response: Response) => {
    await populatePlaylist(response, cache, "6Fbu37ReQN0o2As9AAjMsy", House);
});

app.get("/playlists/house", async (_, response: Response) => {
    const songs = await House.find();
    response.json(songs);
});

app.post("/playlists/vapourwave", async (_, response: Response) => {
    await populatePlaylist(response, cache, "4E7Vswz1uCbsSyh3VF7Dj2", House);
});

app.get("/playlists/vapourwave", async (_, response: Response) => {
    const songs = await Vapourwave.find();
    response.json(songs);
});

app.post("/playlists/liked", async (_, response: Response) => {
    await populateFavourites(response, cache, Favourites);
});

app.get("/playlists/liked", async (_, response: Response) => {
    const songs = await Favourites.find();
    response.json(songs);
});

// =================================================================================================

app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
