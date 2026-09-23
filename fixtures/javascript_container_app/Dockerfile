FROM node:22-alpine AS build
WORKDIR /app
COPY fixtures/javascript_container_app/package*.json ./
RUN npm ci --include=dev
COPY fixtures/javascript_container_app/ ./
ARG FIXTURE_MESSAGE_SUFFIX=default
RUN FIXTURE_MESSAGE_SUFFIX="${FIXTURE_MESSAGE_SUFFIX}" npm run build

FROM nginx:1.28-alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
