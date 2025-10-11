import {createMergeableStore} from 'tinybase';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
import {createWsServerSimple} from 'tinybase/synchronizers/synchronizer-ws-server-simple';
import {beforeEach, expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {getTimeFunctions} from '../common/mergeable.ts';

const [reset, getNow, pause] = getTimeFunctions();

beforeEach(() => {
  reset();
});

test('Basics', async () => {
  const wsServerSimple = createWsServerSimple(
    new WebSocketServer({port: 8054}),
  );

  const s1 = createMergeableStore('s1', getNow);
  const synchronizer1 = await createWsSynchronizer(
    s1,
    new WebSocket('ws://localhost:8054'),
  );
  await synchronizer1.startSync();
  s1.setCell('t1', 'r1', 'c1', 4);

  const s2 = createMergeableStore('s2', getNow);
  const synchronizer2 = await createWsSynchronizer(
    s2,
    new WebSocket('ws://localhost:8054'),
  );
  await synchronizer2.startSync();
  s2.setCell('t1', 'r2', 'price', 5);

  await pause();

  expect(s1.getTables()).toEqual({
    t1: {r2: {price: 5}, r1: {c1: 4}},
  });
  expect(s2.getTables()).toEqual({
    t1: {r2: {price: 5}, r1: {c1: 4}},
  });

  await synchronizer1.destroy();
  await synchronizer2.destroy();
  await wsServerSimple.destroy();
});

test('Accessors', async () => {
  const wssServer = new WebSocketServer({port: 8054});
  const wsServerSimple = createWsServerSimple(wssServer);
  expect(wsServerSimple.getWebSocketServer()).toEqual(wssServer);
  await wsServerSimple.destroy();
});
