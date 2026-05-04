interface GlobalEventHandlersEventMap {
    videoStep: CustomEvent<{ currentTime: number }>;
    videoJump: CustomEvent<{ currentTime: number }>;
}
