enum UserInputs {
    PEN_TAP,
    PEN_DRAG,
    TOUCH_TAP,
    TOUCH_DRAG,
    MOUSE_TAP,
    MOUSE_DRAG,
}

enum UserActions {
    SELECT,
    DRAW,
    PAN,
    NONE, // NONE is used to represent null
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

export {
    UserActions,
    UserInputs,
    type UserBrush,
    userBrushFieldsNum,
    userBrushFieldsStr,
    defaultBrush,
};
