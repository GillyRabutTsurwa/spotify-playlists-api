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
import { Playlist } from "./models/playlist";
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

// Cached Token Handling
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
    // bodyParser.urlencoded({ extended: true }),
    bodyParser.json(),
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
        cache.set("expiresIn", data.expires_in, 0);
        const tokenAccess = cache.get("accessToken");
        const tokenRefresh = cache.get("refreshToken");
        const tokenExpire = cache.get("expiresIn");
        console.log(`AccessToken in Cache: ${tokenAccess}`);
        console.log(`RefreshToken in Cache: ${tokenRefresh}`);
        console.log(`ExpirationToken in Cache: ${tokenExpire}`);

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

app.get("/refresh", (_, response: Response) => {
    const accessToken = cache.get("accessToken");
    const expiresIn = cache.get("expiresIn");

    response.json({
        accessToken: accessToken,
        expiresIn: expiresIn,
    });
});

// Get my info

app.get("/me", async (request: Request, response: Response) => {
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = await spotifyAPI.getMe();
        const myInfo = réponse.body;
        console.clear();
        console.log(myInfo);
        response.status(200).json(myInfo);
    } catch (err) {
        response.status(400).json({ error: "Something went wrong" });
    }
});

// Get user info

app.get("/:user", async (request: Request, response: Response) => {
    const user = request.params.user;
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = await spotifyAPI.getUser(user);
        const myInfo = réponse.body;
        response.status(200).json(myInfo);
    } catch (err) {
        response.status(400).json({ error: "Something went wrong" });
    }
});

// ================================================================================================

// Track Management

app.post("/playlists", async (request: Request, response: Response) => {
    const user = request.body.user;
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);

    try {
        const réponse = await spotifyAPI.getUserPlaylists(user);
        const playlists = réponse.body.items;

        if (user !== "tsurwagilly") {
            // NOTE: si je suis pas le user, ne pas essayer de mettre les playlists dans le bases de données
            response.status(200).json(playlists);
            return;
        }

        playlists.forEach(async (currentPlaylist) => {
            const existingPlaylist = await Playlist.findOne({ _id: currentPlaylist.id });
            if (existingPlaylist) return;
            try {
                await Playlist.create({
                    _id: currentPlaylist.id,
                    name: currentPlaylist.name,
                    description: currentPlaylist.description,
                    images: currentPlaylist.images,
                    owner: {
                        id: currentPlaylist.owner.id,
                        name: currentPlaylist.owner.display_name,
                        url: currentPlaylist.owner.external_urls.spotify,
                        type: currentPlaylist.owner.type,
                        uri: currentPlaylist.owner.uri,
                    },
                });
            } catch (err) {
                console.error(err);
            } finally {
                console.log("Done");
            }
        });
        const dbPlaylists = await Playlist.find();
        // response.status(200).json(dbPlaylists); //NOTE ceci derange les chose ches la client
        response.status(200).json(playlists);
    } catch (error) {
        response.status(400).json({ error: "Something went wrong" });
    }
});

app.post("/playlist", async (request: Request, response: Response) => {
    const playlistID = request.body.playlistID;
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);

    try {
        const réponse = await spotifyAPI.getPlaylistTracks(playlistID);
        const tracks = réponse.body.items;
        response.status(200).json(tracks);
    } catch (err) {
        response.status(400).json({ error: err });
    }
});

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
