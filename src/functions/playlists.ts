import { Response } from "express";
import { instantiateSpotify } from "./spotify";
import NodeCache from "node-cache";
import SpotifyWebAPI from "spotify-web-api-node";

export async function populatePlaylist(response: Response, cache: NodeCache, playlistID: string, Model: any, songs: any[]) {
    const accessToken: string | undefined = cache.get("accessToken") as string;
    if (!accessToken) {
        response.status(401).json({ error: "Access Token Not Found In These Skreetz" });
        return;
    }
    const spotifyAPI: SpotifyWebAPI = instantiateSpotify();
    spotifyAPI.setAccessToken(accessToken);

    try {
        const réponse = await spotifyAPI.getPlaylist(playlistID);
        console.log(réponse.body);

        réponse.body.tracks.items.forEach(async (currentTrack: any) => {
            const albumArtwork = currentTrack.track.album.images.find((currentAlbumImage: any) => currentAlbumImage.width === 300);
            const existingTrack = await Model.findOne({ uri: currentTrack.track.uri });
            if (existingTrack) return;
            try {
                await Model.create({
                    artist: currentTrack.track.artists[0].name,
                    title: currentTrack.track.name,
                    uri: currentTrack.track.uri,
                    album: {
                        name: currentTrack.track.album.name,
                        images: currentTrack.track.album.images,
                    },
                });
            } catch (err) {
                console.error("Problem populating documents to database");
            }
        });
        response.status(200).json({ message: "Songs successfully stored", playlist: songs });
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
}
