/**
 * EndpointManager class
 * Manages endpoint registration and listener routing
 * Handles endpoint lifecycle
 */
export class EndpointManager {
    /**
     * @private
     * @type {Map<string, Function[]>}
     */
    #endpoints = new Map();

    /**
     * Registers a listener for an endpoint
     * @param {string} endpoint - Endpoint identifier
     * @param {Function} listener - Listener function
     * @returns {Function} Unsubscribe function
     */
    register(endpoint, listener) {
        let listeners = this.#endpoints.get(endpoint);
        if (!listeners) {
            listeners = [];
            this.#endpoints.set(endpoint, listeners);
        }
        listeners.push(listener);

        // Return unsubscribe function
        return () => {
            const idx = listeners.indexOf(listener);
            if (idx !== -1) {
                listeners.splice(idx, 1);
            }
            if (listeners.length === 0) {
                this.#endpoints.delete(endpoint);
            }
        };
    }

    /**
     * Gets all listeners for an endpoint
     * @param {string} endpoint - Endpoint identifier
     * @returns {Function[] | undefined} Array of listeners or undefined
     */
    getListeners(endpoint) {
        return this.#endpoints.get(endpoint);
    }

    /**
     * Checks if an endpoint has listeners
     * @param {string} endpoint - Endpoint identifier
     * @returns {boolean} True if endpoint has listeners
     */
    hasListeners(endpoint) {
        const listeners = this.#endpoints.get(endpoint);
        return listeners !== undefined && listeners.length > 0;
    }

    /**
     * Clears all listeners for an endpoint
     * @param {string} endpoint - Endpoint identifier
     */
    clear(endpoint) {
        this.#endpoints.delete(endpoint);
    }

    /**
     * Clears all endpoints
     */
    clearAll() {
        this.#endpoints.clear();
    }
}
