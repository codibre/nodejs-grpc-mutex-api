const { join } = require('path');
const { ChannelCredentials, loadPackageDefinition } = require('@grpc/grpc-js');
const { loadSync } = require('@grpc/proto-loader');
const { main } = require('../../dist/main');
const {  waitForTimeout } = require( '../../dist/utils');
const {  promisify } = require('util');
const { getAverageStepper, interval } = require('@codibre/fluent-iterable');
const LOAD_DELAY = 1000;
const MAX_ACQUIRES = 3000000;
const DELAY_COUNT = 1000;


// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const MUTEX_TIMEOUT = 5 * 60 * 60 * 1000;
const MAX_DELAY = 10;
async function botaPraFude() {
  await main();
  const proto = loadSync(join(process.cwd(), '/proto/mutex.proto'));
  const definition = loadPackageDefinition(proto);
  const client = new definition.codibre.Mutex.MutexService(
    '127.0.0.1:3000',
    ChannelCredentials.createInsecure(),
  );
  await waitForTimeout(LOAD_DELAY);
  let count = 0;
  process.on('SIGTERM', () => {
    console.log('TOTAL ACQUIRES', count);
  });
  const acquire = promisify(client.acquire.bind(client));
  const stepper = getAverageStepper();
  await interval(0, MAX_ACQUIRES).map((i) => {
    const id = `id${i}`;
    const delay = Math.ceil(Math.random() * (MAX_DELAY - 1) + 1);
    // console.log('delay ', delay, ' id ', id);
    return { id, delay };
  }).map(async ({ id, delay }) => {
    await waitForTimeout(delay);
    const current = performance.now();
    await acquire({ id, mutexTimeout: MUTEX_TIMEOUT });
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
