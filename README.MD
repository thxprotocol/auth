[![CI](https://github.com/thxprotocol/auth/actions/workflows/ci.yml/badge.svg)](https://github.com/thxprotocol/auth/actions/workflows/ci.yml)

# THX Auth
This repository holds the OAuth2 OpenID Connect provider based on the excellent node-oidc-provider by panva.


-   [Health](https://localhost:3030/health)
-   [OIDC config](https://localhost:3030/)
-   [Developer Documentation](https://docs.thx.network)

## 1. Prerequisites

-   Docker
-   [NVM](https://github.com/nvm-sh/nvm)

We use docker to run our dependencies like mongo and hardhat in. We run the development server locally, managing a common node version using Node Version Manager. You can also manually install the correct node version but usage of NVM is recommended.

## 2. Installing

```
# 1. Install/activate current nodejs defined in .nvmrc
nvm use

# 2. Provide environment variables
cp .env.example .env

# 3. This readme assumes you have installed the API. 
# Copy it's `./certs` folder to the root of this project

or use [mkcert](https://github.com/FiloSottile/mkcert) and run

```
mdir certs
mkcert -key-file certs/localhost.key -cert-file certs/localhost.crt localhost
```

# 4. Create jwks
npm run build:keys

# 5. Checkout SCSS submodule
git submodule init
git submodule update

# 6. Install packages
npm ci
```

## 3. Usage
A thx_hardhat container with prefilled wallets and all required contracts will be deployed automatically.

```
# 7. Start containers
docker compose up

# 8. Start process
npm start

```

## 4. Testing

```
#Runs all suites
npm test 

#Runs a specific test by file name
npm test <file_name_part>
```

## 5. Register OAuth clients

### 5.1 client_credentials grant
Commonly used for data exchange between client and server. Extend `scope` property with required resources.

```
POST https://localhost:3030/reg
{
    "application_type": "web",
    "grant_types": ["client_credentials"],
    "redirect_uris": [],
    "response_types": [],
    "scope": "openid"
}
```

### 5.2 authorization_code grant
Commonly used for data exchange between servers. Extend `scope` property with required resources.

```
POST https://localhost:3030/reg
{
    "application_type": "web",
    "grant_types": ["authorization_code"],
    "redirect_uris": ["https://localhost:8083/signin-oidc"],
    "post_logout_redirect_uris": ["https://localhost:8083"],
    "response_types": ["code"],
    "scope": "openid" 
}
```

## 6. Database Schema Migration

### 6.1 Add migrations

```
npm run migrate:create name-of-my-migration
```

A new file will be created inside migrations folder with a corresponding timestamp.

```
|_ migrations/
   |- 20210108114324-name-of-my-script.js
```

### 6.3 Run migrations

```
# To get the migration status
npm run migrate:status

# To run your migrations, simply run the command
npm run migrate

# To rollback a migration use the down command
npm run migrate:undo-last
```
