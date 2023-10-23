const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const { createServer } = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { useServer } = require('graphql-ws/lib/use/ws');
const { typeDefs } = require('./typeDefs.js');
const { resolvers } = require('./resolvers.js');
const { WebSocketServer } = require('ws');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

/**
 * ## 참고
 * - https://www.apollographql.com/docs/apollo-server/api/express-middleware/
 * - https://www.apollographql.com/docs/apollo-server/integrations/mern/
 * - mongodb API: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
 */
const start = async () => {
  const app = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscription',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: () => ({
        pubsub,
      }),
    },
    wsServer
  );

  // Apollo Server Instance 생성
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({
        httpServer,
      }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Apollo Servr사 뜰때까지 기다린다.
  await server.start();

  app.use(cors());
  app.use(
    '/graphql',
    bodyParser.json(),
    expressMiddleware(server, {
      context: () => ({ pubsub }),
    })
  );

  await new Promise((resolve) =>
    httpServer.listen(
      {
        port: '9080',
        resolve,
      },
      () => {
        console.log(`🚀 Server ready at http://localhost:9080/`);
      }
    )
  );
};

start();
