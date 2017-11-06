#!/usr/bin/env bash
DOCKER_PATH=$(which docker)
SERVICE_NAME=screening-api
IMAGE_TAG=bidir/$SERVICE_NAME
EXPOSE_PORT=8040
CONT_PORT=8040
HOST_IP=10.142.0.2
MONGODB_URL=mongodb://10.142.0.2:27017/bidir
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
  -p $HOST:$EXPOSE_PORT:$CONT_PORT \
  -e HOST=$HOST_IP \
  -e MONGODB_URL=$MONGODB_URL \
  --restart=always \
  $IMAGE_TAG

