import mongoose, { Schema } from "mongoose";
import { Track } from "../interface/track";

interface IVapourwave extends Track {}

const vapourWaveSchema: Schema = new mongoose.Schema<IVapourwave>(
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
    { collection: "vapourwave" }
);

const Vapourwave = mongoose.model<IVapourwave>("Vapourwave", vapourWaveSchema);
export default Vapourwave;
