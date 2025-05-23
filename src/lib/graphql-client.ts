
import { createClient } from 'graphql-ws';

const wsUrl = import.meta.env.VITE_GRAPHQL_WS_URL || 'wss://localhost:4000/graphql';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

class GraphQLClient {
  private wsClient: any;
  private authToken: string | null = null;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.wsClient = createClient({
      url: wsUrl,
      connectionParams: () => ({
        Authorization: this.authToken ? `Bearer ${this.authToken}` : '',
      }),
      shouldRetry: () => true,
    });
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    // Reinitialize WebSocket with new auth token
    this.wsClient?.dispose();
    this.initializeWebSocket();
  }

  async query<T>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    return new Promise((resolve, reject) => {
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
