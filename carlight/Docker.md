<!-- make a docker image  -->
docker build -t carlight-frontend:dev .  

<!-- check docker image is created or not  -->
docker images


<!-- run docker image with docker id {6c38a6a05072} -->
docker run -p 3000:3000 carlight-frontend:dev