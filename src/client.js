import { ApolloClient, InMemoryCache } from "@apollo/client";

// GraphQL 을 로컬 메모리 캐싱을 할 수 있다.
// `extract` 함수로 캐시 내부를 볼 수 있다.
// console. log('cache', client.extract())

const client = new ApolloClient({
  // url: "http://localhost:8080/graphql",
  uri: "http://localhost:8080/graphql",
  cache: new InMemoryCache(),
});

export default client;
