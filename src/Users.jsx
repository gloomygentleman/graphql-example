import { gql } from "@apollo/client";

const PHOTO_SUBSCRIPTION = gql`
  subscription {
    newPhoto {
      url
      category
      postedBy {
        githubLogin
        avatar
      }
    }
  }
`;

const Users = (props) => {
  const { users } = props;

  return (
    <div>
      {users.map((user) => (
        <div>
          {user.name}
          <img src={user.avatar} alt="" />
        </div>
      ))}
    </div>
  );
};

export default Users;
