"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Playlist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const imageSchema = new mongoose_1.default.Schema({
    url: String,
    width: Number,
    height: Number,
});
const userSchema = new mongoose_1.default.Schema({
    _id: String,
    name: String,
    url: String,
    type: String,
    uri: String,
});
const playlistSchema = new mongoose_1.default.Schema({
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
exports.Playlist = mongoose_1.default.model("Playlist", playlistSchema);
