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

function configBodyParser() {
    return process.env.NODE_ENV !== "production" ? bodyParser.urlencoded({ extended: true }) : bodyParser.json();
}

// NOTE: cached token handling. refresh access token upon expiration
cache.on("expired", async (key: string, value: string) => {
    if (key === "accessToken") {
        console.log(`${key} key is expired`);
        const refreshToken = cache.get("refreshToken") as string;
        const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
        spotifyAPI.setRefreshToken(refreshToken);

        try {
            const tokenResponse = await spotifyAPI.refreshAccessToken();
            const data = tokenResponse.body;
            console.log(data);
            value = data.access_token;
            cache.set("accessToken", value);
        } catch (err) {
            console.error("Could not refresh accesss token", err);
        } finally {
            console.log("Done attempting access token refresh");
        }
    }
});

app.use(
    configBodyParser(),
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
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();

    try {
        const authResponse = await spotifyAPI.authorizationCodeGrant(code);
        const data = authResponse.body;
        console.log(data);
        cache.set("accessToken", data.access_token);
        cache.set("refreshToken", data.refresh_token, 0);
        const tokenAccess = cache.get("accessToken");
        const tokenRefresh = cache.get("refreshToken");
        console.log(`AccessToken in Cache: ${tokenAccess}`);
        console.log(`RefreshToken in Cache: ${tokenRefresh}`);
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

// ================================================================================================

// Track Management

app.get("/playlists/afrique", async (_, response: Response) => {
    const songs = await Afrique.find();
    await populatePlaylist(response, cache, "1x1JZBiYCWxOcinqkZnhGO", Afrique, songs);
});

app.get("/playlists/house", async (_, response: Response) => {
    const songs = await House.find();
    await populatePlaylist(response, cache, "6Fbu37ReQN0o2As9AAjMsy", House, songs);
});

app.get("/playlists/vapourwave", async (_, response: Response) => {
    const songs = await Vapourwave.find();
    await populatePlaylist(response, cache, "4E7Vswz1uCbsSyh3VF7Dj2", Vapourwave, songs);
});

app.get("/playlists/liked", async (_, response: Response) => {
    const songs = await Favourites.find();
    await populateFavourites(response, cache, Favourites, songs);
});

// =================================================================================================

app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
