FROM node:22-alpine AS build
WORKDIR /app
COPY fixtures/javascript_container_app_pnpm/ ./
ENV PATH="/opt/package-manager/bin:${PATH}"
RUN npm install --global --prefix /opt/package-manager pnpm@10.34.5 && pnpm install --frozen-lockfile --prod=false
ARG FIXTURE_MESSAGE_SUFFIX=default
RUN FIXTURE_MESSAGE_SUFFIX="${FIXTURE_MESSAGE_SUFFIX}" pnpm run build

FROM nginx:1.28-alpine
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
