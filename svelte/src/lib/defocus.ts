export default function defocus(node: any) {
    const handleClick = (event: PointerEvent) => {
        if (
            node &&
            !node.contains(event.target) &&
            !event.defaultPrevented
        ) {
            node.dispatchEvent(
                new CustomEvent("defocus", node)
            );
        }
    };

    document.addEventListener(
        "pointerdown",
        handleClick,
        true
    );

    return {
        destroy() {
            document.removeEventListener(
                "pointerdown",
                handleClick,
                true
            );
        },
    };
}
