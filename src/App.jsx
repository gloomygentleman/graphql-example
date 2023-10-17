import { gql, useQuery } from "@apollo/client";

import Users from "./Users";

const ROOT_QUERY = gql`
  query allUsers {
    totalUsers
    allUsers {
      githubLogin
      name
      avatar
    }
  }
`;

const App = () => {
  const { loading, data, refetch, startPolling, stopPolling } = useQuery(
    ROOT_QUERY,
    {
      // polling option
      // pollInterval: 1000,
    }
  );

  if (loading) return <p>사용자 불러오는 중...</p>;

  return (
    <div>
      <div>총 : {data.totalUsers}</div>
      <button onClick={() => refetch()}>다시 요청</button>
      <button onClick={() => startPolling(1000)}>폴링 시작</button>
      <button onClick={() => stopPolling()}>폴링 중단</button>
      <Users users={data.allUsers} />
    </div>
  );
};

export default App;
