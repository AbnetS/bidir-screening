DOCKER_PATH=$(which docker)
SERVICE_NAME=screening-service
IMAGE_TAG=bidir/$SERVICE_NAME
EXPOSE_PORT=8040

# Stop running container
$DOCKER_PATH stop $SERVICE_NAME

# Remove container
$DOCKER_PATH rm $SERVICE_NAME

# Remove previous image
$DOCKER_PATH rmi $IMAGE_TAG

# Build image
$DOCKER_PATH build -t $IMAGE_TAG .

# Build the container
$DOCKER_PATH run -d \
  --name $SERVICE_NAME \
  -p $HOST_IP:$EXPOSE_PORT:$EXPOSE_PORT \
  -e HOST_IP=$HOST_IP \
  -e API_URL=$API_URL \
  -e MONGODB_URL=$MONGODB_URL \
  --restart=always \
  $IMAGE_TAG
