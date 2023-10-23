const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const { typeDefs } = require('./typeDefs.js');
const { resolvers } = require('./resolvers.js');

/**
 * ## 참고
 * - https://www.apollographql.com/docs/apollo-server/api/express-middleware/
 * - https://www.apollographql.com/docs/apollo-server/integrations/mern/
 * - mongodb API: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
 */
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Apollo Server Instance 생성
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({
        httpServer,
      }),
    ],
  });

  // Apollo Servr사 뜰때까지 기다린다.
  await server.start();

  app.use(express.static('public'));
  app.use(cors());

  app.use('/graphql', bodyParser.json(), expressMiddleware(server, {}));

  await new Promise((resolve) =>
    httpServer.listen({
      port: '8080',
      resolve,
    })
  );

  console.log(`🚀 Server ready at http://localhost:8080/`);
};

start();
