import { onMount } from "svelte";
enum UserInputs {
    PEN_TAP,
    PEN_DRAG,
    TOUCH_TAP,
    TOUCH_DRAG,
    MOUSE_TAP,
    MOUSE_DRAG,
}

enum InputEventType {
    MOUSE = "mouse",
    PEN = "pen",
    TOUCH = "touch",
    KEY = "key",
}
enum UserActions {
    SELECT = "select",
    DRAW = "draw",
    PAN = "pan",
    TYPE = "type", // TODO: ???
    NONE = "none", // NONE is used to represent null
}
enum PluginSettingType {
    SELECT = "select",
    RADIO = "radio",
    CHECKBOX = "checkbox",
    TEXT = "text",
}

const userBrushFieldsStr = ["strokeStyle"] as const;
const userBrushFieldsNum = ["lineWidth"] as const;

interface UserBrush {
    strokeStyle: string;
    lineWidth: number;
}

const defaultBrush = {
    strokeStyle: "#000000",
    lineWidth: 5,
};

function loadEnums() {
    window.InputHandling = {
        InputEventType,
        UserActions,
    };
    window.PluginSettings = {
        PluginSettingType,
    };
}

export {
    loadEnums,
    UserInputs,
    type UserBrush,
    userBrushFieldsNum,
    userBrushFieldsStr,
    defaultBrush,
};
