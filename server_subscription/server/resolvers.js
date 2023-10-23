const { GraphQLScalarType } = require('graphql');

let userId = 0;
let users = [];

const resolvers = {
  Query: {
    users() {
      return users;
    },
    totalUsers() {
      return users.length;
    },
  },
  Mutation: {
    addUser(parent, { input }, { pubsub }) {
      const newUser = {
        id: userId++,
        ...input,
        created: new Date(),
      };

      pubsub.publish('added-user', { newUser });

      users = [...users, newUser];

      return newUser;
    },
    updateUser(parent, { id, input }) {
      const user = users.find((user) => user.id === id);

      if (!(user === -1)) {
        throw new Error(`Not found User id: ${id}`);
      }

      const updateUser = {
        ...user,
        ...input,
      };

      users = [...users.filter((user) => user.id !== id), updateUser];

      return updateUser;
    },
  },

  Subscription: {
    newUser: {
      subscribe: (parent, args, { pubsub }) =>
        pubsub.asyncIterator(['added-user']),
    },
  },

  // Custom Scalar Type 정의
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid DateTime Value',
    serialize: (value) => new Date(value).toISOString(),
    parseLiteral: (ast) => ast.value,
    parseValue: (value) => new Date(value),
  }),
};

module.exports = { resolvers };
