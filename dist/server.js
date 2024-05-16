"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const node_cache_1 = __importDefault(require("node-cache"));
const mongoose_1 = __importDefault(require("mongoose"));
const spotify_1 = require("./functions/spotify");
const track_1 = require("./models/track");
const playlist_1 = require("./models/playlist");
const playlists_1 = require("./functions/playlists");
const favourites_1 = require("./functions/favourites");
dotenv.config({
    path: path_1.default.join(__dirname, `../.env.${process.env.NODE_ENV}`),
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4242;
const cache = new node_cache_1.default({
    stdTTL: 3600,
});
const DATABASE_URL = process.env.MONGODB_URI;
console.log(process.env.CLIENT_URL);
console.log(process.env.CLIENT_REDIRECT_URI);
console.log(process.env.MONGODB_URI);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dbServer = yield mongoose_1.default.connect(DATABASE_URL, {
            dbName: "spotify",
        });
        console.log(`Connected to the ${dbServer.connection.db.databaseName} database @ host ${dbServer.connection.host}`);
    }
    catch (err) {
        console.error(err);
    }
    finally {
        mongoose_1.default.set("debug", true);
    }
}))();
// Cached Token Handling
cache.on("expired", (key, value) => __awaiter(void 0, void 0, void 0, function* () {
    if (key === "accessToken") {
        console.log(`${key} key is expired`);
        const refreshToken = cache.get("refreshToken");
        const spotifyAPI = (0, spotify_1.instantiateSpotify)();
        spotifyAPI.setRefreshToken(refreshToken);
        try {
            const tokenResponse = yield spotifyAPI.refreshAccessToken();
            const data = tokenResponse.body;
            console.log(data);
            value = data.access_token;
            cache.set("accessToken", value);
        }
        catch (err) {
            console.error("Could not refresh accesss token", err);
        }
        finally {
            console.log("Done attempting access token refresh");
        }
    }
}));
app.use(body_parser_1.default.urlencoded({ extended: true }), (0, cors_1.default)({
    origin: "*",
}));
app.get("/", (_, response) => {
    response.send("Spotify Settings Una");
});
// Authorisation & Token Handling
app.get("/authorisation", (_, response) => {
    const redirectURL = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLIENT_REDIRECT_URI}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing`;
    response.json({
        url: redirectURL,
    });
});
app.post("/login", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const code = request.body.code;
    const spotifyAPI = (0, spotify_1.instantiateSpotify)();
    try {
        const authResponse = yield spotifyAPI.authorizationCodeGrant(code);
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
    }
    catch (err) {
        console.error("Could not refresh accesss token", err);
    }
    finally {
        console.log("Done retrieval attempt of access token");
    }
}));
app.get("/refresh", (_, response) => {
    const accessToken = cache.get("accessToken");
    const expiresIn = cache.get("expiresIn");
    response.json({
        accessToken: accessToken,
        expiresIn: expiresIn,
    });
});
// Get my info
app.get("/me", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = cache.get("accessToken");
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI = (0, spotify_1.instantiateSpotify)();
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = yield spotifyAPI.getMe();
        const myInfo = réponse.body;
        console.clear();
        console.log(myInfo);
        response.status(200).json(myInfo);
    }
    catch (err) {
        response.status(400).json({ error: "Something went wrong" });
    }
}));
// Get user info
app.get("/:user", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const user = request.params.user;
    const accessToken = cache.get("accessToken");
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI = (0, spotify_1.instantiateSpotify)();
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = yield spotifyAPI.getUser(user);
        const myInfo = réponse.body;
        response.status(200).json(myInfo);
    }
    catch (err) {
        response.status(400).json({ error: "Something went wrong" });
    }
}));
// ================================================================================================
// Track Management
app.post("/playlists", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const user = request.body.user;
    const accessToken = cache.get("accessToken");
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI = (0, spotify_1.instantiateSpotify)();
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = yield spotifyAPI.getUserPlaylists(user);
        const playlists = réponse.body.items;
        if (user !== "tsurwagilly") {
            // NOTE: si je suis pas le user, ne pas essayer de mettre les playlists dans le bases de données
            response.status(200).json(playlists);
            return;
        }
        playlists.forEach((currentPlaylist) => __awaiter(void 0, void 0, void 0, function* () {
            const existingPlaylist = yield playlist_1.Playlist.findOne({ _id: currentPlaylist.id });
            if (existingPlaylist)
                return;
            try {
                yield playlist_1.Playlist.create({
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
            }
            catch (err) {
                console.error(err);
            }
            finally {
                console.log("Done");
            }
        }));
        const dbPlaylists = yield playlist_1.Playlist.find();
        response.status(200).json(dbPlaylists);
    }
    catch (error) {
        response.status(400).json({ error: "Something went wrong" });
    }
}));
app.get("/playlists/afrique", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Afrique.find();
    yield (0, playlists_1.populatePlaylist)(response, cache, "1x1JZBiYCWxOcinqkZnhGO", track_1.Afrique, songs);
}));
app.get("/playlists/house", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.House.find();
    yield (0, playlists_1.populatePlaylist)(response, cache, "6Fbu37ReQN0o2As9AAjMsy", track_1.House, songs);
}));
app.get("/playlists/vapourwave", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Vapourwave.find();
    yield (0, playlists_1.populatePlaylist)(response, cache, "4E7Vswz1uCbsSyh3VF7Dj2", track_1.Vapourwave, songs);
}));
app.get("/playlists/liked", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Favourites.find();
    yield (0, favourites_1.populateFavourites)(response, cache, track_1.Favourites, songs);
}));
// =================================================================================================
app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
