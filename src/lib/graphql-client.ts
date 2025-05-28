import { createClient } from 'graphql-ws';

// Use environment variable or fallback to development URL
const wsUrl = import.meta.env.VITE_GRAPHQL_WS_URL || 
              (import.meta.env.DEV ? 'ws://localhost:4000/graphql' : 'wss://localhost:4000/graphql');

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

class GraphQLClient {
  private wsClient: any;
  private authToken: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      this.wsClient = createClient({
        url: wsUrl,
        connectionParams: () => ({
          Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
        }),
        shouldRetry: (closeEvent: any) => {
          // Don't retry if server is not available in development
          if (import.meta.env.DEV && closeEvent?.code === 1006) {
            console.warn('GraphQL WebSocket server not available in development mode');
            return false;
          }
          return this.reconnectAttempts < this.maxReconnectAttempts;
        },
        retryAttempts: this.maxReconnectAttempts,
        on: {
          connected: () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('GraphQL WebSocket connected');
          },
          closed: () => {
            this.isConnected = false;
            console.log('GraphQL WebSocket disconnected');
          },
          error: (error) => {
            console.error('GraphQL WebSocket error:', error);
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize GraphQL WebSocket:', error);
      // Create a mock client for development
      this.wsClient = this.createMockClient();
    }
  }

  private createMockClient() {
    return {
      subscribe: (payload: any, sink: any) => {
        console.log('Using mock GraphQL client for:', payload.query);
        // Return a mock subscription that doesn't do anything
        return () => {};
      },
      dispose: () => {},
    };
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    // Reinitialize WebSocket with new auth token
    if (this.wsClient?.dispose) {
      this.wsClient.dispose();
    }
    this.initializeWebSocket();
  }

  async query<T>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected && import.meta.env.DEV) {
        // Return mock data in development mode
        console.log('Returning mock data for query:', query);
        resolve({ data: {} as T });
        return;
      }

      const unsubscribe = this.wsClient.subscribe(
        {
          query,
          variables,
        },
        {
          next: (data: GraphQLResponse<T>) => {
            unsubscribe();
            resolve(data);
          },
          error: (error: any) => {
            unsubscribe();
            console.error('GraphQL query error:', error);
            reject(error);
          },
          complete: () => {
            unsubscribe();
          },
        }
      );
    });
  }

  subscribe<T>(
    query: string,
    variables?: Record<string, any>
  ) {
    if (!this.isConnected && import.meta.env.DEV) {
      console.log('Mock subscription for:', query);
      return () => {};
    }

    return this.wsClient.subscribe(
      {
        query,
        variables,
      },
      {
        next: (data: GraphQLResponse<T>) => console.log('Subscription data:', data),
        error: (error: any) => console.error('Subscription error:', error),
        complete: () => console.log('Subscription complete'),
      }
    );
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const graphqlClient = new GraphQLClient();

// Sample queries for demonstration
export const SAMPLE_QUERIES = {
  GET_PROJECTS: `
    query GetProjects {
      projects {
        id
        name
        status
        createdAt
      }
    }
  `,
  GET_MARKETING_ASSETS: `
    query GetMarketingAssets {
      marketingAssets {
        id
        title
        type
        status
        projectId
      }
    }
  `,
};
