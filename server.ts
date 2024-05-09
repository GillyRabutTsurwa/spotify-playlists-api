import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import SpotifyWebAPI from "spotify-web-api-node";
import NodeCache from "node-cache";
import mongoose from "mongoose";
import Vapourwave from "./models/vapourwave";
import Liked from "./models/liked";
import { populatePlaylist } from "./functions/playlists";

const app: Express = express();
const PORT: number | string = process.env.PORT || 4242;
const cache = new NodeCache({
    stdTTL: 3600,
});
const DATABASE_URL: string = "mongodb://127.0.0.1:27017";

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

app.post("/playlist/vapourwave", async (_, response: Response) => {
    await populatePlaylist(response, cache, "4E7Vswz1uCbsSyh3VF7Dj2", Vapourwave);
});

app.get("/playlists/vapourwave", async (_, response: Response) => {
    const songs = await Vapourwave.find();
    response.json(songs);
});

app.post("/playlists/liked", async (request: Request, response: Response) => {
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
        const réponse = await spotifyAPI.getMySavedTracks();
        console.log(réponse.body);

        réponse.body.items.forEach(async (currentTrack: any) => {
            const albumArtwork = currentTrack.track.album.images.find((currentAlbumImage: any) => currentAlbumImage.width === 300);
            const existingTrack = await Liked.findOne({ uri: currentTrack.track.uri });
            if (existingTrack) return;
            try {
                await Liked.create({
                    artist: currentTrack.track.artists[0].name,
                    title: currentTrack.track.name,
                    uri: currentTrack.track.uri,
                    album: currentTrack.track.album.name,
                    albumImg: albumArtwork.url,
                });
            } catch (err) {
                console.error("Problem populating documents to database");
            }
        });
        response.status(200).json({ message: "Songs successfully stored", propotype: réponse.body.items });
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
});

app.get("/playlists/liked", async (_, response: Response) => {
    const songs = await Liked.find();
    response.json(songs);
});

// =================================================================================================

app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
