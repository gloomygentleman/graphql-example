import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: `http://localhost:9080/graphql`,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:9080/subscription',
  })
);

const splitLink = split(
  // Callback 함수의 Return 이 true면 wsLink를 false라면 httpLink를 실행한다.
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
