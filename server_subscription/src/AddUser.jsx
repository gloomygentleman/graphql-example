const AddUser = (props) => {
  const { onSubmit, onCancel } = props;

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(e);
  };

  return (
    <div
      style={{
        marginTop: '40px',
      }}
    >
      <form onSubmit={handleSubmit}>
        <label>
          이름:
          <input
            name="name"
            type="text"
            placeholder="이름"
            autoFocus
            required
          />
        </label>
        <fieldset
          style={{
            width: '200px',
          }}
        >
          <legend>유저 타입:</legend>
          <label>
            <input
              name="type"
              defaultChecked
              type="radio"
              placeholder="운영자"
              value="ADMIN"
            />
            운영자
          </label>
          <label>
            <input name="type" type="radio" placeholder="사용자" value="USER" />
            사용자
          </label>
        </fieldset>
        <button type="submit">등록</button>
        <button type="button" onClick={onCancel}>
          취소
        </button>
      </form>
    </div>
  );
};

export default AddUser;
