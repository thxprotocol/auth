mongoimport --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/auth?authSource=admin&ssl=false" --file="/docker-entrypoint-initdb.d/fixture/client.json" --jsonArray;
mongoimport --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/auth?authSource=admin&ssl=false" --file="/docker-entrypoint-initdb.d/fixture/accounts.json" --jsonArray;
mongoimport --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/auth?authSource=admin&ssl=false" --file="/docker-entrypoint-initdb.d/fixture/registration_access_token.json"  --jsonArray;
mongo --eval "db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD'); db = db.getSiblingDB('$MONGO_INITDB_DATABASE'); db.createUser({ user: '$MONGODB_USER', pwd: '$MONGODB_PASSWORD', roles: [{ role: 'readWrite', db: '$MONGODB_NAME' }] });";