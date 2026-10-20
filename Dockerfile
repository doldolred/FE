# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# 결제 공개 키 — docker-compose 의 build.args 로 들어온다 (Vite 는 빌드할 때 값을 박아 넣는다)
ARG VITE_PAYMENT_PROVIDER=nicepay
ARG VITE_NICEPAY_CLIENT_ID=
ARG VITE_PORTONE_STORE_ID=
ARG VITE_PORTONE_CHANNEL_KEY=
ENV VITE_PAYMENT_PROVIDER=$VITE_PAYMENT_PROVIDER \
    VITE_NICEPAY_CLIENT_ID=$VITE_NICEPAY_CLIENT_ID \
    VITE_PORTONE_STORE_ID=$VITE_PORTONE_STORE_ID \
    VITE_PORTONE_CHANNEL_KEY=$VITE_PORTONE_CHANNEL_KEY
RUN npm run build

# ---- run ----
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
