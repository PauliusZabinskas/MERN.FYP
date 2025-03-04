# run the dev server
npm run dev

# run mongo db
docker-compose up -d
mongosh -u admin -p password --authenticationDatabase admin
