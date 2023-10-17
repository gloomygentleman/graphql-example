import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { GraphQLScalarType } from "graphql";
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";

config();

const pubsub = new PubSub();

const typeDefs = `#graphql
  enum PhotoCategory {
    SELFIE
    PORTRAIT
    ACTION
    LANDSCAPE
    GRAPHIC
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type User {
    githubLogin: ID!
    name: String
    avatar: String
    # Photo Type 과의 1:N 관계
    postedPhotos: [Photo!]!
    # Photo Type 과 N:N 관계
    inPhotos: [Photo!]!
  }

  # Custom Scalar type을 정의하기 위해서는 아래와 같이 총 3가지의 파싱 작업이 필요하다.
  # 1. serialize 를 할 수 있는 Resolver
  # 2. 쿼리 인자 파싱
  # 3. AST 파싱
  scalar DateTime

  # Photo 타입 정의 추가
  type Photo {
    id: ID!
    url: String!
    name: String!
    description: String
    category: PhotoCategory!
    created: DateTime!
    # User Type 과의 1:N 관계
    postedBy: User!
    # User Type 과의 N:N 관계
    taggedUsers: [User!]!
  }

  input PostPhotoInput {
    name: String!
    category: PhotoCategory = PORTRAIT
    description: String
  }

  type Subscription {
    newPhoto: Photo!
  }

  type Query {
    me: User
    totalPhotos: Int!
    "allPhotos에서 Photo 타입 반환"
    allPhotos: [Photo!]!
    totalUsers: Int!
    allUsers: [User!]!
  }

  type Mutation {
    postPhoto(input: PostPhotoInput!): Photo!
    githubAuth(code: String!): AuthPayload!

    "임시 사용자 추가 API"
    addFakeUsers(count: Int = 1): [User!]!

    "임시 사용자 인증"
    fakeUserAuth(githubLogin: ID!): AuthPayload
  }
`;

// #######################################################

const users = [
  {
    githubLogin: "mHattrup",
    name: "Mike Hattrup",
  },
  {
    githubLogin: "gPlake",
    name: "Glen Plake",
  },
  {
    githubLogin: "sSchmidt",
    name: "Scot Schmidt",
  },
];

const photos = [
  {
    id: "1",
    name: "Dropping the Heart Chute",
    description: "The heart chute is one of my favorite chutes",
    category: "ACTION",
    githubUser: "gPlake",
    created: "2023-03-01",
  },
  {
    id: "2",
    name: "Enjoying the sunshine",
    category: "SELFIE",
    githubUser: "sSchmidt",
    created: "2023-03-08",
  },
  {
    id: "3",
    name: "Gunbarrel 25",
    description: "25 laps on gunbarrel today",
    category: "LANDSCAPE",
    githubUser: "sSchmidt",
    created: "2023-03-03",
  },
];

const tags = [
  { photoID: "1", userID: "gPlake" },
  { photoID: "2", userID: "sSchmidt" },
  { photoID: "2", userID: "mHattrup" },
  { photoID: "2", userID: "gPlake" },
];

// #######################################################

const toJSON = (res) => res.json();
const throwError = (error) => {
  throw new Error(JSON.stringify(error));
};

// Github API 요청 함수
const requestGithubToken = (credentials) =>
  fetch("https://github.com/login/oauth/access_token", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  })
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(JSON.stringify(error));
    });

