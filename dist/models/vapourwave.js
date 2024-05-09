"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const vapourWaveSchema = new mongoose_1.default.Schema({
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
}, { collection: "vapourwave" });
const Vapourwave = mongoose_1.default.model("Vapourwave", vapourWaveSchema);
exports.default = Vapourwave;
