import mongoose, { Schema, Document } from "mongoose";

// interface IPlaylist extends Track {}
interface Image {
    url: string;
    width: number;
    height: number;
}

interface User {
    _id: string;
    name: string;
    url: string;
    type: string;
    uri: string;
}

interface IPlaylist extends Document {
    _id: string;
    name: string;
    description: string;
    images: Array<Image>;
    owner: User;
    public: boolean;
    type: string;
    uri: string;
}

const imageSchema: Schema = new mongoose.Schema<Image>({
    url: String,
    width: Number,
    height: Number,
});

const userSchema: Schema = new mongoose.Schema<User>({
    _id: String,
    name: String,
    url: String,
    type: String,
    uri: String,
});

const playlistSchema: Schema = new mongoose.Schema<IPlaylist>({
    _id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    images: {
        type: [imageSchema],
        required: false,
    },
    owner: {
        type: userSchema,
        required: false,
    },
});

export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);
