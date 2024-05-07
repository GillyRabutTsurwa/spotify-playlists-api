import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import SpotifyWebAPI from "spotify-web-api-node";
import NodeCache from "node-cache";
import mongoose from "mongoose";

const app: Express = express();
const PORT: number | string = process.env.PORT || 4242;
const cache = new NodeCache({
    stdTTL: 3600,
});
const DATABASE_URL: string = "mongodb://127.0.0.1:27017";
const db = mongoose.connection;

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

dotenv.config();

app.use(bodyParser.urlencoded());
app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (_, response: Response) => {
    response.send("Spotify Settings Una");
});

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

app.get("/playlist/teststeezy", async (request: Request, response: Response) => {
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = await spotifyAPI.getPlaylist("4E7Vswz1uCbsSyh3VF7Dj2");
        console.log(réponse.body);
        response.json({
            name: réponse.body.name,
            description: réponse.body.description,
            owner: {
                name: réponse.body.owner.display_name,
                url: réponse.body.owner.external_urls.spotify,
            },
            songs: réponse.body.tracks.items,
            totalSongs: réponse.body.tracks.total,
            previous_url: réponse.body.tracks.previous,
            next_url: réponse.body.tracks.next,
        });
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
});

app.get("/liked", async (request: Request, response: Response) => {
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    spotifyAPI.setAccessToken(accessToken);
    try {
        const userTracks = await spotifyAPI.getMySavedTracks();
        const tracks = userTracks.body.items.map((item: any) => {
            return {
                name: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
            };
        });
        response.json(tracks);
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
});

app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
