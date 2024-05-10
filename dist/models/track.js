"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIFA = exports.Afrique = exports.HiFi = exports.LoFi = exports.House = exports.Vapourwave = void 0;
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
exports.Vapourwave = mongoose_1.default.model("Vapourwave", trackSchema);
exports.House = mongoose_1.default.model("House", trackSchema);
exports.LoFi = mongoose_1.default.model("LoFi", trackSchema);
exports.HiFi = mongoose_1.default.model("HiFi", trackSchema);
exports.Afrique = mongoose_1.default.model("Afrique", trackSchema);
exports.FIFA = mongoose_1.default.model("FIFA", trackSchema);
