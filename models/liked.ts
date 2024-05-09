import mongoose, { Schema } from "mongoose";
import { Track } from "../interface/track";

interface ILiked extends Track {}

const likedSchema: Schema = new mongoose.Schema<ILiked>(
    {
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
    },
    { collection: "liked" }
);

const Liked = mongoose.model<ILiked>("Liked", likedSchema);
export default Liked;
