const typeDefs = `#graphql
  scalar DateTime

  enum UserType {
    ADMIN
    USER
  }

  type User {
    id: ID!
    name: String!
    avatar: String
    type: UserType!
    created: DateTime!
  }

  type Query {
    totalUsers: Int!
    users: [User]
  }

  input UserInput {
    name: String!
    avatar: String
    type: UserType!
  }

  type Mutation {
    addUser(input: UserInput!): User!
    updateUser(id: ID! input: UserInput!): User!
  }
`;

module.exports = { typeDefs };
