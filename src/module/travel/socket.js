/**
 * The system socket, for asking another client to do something.
 *
 * Foundry gives each system one channel (`system.<id>`, enabled by `"socket": true` in
 * system.json). Messages carry an `action`; each feature registers its own handler. A
 * client never receives what it emitted itself, so a handler only ever runs elsewhere.
 */

const CHANNEL = "system.pe";
const handlers = new Map();

/** @param {string} action @param {(data: object) => unknown} handler */
function onSocket(action, handler) {
    handlers.set(action, handler);
}

/** @param {string} action @param {object} data */
function emitSocket(action, data) {
    game.socket.emit(CHANNEL, { action, data });
}

/** Called once on `ready`. */
function registerSocket() {
    game.socket.on(CHANNEL, async (message) => {
        const handler = handlers.get(message?.action);
        if (!handler) return;
        try {
            await handler(message.data ?? {});
        } catch (error) {
            console.error(`PokemonEpopee | socket action "${message.action}" failed:`, error);
        }
    });
}

export { onSocket, emitSocket, registerSocket };
