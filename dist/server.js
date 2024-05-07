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
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const node_cache_1 = __importDefault(require("node-cache"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4242;
const cache = new node_cache_1.default({
    stdTTL: 3600,
});
dotenv.config();
app.use(body_parser_1.default.urlencoded());
app.use((0, cors_1.default)({
    origin: "*",
}));
app.get("/", (_, response) => {
    response.send("Spotify Settings Una");
});
app.get("/authorisation", (_, response) => {
    const redirectURL = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLIENT_REDIRECT_URI}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing`;
    response.json({
        url: redirectURL,
    });
});
app.post("/login", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const code = request.body.code;
    const spotifyAPI = new spotify_web_api_node_1.default({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    try {
        const authResponse = yield spotifyAPI.authorizationCodeGrant(code);
        const data = authResponse.body;
        console.log(data);
        cache.set("accessToken", data.access_token);
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
app.post("/refresh", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = request.body.refreshToken;
    const spotifyAPI = new spotify_web_api_node_1.default({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: refreshToken,
    });
    try {
        const tokenResponse = yield spotifyAPI.refreshAccessToken();
        const data = tokenResponse.body;
        console.log(data);
        cache.set("accessToken", data.access_token);
        response.json({
            accessToken: data.access_token,
            expiresIn: data.expires_in,
        });
    }
    catch (err) {
        console.error("Could not refresh accesss token", err);
    }
    finally {
        console.log("Done attempting access token refresh");
    }
}));
app.get("/playlist/teststeezy", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = cache.get("accessToken");
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI = new spotify_web_api_node_1.default({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    spotifyAPI.setAccessToken(accessToken);
    try {
        const réponse = yield spotifyAPI.getPlaylist("4E7Vswz1uCbsSyh3VF7Dj2");
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
    }
    catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
}));
app.get("/liked", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = cache.get("accessToken");
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI = new spotify_web_api_node_1.default({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    spotifyAPI.setAccessToken(accessToken);
    try {
        const userTracks = yield spotifyAPI.getMySavedTracks();
        const tracks = userTracks.body.items.map((item) => {
            return {
                name: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
            };
        });
        response.json(tracks);
    }
    catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
}));
app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
