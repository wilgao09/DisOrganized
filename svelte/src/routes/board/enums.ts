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

export { UserActions, UserInputs };
