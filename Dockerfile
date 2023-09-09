FROM node:18.14 as builder
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

COPY ./src /build/src
COPY package*.json /build/
COPY tsconfig*.json /build/
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n" > /build/.npmrc

RUN cd /build && npm ci \
  && npm run build \
  && npm prune --production \
  && rm -rf tsconfig*.json \
  && rm -rf src \
  && chown -R root:root .

FROM node:18.14-alpine
COPY --from=builder /build ./app/
WORKDIR /app

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]
