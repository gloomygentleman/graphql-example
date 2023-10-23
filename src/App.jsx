import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';

import Users from './Users';
import AddUser from './AddUser';

const GET_USERS = gql`
  query GetUsers {
    totalUsers
    users {
      id
      name
      avatar
      type
      created
    }
  }
`;

const ADD_USER_MUTATION = gql`
  mutation addUser($input: UserInput!) {
    addUser(input: $input) {
      id
      name
      avatar
      type
      created
    }
  }
`;

const App = () => {
  const { loading, data } = useQuery(GET_USERS);
  const [mutation, { error }] = useMutation(ADD_USER_MUTATION, {
    update(cache, result) {
      cache.updateQuery(
        {
          query: gql`
            query UpdateUsers {
              users {
                id
                name
                avatar
                type
                created
              }
            }
          `,
        },
        (data) => ({
          users: [...data.users, result.data.addUser],
        })
      );
    },
  });

  const [isAddUser, setAddUser] = useState(false);

  if (loading) return <p>사용자 불러오는 중...</p>;

  const handleSubmit = async (e) => {
    const { name, type } = e.currentTarget;

    await mutation({
      variables: {
        input: {
          name: name.value,
          type: type.value,
        },
      },
    });

    setAddUser(false);
  };

  const handleAddUser = () => {
    setAddUser(true);
  };

  const handleAddUserCancel = () => {
    setAddUser(false);
  };

  return (
    <div>
      <div>총 : {data.totalUsers}</div>
      <Users users={data.users} />
      {isAddUser ? (
        <AddUser onCancel={handleAddUserCancel} onSubmit={handleSubmit} />
      ) : (
        <button onClick={handleAddUser}>추가</button>
      )}
      {error && (
        <div
          style={{
            color: 'red',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default App;
