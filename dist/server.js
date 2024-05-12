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
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
const node_cache_1 = __importDefault(require("node-cache"));
const mongoose_1 = __importDefault(require("mongoose"));
const track_1 = require("./models/track");
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
app.use(body_parser_1.default.urlencoded({ extended: true })); //@todo: ne pas oublier de le changer à bodyParser.json() quand tout est prêt de deployer
app.use((0, cors_1.default)({
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
// ================================================================================================
// Track Management
app.post("/playlists/afrique", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, playlists_1.populatePlaylist)(response, cache, "1x1JZBiYCWxOcinqkZnhGO", track_1.Afrique);
}));
app.get("/playlists/afrique", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Afrique.find();
    response.json(songs);
}));
app.post("/playlists/house", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, playlists_1.populatePlaylist)(response, cache, "6Fbu37ReQN0o2As9AAjMsy", track_1.House);
}));
app.get("/playlists/house", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.House.find();
    response.json(songs);
}));
app.post("/playlists/vapourwave", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, playlists_1.populatePlaylist)(response, cache, "4E7Vswz1uCbsSyh3VF7Dj2", track_1.House);
}));
app.get("/playlists/vapourwave", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Vapourwave.find();
    response.json(songs);
}));
app.post("/playlists/liked", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, favourites_1.populateFavourites)(response, cache, track_1.Favourites);
}));
app.get("/playlists/liked", (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    const songs = yield track_1.Favourites.find();
    response.json(songs);
}));
// =================================================================================================
app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
