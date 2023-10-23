const Users = (props) => {
  const { users } = props;

  return (
    <div>
      <div>사용자 목록</div>
      <table
        style={{
          borderCollapse: 'separate',
          border: '1px solid #000',
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>유형</th>
            <th>생성일자</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{
                  fontSize: '14px',
                }}
              >
                사용자 없음
              </td>
            </tr>
          )}
          {users.map(({ id, name, type, created }) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{name}</td>
              <td>{type}</td>
              <td>{created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
