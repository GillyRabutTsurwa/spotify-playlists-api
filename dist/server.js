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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4242;
dotenv.config();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
}));
app.get("/", (_, response) => {
    response.send(`Spotify Settings depuis ${process.env.CLIENT_URL}`);
});
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
        response.json({
            accessToken: data.access_token,
            expiresIn: data.expires_in,
        });
    }
    catch (err) {
        console.error("Could not refresh accesss token", err); //NOTE: haven't decided if i want to make my own error handling functionality
    }
    finally {
        console.log("Done attempting access token refresh");
    }
}));
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
app.listen(PORT, () => {
    console.log("Server listening on Port", PORT);
});
