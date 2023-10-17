## 시작

```bash
$ pnpm i
```

## Client

### 시작하기

```bash
$ pnpm start
```

## Server

### 시작하기

```bash
$ pnpm start:server
```

## 실습 순서

실습을 위해서 Github의 OAuth 를 발급 받아 `client_id` `client_secret` 를 각각 `GITHUB_ID` 와 `GITHUB_SECRET`
에 저장 합니다.

이후 아래의 URL 로 Github 인증 요청을 수행 합니다.

`https://github.com/login/oauth/authorize?client_id=YOUR-ID-HERE&scope=user`

위의 URL로 인증을 완료하면 Playground로 돌아오게 됩니다.

다음으로 URL 의 `code` query paramter를 아래의 Mutation의 `$CODE`로 전달 합니다.

```graphql
mutation {
  githubAuth(code: $CODE) {
    token
    user {
      avatar
      githubLogin
      name
    }
  }
}
```

이후 전달 받은 `token` 의 Header에 `Authorization` 로 저장해서 전달 할 수 있도록 합니다.
