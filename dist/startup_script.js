"use strict";
(() => {
  // src/utils/is-worker.ts
  var IS_WORKER = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;

  // src/utils/logger.ts
  var log = true ? IS_WORKER ? (...args) => console.log("[AMLL-Worker]", ...args) : console.log : noop;

  // src/startup_script.ts
  var hookCall = channel.call;
  var hookRegisterCall = channel.registerCall;
  channel.call = function AppleMusicLikeLyricCallHook(cmd, ...args) {
    if (cmd === "storage.downloadscanner") {
      log(cmd, ...args, new Error().stack);
    } else {
      return hookCall.apply(hookCall, [cmd, ...args]);
    }
  };
  channel.registerCall = function AppleMusicLikeLyricRegisterCallHook(cmd, callback) {
    log(cmd, [callback]);
    return hookRegisterCall.apply(hookRegisterCall, [cmd, callback]);
  };
})();
