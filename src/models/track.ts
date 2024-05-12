import mongoose, { Schema } from "mongoose";
import { Track } from "../interface/track";

interface ITrack extends Track {}

const trackSchema: Schema = new mongoose.Schema<ITrack>({
    title: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
    uri: {
        type: String,
        required: true,
    },
    album: {
        type: String,
        required: true,
    },
    albumImg: {
        type: String,
        required: true,
    },
});

//NOTE: on peut aussi spécifier le nom du collection avec le 3ème argument dans la fonction model()
export const Vapourwave = mongoose.model<ITrack>("Vapourwave", trackSchema, "vapourwave");
export const House = mongoose.model<ITrack>("House", trackSchema, "house");
export const LoFi = mongoose.model<ITrack>("LoFi", trackSchema, "lo-fi");
export const HiFi = mongoose.model<ITrack>("HiFi", trackSchema, "hi-fi");
export const Afrique = mongoose.model<ITrack>("Afrique", trackSchema, "afrique");
export const FIFA = mongoose.model<ITrack>("FIFA", trackSchema, "fifa");
export const Favourites = mongoose.model<ITrack>("Favourites", trackSchema, "favourites");
