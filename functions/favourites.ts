import { Response } from "express";
import { instantiateSpotify } from "./spotify";
import NodeCache from "node-cache";
import SpotifyWebAPI from "spotify-web-api-node";

export async function populateFavourites(response: Response, cache: NodeCache, Model: any) {
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);

    async function fetchAllTracks() {
        let allTracks = [];
        let next = null;
        let limit = 0;
        let offset = 100;

        try {
            do {
                const réponse = await spotifyAPI.getMySavedTracks({
                    limit: limit,
                    offset: offset,
                });
                const tracks = réponse.body.items;

                allTracks.push(...tracks);
                offset += limit;
                next = réponse.body.next;
            } while (next);
            return allTracks;
        } catch (err) {
            console.error("Error fetching songs", err);
        }
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
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
}
