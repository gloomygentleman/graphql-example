/** @link https://www.apollographql.com/docs/devtools/apollo-config/ */

module.exports = {
  client: {
    service: {
      name: 'graphql-example',
      url: 'http://localhost:8080/graphql',
    },
    includs: ['./src/**/*.js'],
  },
};
