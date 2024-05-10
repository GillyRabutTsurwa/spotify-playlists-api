"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favourites = exports.FIFA = exports.Afrique = exports.HiFi = exports.LoFi = exports.House = exports.Vapourwave = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const trackSchema = new mongoose_1.default.Schema({
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
exports.Vapourwave = mongoose_1.default.model("Vapourwave", trackSchema, "vapourwave");
exports.House = mongoose_1.default.model("House", trackSchema, "house");
exports.LoFi = mongoose_1.default.model("LoFi", trackSchema, "lo-fi");
exports.HiFi = mongoose_1.default.model("HiFi", trackSchema, "hi-fi");
exports.Afrique = mongoose_1.default.model("Afrique", trackSchema, "afrique");
exports.FIFA = mongoose_1.default.model("FIFA", trackSchema, "fifa");
exports.Favourites = mongoose_1.default.model("Favourites", trackSchema, "favourites");
