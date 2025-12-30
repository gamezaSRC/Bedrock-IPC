/**
 * Listener callback type
 */
export type EndpointListener = (header: unknown, fragment: string) => Generator<void, void>;

/**
 * Manages endpoint-listener mappings for message routing
 */
export class EndpointManager {
  private endpoints: Map<string, EndpointListener[]> = new Map();

  /**
   * Registers a listener for an endpoint
   * @param endpoint - Endpoint identifier
   * @param listener - Generator function to handle messages
   * @returns Unsubscribe function
   */
  register(endpoint: string, listener: EndpointListener): () => void {
    let listeners = this.endpoints.get(endpoint);
    if (!listeners) {
      listeners = [];
      this.endpoints.set(endpoint, listeners);
    }
    listeners.push(listener);

    return () => {
      const index = listeners!.indexOf(listener);
      if (index !== -1) {
        listeners!.splice(index, 1);
      }
      if (listeners!.length === 0) {
        this.endpoints.delete(endpoint);
      }
    };
  }

  /**
   * Gets all listeners for an endpoint
   * @param endpoint - Endpoint identifier
   * @returns Array of listeners or undefined
   */
  getListeners(endpoint: string): EndpointListener[] | undefined {
    return this.endpoints.get(endpoint);
  }

  /**
   * Checks if an endpoint has listeners
   * @param endpoint - Endpoint identifier
   * @returns True if listeners exist
   */
  hasListeners(endpoint: string): boolean {
    const listeners = this.endpoints.get(endpoint);
    return listeners !== undefined && listeners.length > 0;
  }

  /**
   * Clears all endpoints
   */
  clearAll(): void {
    this.endpoints.clear();
  }
}
