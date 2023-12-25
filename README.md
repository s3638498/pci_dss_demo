A demo application for PCI DSS requirement using Google Cloud Key Management 
Tech stack use:
- `nodejs`
- `typescript`
- `express JS`
- `Postgres`
- `Google Cloud KMS`

In `.env` please specifiy the 
- GOOGLE_APPLICATION_CREDENTIALS
- KMS_LOCATION
- KMS_KEY_RING
- KMS_KEY_NAME
- psql-user
- host
- database
- password
- port: 5432

endpoint = 
- `http://{server}:{port}/tokenise`
- `http://{server}:{port}/detokenise`
