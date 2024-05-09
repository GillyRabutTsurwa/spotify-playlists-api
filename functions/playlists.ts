import { Response } from "express";
import NodeCache from "node-cache";
import SpotifyWebAPI from "spotify-web-api-node";

export async function populatePlaylist(response: Response, cache: NodeCache, playlistID: string, Model: any) {
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
                    album: currentTrack.track.album.name,
                    albumImg: albumArtwork.url,
                });
            } catch (err) {
                console.error("Problem populating documents to database");
            }
        });
        response.status(200).json({ message: "Songs successfully stored", propotype: réponse.body.tracks });
    } catch (err) {
        console.error("Error fetching songs", err);
        response.status(500).json({ error: "Error fetching songs" });
    }
}
