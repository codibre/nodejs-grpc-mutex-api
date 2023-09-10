const {  waitForTimeout } = require( '../../dist/utils');
const { getAverageStepper, interval } = require('@codibre/fluent-iterable');
const { Mutex } = require('redis-semaphore');
const IORedis = require('ioredis');
const LOAD_DELAY = 1000;
const MAX_ACQUIRES = 3000000;
const DELAY_COUNT = 1000;


async function botaPraFude() {
  await waitForTimeout(LOAD_DELAY);
  let count = 0;
  process.on('SIGTERM', () => {
    console.log('TOTAL ACQUIRES', count);
  });
  const redis = new IORedis('localhost');
  const stepper = getAverageStepper();
  await interval(0, MAX_ACQUIRES).map(async (i) => {
    const current = performance.now();
    const mutex = new Mutex(redis, `id${i}`, {
      acquireTimeout: 15000,
      lockTimeout: 300000,
      onLockLost: () => undefined,
    });
    await mutex.acquire();
    stepper.step(performance.now() - current);
    count++;
  })
  .partition(DELAY_COUNT)
  .mapAsync(Promise.all.bind(Promise))
  .execute(() => console.log(count, 'so far with avg performance ', stepper.avg))
  .execute(() => waitForTimeout(1))
  .last();
}

void botaPraFude();
