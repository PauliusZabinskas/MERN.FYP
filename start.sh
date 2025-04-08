docker-compose down -v  # Clean up previous containers if any
docker-compose up -d # Start the services in detached mode
npm run dev
cd frontend && npm run dev