"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateFavourites = void 0;
const spotify_1 = require("./spotify");
function populateFavourites(response, cache, Model) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = cache.get("accessToken");
        if (!accessToken) {
            response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
            return;
        }
        const spotifyAPI = (0, spotify_1.instantiateSpotify)();
        spotifyAPI.setAccessToken(accessToken);
        function fetchAllTracks() {
            return __awaiter(this, void 0, void 0, function* () {
                let allTracks = [];
                let next = null;
                let limit = 0;
                let offset = 100;
                try {
                    do {
                        const réponse = yield spotifyAPI.getMySavedTracks({
                            limit: limit,
                            offset: offset,
                        });
                        const tracks = réponse.body.items;
                        allTracks.push(...tracks);
                        offset += limit;
                        next = réponse.body.next;
                    } while (next);
                    return allTracks;
                }
                catch (err) {
                    console.error("Error fetching songs", err);
                }
            });
        }
        try {
            // const tracks = await fetchAllTracks();
            fetchAllTracks()
                .then((data) => {
                console.log(data);
                response.status(200).json({ message: "Songs successfully stored", propotype: data });
            })
                .catch((err) => {
                console.error(err);
            });
            // tracks?.forEach(async (currentTrack: any) => {
            //     const albumArtwork = currentTrack.track.album.images.find((currentAlbumImage: any) => currentAlbumImage.width === 300);
            //     const existingTrack = await Model.findOne({ uri: currentTrack.track.uri });
            //     if (existingTrack) return;
            //     try {
            //         await Model.create({
            //             artist: currentTrack.track.artists[0].name,
            //             title: currentTrack.track.name,
            //             uri: currentTrack.track.uri,
            //             album: currentTrack.track.album.name,
            //             albumImg: albumArtwork.url,
            //         });
            //     } catch (err) {
            //         console.error("Problem populating documents to database");
            //     }
            // });
        }
        catch (err) {
            console.error("Error fetching songs", err);
            response.status(500).json({ error: "Error fetching songs" });
        }
    });
}
exports.populateFavourites = populateFavourites;