// Github User 정보 요청
// 인증 요청: https://github.com/login/oauth/authorize?client_id=YOUR-ID-HERE&scope=user
const requestGithubUserAccount = ({ access_token }) =>
  fetch(`https://api.github.com/user`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
    .then(toJSON)
    .catch(throwError);

const authorizeWithGithub = async (credentials) => {
  const tokenInfo = await requestGithubToken(credentials);

  const githubUser = await requestGithubUserAccount(tokenInfo);

  return {
    ...githubUser,
    access_token: tokenInfo.access_token,
  };
};

const githubAuth = async (parent, { code }, { db }) => {
  // Github 데이터를 받아온다.
  const { message, access_token, avatar_url, login, name } =
    await authorizeWithGithub({
      client_id: process.env.GITHUB_ID,
      client_secret: process.env.GITHUB_SECRET,
      code,
    });

  if (message) {
    throw new Error(message);
  }

  // 결과값을 하나의 객체에 담는다.
  const latestUserInfo = {
    name,
    githubLogin: login,
    githubToken: access_token,
    avatar: avatar_url,
  };

  await db.collection("users").replaceOne(
    {
      githubLogin: login,
    },
    latestUserInfo,
    {
      upsert: true,
    }
  );

  return {
    user: latestUserInfo,
    token: access_token,
  };
};

const resolvers = {
  Query: {
    me: async (parent, args, { currentUser }) => currentUser,
    totalPhotos: (parent, args, { db }) =>
      db.collection("photos").estimatedDocumentCount(),
    allPhotos: (parent, args, { db }) =>
      db.collection("photos").find().toArray(),
    totalUsers: (parent, args, { db }) =>
      db.collection("users").estimatedDocumentCount(),
    allUsers: (parent, args, { db }) => db.collection("users").find().toArray(),
  },
  Mutation: {
    postPhoto: async (parent, args, { db, currentUser, pubsub }) => {
      // 컨텍스트에 사용자가 존재하는지 확인한다.
      if (!currentUser) {
        throw new Error("only an authorized user can post a photo");
      }

      const newPhoto = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date(),
      };

      // DB에 새로운 사진을 넣고 반환하는 id값을 받는다.
      const { insertedId } = await db.collection("photos").insertOne(newPhoto);

      newPhoto.id = insertedId;

      pubsub.publish("photo-added", { newPhoto });

      return newPhoto;
    },
    githubAuth,
    addFakeUsers: async (root, { count }, { db }) => {
      const randomUserApi = `https://randomuser.me/api/?results=${count}`;

      const { results } = await fetch(randomUserApi).then((res) => res.json());

      const users = results.map((r) => ({
        githubLogin: r.login.username,
        name: `${r.name.first} ${r.name.last}`,
        avatar: r.picture.thumbnail,
        githubToken: r.login.sha1,
      }));

      await db.collection("users").insertMany(users);

      return users;
    },
    fakeUserAuth: async (parent, { githubLogin }, { db }) => {
      const user = await db.collection("users").findOne({ githubLogin });

      if (!user) {
        throw new Error(`Cannot find user with githubLogin ${githubLogin}`);
      }

      return {
        token: user.githubToken,
        user,
      };
    },
  },
  Subscription: {
    newPhoto: {
      subscribe: (parent, args, { pubsub }) => {
        console.log(pubsub);

        return pubsub.asyncIterator(["photo-added"]);
      },
    },
  },
  Photo: {
    id: (parent) => parent.id || parent._id,
    url: (parent) => `/img/photos/${parent._id}.jpg`,
    postedBy: (parent, args, { db }) => {
      return db.collection("users").findOne({
        githubLogin: parent.userID,
      });
    },
    taggedUsers: (parent) =>
      tags
        .filter((tag) => tag.photoID === parent.id)
        .map((tag) => tag.userID)
        .map((userID) => users.find((u) => u.githubLogin === userID)),
  },
  User: {
    postedPhotos: (parent) => {
      return users.find((u) => u.githubLogin === parent.githubUser);
    },
    inPhotos: (parent) =>
      tags
        .filter((tag) => tag.userID === parent.id)
        .map((tag) => tag.photoID)
        .map((photoID) => photos.find((photo) => photo.id === photoID)),
  },
  // Custom Scalar Type 정의
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "A valid DateTime Value",
    serialize: (value) => new Date(value).toISOString(),
    parseLiteral: (ast) => ast.value,
    parseValue: (value) => new Date(value),
  }),
};

// ####################################################

/**
 * ## 참고
 * - https://www.apollographql.com/docs/apollo-server/api/express-middleware/
 * - https://www.apollographql.com/docs/apollo-server/integrations/mern/
 * - mongodb API: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
 */
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);
  const DB_HOST = process.env.DB_HOST;

  const client = await MongoClient.connect(DB_HOST, {});
  const db = client.db("graphql");

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const serverClearnup = useServer({ schema }, wsServer);

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
              await serverClearnup.dispose();
            },
          };
        },
      },
    ],
  });

  // Apollo Servr사 뜰때까지 기다린다.
  await server.start();

  app.use(express.static("public"));
  app.use(cors());

  app.use(
    "/graphql",
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // github token parsing
        const githubToken = req.headers.authorization;

        const currentUser = await db.collection("users").findOne({
          githubToken,
        });

        return { db, currentUser, pubsub };
      },
    })
  );

  await new Promise((resolve) =>
    httpServer.listen({
      port: "8080",
      resolve,
    })
  );

  console.log(`🚀 Server ready at http://localhost:8080/`);
};

start();
