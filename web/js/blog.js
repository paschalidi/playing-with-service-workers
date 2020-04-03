(function Blog() {
  "use strict";

  var offlineIcon;
  var isOnline = "onLine" in navigator ? navigator.onLine : true;
  var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");

  var usingServiceWorker = "serviceWorker" in navigator;
  var serviceWorkerRegistration;
  var serviceWorker;
  document.addEventListener("DOMContentLoaded", ready, false);

  initServiceWorker().catch(console.error);

  function ready() {
    offlineIcon = document.getElementById("connectivity-status");

    if (!isOnline) {
      offlineIcon.classList.remove("hidden");
    }
    window.addEventListener("online", () => {
      offlineIcon.classList.add("hidden");
      isOnline = true;
      sendStatusUpdate();
    });
    window.addEventListener("offline", () => {
      offlineIcon.classList.remove("hidden");
      isOnline = false;
      sendStatusUpdate();
    });
  }

  async function initServiceWorker() {
    serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/sw.js",
      {
        updateViaCache: "none"
      }
    );
    serviceWorker =
      serviceWorkerRegistration.installing ||
      serviceWorkerRegistration.waiting ||
      serviceWorkerRegistration.active;

    sendStatusUpdate(serviceWorker);

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      serviceWorker = navigator.serviceWorker.controller;
      sendStatusUpdate(serviceWorker);
    });

    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
  }

  function onServiceWorkerMessage(e) {
    const { data, ports } = e;

    if ("requestStatusUpdate" in data) {
      console.log("@@NEW STATUS UPDATE FROM SW");
      sendStatusUpdate(ports && ports[0]);
    }
  }

  function sendStatusUpdate(target) {
    sendServiceWorkerMessage(
      { statusUpdate: { isOnline, isLoggedIn } },
      target
    );
  }

  function sendServiceWorkerMessage(message, target) {
    if (target) {
      target.postMessage(message);
    } else if (serviceWorker) {
      serviceWorker.postMessage(message);
    } else {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }
})();
