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
async function botaPraFude() {
  await main();
  const proto = loadSync(join(process.cwd(), '/proto/mutex.proto'));
  const definition = loadPackageDefinition(proto);
  const client = new definition.codibre.Mutex.MutexService(
    '0.0.0.0:3000',
    ChannelCredentials.createInsecure(),
  );
  await waitForTimeout(LOAD_DELAY);
  let count = 0;
  process.on('SIGTERM', () => {
    console.log('TOTAL ACQUIRES', count);
  });
  const acquire = promisify(client.acquire.bind(client));
  const stepper = getAverageStepper();
  await interval(0, MAX_ACQUIRES).map(async (i) => {
    const current = performance.now();
    await acquire({ id: `id${i}`, mutexTimeout: MUTEX_TIMEOUT });
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
