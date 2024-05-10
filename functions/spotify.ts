import SpotifyWebAPI from "spotify-web-api-node";

export function instantiateSpotify() {
    const spotifyAPI: SpotifyWebAPI = new SpotifyWebAPI({
        redirectUri: process.env.CLIENT_REDIRECT_URI,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    return spotifyAPI;
}
