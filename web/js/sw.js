"use strict";

const version = 7;

self.addEventListener("install", e => {
  console.log(`version is ${version}. ISNTALLING`);
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(async () => {
    await clients.claim();
    console.log(`version is ${version}. ACTIVATING`);
  });
});
self.addEventListener("message", onMessage);

main().catch(console.error);

async function main() {
  console.log(`version is ${version}. STARTING`);
  await sendMessage({ requestStatusUpdate: true });
}

async function sendMessage(message) {
  var allClients = await clients.matchAll({ includeUncontrolled: true });
  return Promise.all([
    allClients.map(client => {
      var channel = new MessageChannel();
      channel.port1.onmessage = onMessage;
      return client.postMessage(message, [channel.port2]);
    })
  ]);
}

function onMessage({ data }) {
  if ("statusUpdate" in data) {
    const { isOnline, isLoggedIn } = data.statusUpdate;

    console.log(
      `SERVIE WORKER ${version} STATUS UPDATE. isOnline:${isOnline}, isLoggedIn:${isLoggedIn}`
    );
  }
}
