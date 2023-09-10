[![Actions Status](https://github.com/Codibre/nodejs-grpc-mutex-api/workflows/build/badge.svg)](https://github.com/Codibre/nodejs-grpc-mutex-api/actions)
[![Actions Status](https://github.com/Codibre/nodejs-grpc-mutex-api/workflows/test/badge.svg)](https://github.com/Codibre/nodejs-grpc-mutex-api/actions)
[![Actions Status](https://github.com/Codibre/nodejs-grpc-mutex-api/workflows/lint/badge.svg)](https://github.com/Codibre/nodejs-grpc-mutex-api/actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/65e41e3018643f28168e/test_coverage)](https://codeclimate.com/github/Codibre/nodejs-grpc-mutex-api/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/65e41e3018643f28168e/maintainability)](https://codeclimate.com/github/Codibre/nodejs-grpc-mutex-api/maintainability)

This is a simple distributed mutex implementation that uses only memory and the own nodejs event loop to work.

## How to use it

Get a Docker image from [Docker hub](https://hub.docker.com/repository/docker/codibre/nodejs-grpc-mutex-api/general) and create a grpc client using [proto/mutex.proto](./proto/mutex.proto). You can also use one of the clients already provided by us:

* [NodeJs client](https://www.npmjs.com/package/grpc-mutex-client);

You have two methods to use: **acquire**, which will try to lock a server side mutex and return a payload with an UUID to be used during its releasing.
The acquire method can also receive a **waitTimeout**, so you can define how long you want to wait for the acquiring before receiving a **DEADLINE EXCEEDED** error, and also a **mutexTimeout**, to define how long the mutex will endure server side without your explicit release, before expiring.

You also have the **release** method, where you need to inform the **acquire** response to release a server mutex. It's important to always call it after your operation to prevent long locks.

Finally, notice that this api is a memory only implementation, so it doesn't fit to be scaled horizontally: you need to have only one instance to process all your mutexes for a set of clients. To deal with that, you can have multiple instances, each one with a distinct set os clients, but have in mind that, even it doesn't support auto scaling yet, it's extremely low memory and can deal with a lot of simultaneous locks before dying. During our tests, we could create up to **230 thousands** simultaneous locks, with a average (local) response time of **0.64 ms**, using a instance with memory limitation of **468MB**. For comparison, running on the same machine using [redis-semaphore](https://www.npmjs.com/package/redis-semaphore), with a local redis, we achieved the same acquire time.

## License

Licensed under [MIT](https://en.wikipedia.org/wiki/MIT_License).
