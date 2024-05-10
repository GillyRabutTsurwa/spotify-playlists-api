"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantiateSpotify = void 0;
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
function instantiateSpotify() {
    const spotifyAPI = new spotify_web_api_node_1.default({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    return spotifyAPI;
}
exports.instantiateSpotify = instantiateSpotify;
