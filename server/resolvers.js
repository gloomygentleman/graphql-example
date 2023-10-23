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
    addUser(parent, { input }) {
      const newUser = {
        id: userId++,
        ...input,
        created: new Date(),
      };

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
