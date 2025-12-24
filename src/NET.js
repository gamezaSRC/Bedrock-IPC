import { NetworkSerializer } from './net/NetworkSerializer.js';
import { EndpointManager } from './net/EndpointManager.js';
import { MessageEmitter } from './net/MessageEmitter.js';
import { MessageListener } from './net/MessageListener.js';

class NET {
    static FRAG_MAX = NetworkSerializer.FRAG_MAX;

    static #endpointManager = new EndpointManager();
    static #emitter = new MessageEmitter();
    static #listener = null;

    static *serialize(buffer, maxSize) {
        yield* NetworkSerializer.serialize(buffer, maxSize);
    }

    static *deserialize(strings) {
        yield* NetworkSerializer.deserialize(strings);
    }

    static *emit(endpoint, serializer, value) {
        yield* NET.#emitter.emit(endpoint, serializer, value);
    }

    static listen(endpoint, serializer, callback) {
        if (!NET.#listener) {
            NET.#listener = new MessageListener(NET.#endpointManager);
            NET.#listener.initialize();
        }
        return NET.#listener.listen(endpoint, serializer, callback);
    }
}

export default NET;