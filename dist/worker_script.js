"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/utils/is-worker.ts
  var IS_WORKER = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;

  // src/utils/logger.ts
  var log = true ? IS_WORKER ? (...args) => console.log("[AMLL-Worker]", ...args) : console.log : noop;
  var warn = IS_WORKER ? (...args) => console.warn("[AMLL-Worker]", ...args) : console.warn;
  var error = IS_WORKER ? (...args) => console.error("[AMLL-Worker]", ...args) : console.error;

  // src/utils/global-events.ts
  var GLOBAL_EVENTS = new EventTarget();

  // src/utils/path.ts
  var SLASH = 47;
  var DOT = 46;
  var assertPath = (path) => {
    const t = typeof path;
    if (t !== "string") {
      throw new TypeError(`Expected a string, got a ${t}`);
    }
  };
  var posixNormalize = (path, allowAboveRoot) => {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for (let i = 0; i <= path.length; ++i) {
      if (i < path.length) {
        code = path.charCodeAt(i);
      } else if (code === SLASH) {
        break;
      } else {
        code = SLASH;
      }
      if (code === SLASH) {
        if (lastSlash === i - 1 || dots === 1) {
        } else if (lastSlash !== i - 1 && dots === 2) {
          if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== DOT || res.charCodeAt(res.length - 2) !== DOT) {
            if (res.length > 2) {
              const lastSlashIndex = res.lastIndexOf("/");
              if (lastSlashIndex !== res.length - 1) {
                if (lastSlashIndex === -1) {
                  res = "";
                  lastSegmentLength = 0;
                } else {
                  res = res.slice(0, lastSlashIndex);
                  lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                }
                lastSlash = i;
                dots = 0;
                continue;
              }
            } else if (res.length === 2 || res.length === 1) {
              res = "";
              lastSegmentLength = 0;
              lastSlash = i;
              dots = 0;
              continue;
            }
          }
          if (allowAboveRoot) {
            if (res.length > 0) {
              res += "/..";
            } else {
              res = "..";
            }
            lastSegmentLength = 2;
          }
        } else {
          if (res.length > 0) {
            res += `/${path.slice(lastSlash + 1, i)}`;
          } else {
            res = path.slice(lastSlash + 1, i);
          }
          lastSegmentLength = i - lastSlash - 1;
        }
        lastSlash = i;
        dots = 0;
      } else if (code === DOT && dots !== -1) {
        ++dots;
      } else {
        dots = -1;
      }
    }
    return res;
  };
  var decode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch (e) {
      return s;
    }
  };
  var normalizePath = (p) => {
    assertPath(p);
    let path = p.replaceAll("\\", "/");
    if (path.length === 0) {
      return ".";
    }
    const isAbsolute = path.charCodeAt(0) === SLASH;
    const trailingSeparator = path.charCodeAt(path.length - 1) === SLASH;
    path = decode(path);
    path = posixNormalize(path, !isAbsolute);
    if (path.length === 0 && !isAbsolute) {
      path = ".";
    }
    if (path.length > 0 && trailingSeparator) {
      path += "/";
    }
    if (isAbsolute) {
      return `/${path}`;
    }
    return path;
  };

  // src/utils/debounce.ts
  function debounce(callback, waitTime) {
    let timer = 0;
    return function debounceClosure() {
      const self2 = this;
      const args = arguments;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(callback.bind(self2, args), waitTime);
    };
  }

  // src/config/core.ts
  var GLOBAL_CONFIG = {};
  var getConfigPath = () => normalizePath(`${plugin.mainPlugin.pluginPath}/../../amll-data`);
  var getConfigFilePath = () => normalizePath(`${getConfigPath()}/amll-settings.json`);
  if (!IS_WORKER) {
    window.addEventListener("unload", forceSaveConfig);
  }
  async function forceSaveConfig() {
    if (IS_WORKER) {
      GLOBAL_EVENTS.dispatchEvent(new Event("config-saved"));
      return;
    }
    try {
      if (!await betterncm.fs.exists(getConfigPath())) {
        await betterncm.fs.mkdir(getConfigPath());
      }
      await betterncm.fs.writeFile(
        getConfigFilePath(),
        JSON.stringify(GLOBAL_CONFIG)
      );
      log("AMLL 插件配置保存成功");
    } catch (err) {
      warn("警告：AMLL 插件配置保存失败", err);
    }
    GLOBAL_EVENTS.dispatchEvent(new Event("config-saved"));
  }
  var saveConfig = debounce(forceSaveConfig, 500);
  function setConfig(key, value) {
    if (!IS_WORKER)
      setConfigFromMain({ [key]: value });
    if (value === void 0) {
      delete GLOBAL_CONFIG[key];
    } else {
      GLOBAL_CONFIG[key] = value;
    }
    saveConfig();
  }

  // src/utils/gen-random-string.ts
  function genRandomString(length) {
    const words = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(words.charAt(Math.floor(Math.random() * words.length)));
    }
    return result.join("");
  }

  // src/libs/color-quantize/p-queue.ts
  var PQueue = class extends Array {
    constructor(_comparator = (a, b) => Number(a) - Number(b)) {
      super();
      this._comparator = _comparator;
      __publicField(this, "_sorted", false);
      __publicField(this, "sort", (comparator) => {
        this._comparator = comparator ? comparator : this._comparator;
        this._sorted = true;
        return super.sort(this._comparator);
      });
      __publicField(this, "push", (o) => {
        this._sorted = false;
        return super.push(o);
      });
      __publicField(this, "pop", () => {
        if (!this._sorted)
          this.sort();
        return super.pop();
      });
      /**
       * 获取下标元素(默认获取最后一位元素)
       * @param index
       * @returns
       */
      __publicField(this, "peek", (index) => {
        if (!this._sorted)
          this.sort();
        if (index === void 0)
          index = this.length - 1;
        return this[index];
      });
      __publicField(this, "size", () => {
        return this.length;
      });
      __publicField(this, "debug", () => {
        if (!this._sorted)
          this.sort();
        return this;
      });
    }
  };

  // src/libs/color-quantize/v-box.ts
  var VBox = class {
    constructor(r1, r2, g1, g2, b1, b2, histo) {
      this.r1 = r1;
      this.r2 = r2;
      this.g1 = g1;
      this.g2 = g2;
      this.b1 = b1;
      this.b2 = b2;
      this.histo = histo;
      __publicField(this, "_count", -1);
      __publicField(this, "_volume", 0);
      __publicField(this, "_avg", [0, 0, 0]);
      /**
       * 色彩空间体积（即 r,g,b 三维长方体体积）
       * @param force 强制重算
       * @returns
       */
      __publicField(this, "volume", (force) => {
        if (this._volume && !force) {
          return this._volume;
        }
        this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
        return this._volume;
      });
      /**
       * 获取 vbox 内的总像素数
       * @param force 强制重算
       * @returns
       */
      __publicField(this, "count", (force) => {
        if (this._count > -1 && !force) {
          return this._count;
        }
        let count = 0;
        let i;
        let j;
        let k;
        let index;
        for (i = this.r1; i <= this.r2; i++) {
          for (j = this.g1; j <= this.g2; j++) {
            for (k = this.b1; k <= this.b2; k++) {
              index = getColorIndex(i, j, k);
              count += this.histo[index] || 0;
            }
          }
        }
        this._count = count;
        return this._count;
      });
      __publicField(this, "copy", () => {
        return new VBox(
          this.r1,
          this.r2,
          this.g1,
          this.g2,
          this.b1,
          this.b2,
          this.histo
        );
      });
      /**
       * 色彩空间平均颜色
       * @param force
       * @returns
       */
      __publicField(this, "avg", (force) => {
        if (this._avg.length && force) {
          return this._avg;
        }
        let ntot = 0;
        let mult = 1 << rshift;
        let rsum = 0;
        let gsum = 0;
        let bsum = 0;
        let hval;
        let i;
        let j;
        let k;
        let histoindex;
        for (i = this.r1; i <= this.r2; i++) {
          for (j = this.g1; j <= this.g2; j++) {
            for (k = this.b1; k <= this.b2; k++) {
              histoindex = getColorIndex(i, j, k);
              hval = this.histo[histoindex] || 0;
              ntot += hval;
              rsum += hval * (i + 0.5) * mult;
              gsum += hval * (j + 0.5) * mult;
              bsum += hval * (k + 0.5) * mult;
            }
          }
        }
        if (ntot) {
          this._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
        } else {
          this._avg = [
            ~~(mult * (this.r1 + this.r2 + 1) / 2),
            ~~(mult * (this.g1 + this.g2 + 1) / 2),
            ~~(mult * (this.b1 + this.b2 + 1) / 2)
          ];
        }
        return this._avg;
      });
      /**
       * 像素是否在vbox色彩空间内
       * @param pixel
       * @returns
       */
      __publicField(this, "contains", (pixel) => {
        const [rval, gval, bval] = pixel.map((num) => num >> rshift);
        return rval >= this.r1 && rval <= this.r2 && gval >= this.g1 && gval <= this.g2 && bval >= this.b1 && bval <= this.b2;
      });
    }
  };

  // src/libs/color-quantize/utils.ts
  var sigbits = 5;
  var rshift = 8 - sigbits;
  var maxIterations = 1e3;
  var fractByPopulations = 0.75;
  var pv = {
    naturalOrder: (a, b) => {
      return a < b ? -1 : a > b ? 1 : 0;
    },
    sum: (array, f) => {
      return array.reduce((p, t) => {
        return p + (f ? f.call(array, t) : Number(t));
      }, 0);
    },
    max: (array, f) => {
      return Math.max.apply(null, f ? array.map(f) : array.map((d) => Number(d)));
    },
    size: (array) => {
      return array.reduce((p, t) => t ? p + 1 : p, 0);
    }
  };
  var getColorIndex = (r, g, b) => {
    return (r << 2 * sigbits) + (g << sigbits) + b;
  };
  var getHistoAndVBox = (pixels) => {
    let histo = new Array(1 << 3 * sigbits);
    let index;
    let rmin = Infinity;
    let rmax = 0;
    let gmin = Infinity;
    let gmax = 0;
    let bmin = Infinity;
    let bmax = 0;
    let rval;
    let gval;
    let bval;
    pixels.forEach(function(pixel) {
      [rval, gval, bval] = pixel.map((num) => num >> rshift);
      index = getColorIndex(rval, gval, bval);
      histo[index] = (histo[index] || 0) + 1;
      if (rval < rmin)
        rmin = rval;
      else if (rval > rmax)
        rmax = rval;
      if (gval < gmin)
        gmin = gval;
      else if (gval > gmax)
        gmax = gval;
      if (bval < bmin)
        bmin = bval;
      else if (bval > bmax)
        bmax = bval;
    });
    return {
      vbox: new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo),
      histo
    };
  };
  var medianCutApply = (histo, vbox) => {
    if (!vbox.count())
      return [];
    if (vbox.count() === 1) {
      return [vbox.copy()];
    }
    const rw = vbox.r2 - vbox.r1 + 1;
    const gw = vbox.g2 - vbox.g1 + 1;
    const bw = vbox.b2 - vbox.b1 + 1;
    const maxw = pv.max([rw, gw, bw]);
    const partialsum = [];
    let total = 0;
    let i;
    let j;
    let k;
    let sum;
    let index;
    if (maxw === rw) {
      for (i = vbox.r1; i <= vbox.r2; i++) {
        sum = 0;
        for (j = vbox.g1; j <= vbox.g2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(i, j, k);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    } else if (maxw === gw) {
      for (i = vbox.g1; i <= vbox.g2; i++) {
        sum = 0;
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(j, i, k);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    } else {
      for (i = vbox.b1; i <= vbox.b2; i++) {
        sum = 0;
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.g1; k <= vbox.g2; k++) {
            index = getColorIndex(j, k, i);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    }
    const doCut = (color) => {
      const dim1 = `${color}1`;
      const dim2 = `${color}2`;
      let left;
      let right;
      let vbox1;
      let vbox2;
      let cutIndex;
      for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
        if (partialsum[i] >= total / 2) {
          break;
        }
      }
      vbox1 = vbox.copy();
      vbox2 = vbox.copy();
      left = i - vbox[dim1];
      right = vbox[dim2] - i;
      cutIndex = left <= right ? Math.min(vbox[dim2] - 1, ~~(i + right / 2)) : Math.max(vbox[dim1], ~~(i - 1 - left / 2));
      while (!partialsum[cutIndex] && cutIndex <= vbox[dim2])
        cutIndex++;
      vbox1[dim2] = cutIndex;
      vbox2[dim1] = cutIndex + 1;
      return [vbox1, vbox2];
    };
    return maxw === rw ? doCut("r") : maxw === gw ? doCut("g") : doCut("b");
  };

  // src/libs/color-quantize/c-map.ts
  var _CMap = class {
    constructor() {
      /**
       * 色彩空间队列，以 CMap._compare 排序
       */
      __publicField(this, "vboxes");
      __publicField(this, "push", (vbox) => {
        this.vboxes.push({
          vbox,
          color: vbox.avg()
          // 根据色彩空间平均色取 近似色
        });
      });
      /**
       * 获取所有色彩空间颜色
       * @returns
       */
      __publicField(this, "palette", () => {
        return this.vboxes.map((vb) => vb.color);
      });
      /**
       * 色彩空间size
       * @returns
       */
      __publicField(this, "size", () => {
        return this.vboxes.size();
      });
      /**
       * 匹配当前色彩空间近似值
       * @param color
       * @returns
       */
      __publicField(this, "map", (color) => {
        for (let i = 0; i < this.vboxes.size(); i++) {
          if (this.vboxes.peek(i).vbox.contains(color)) {
            return this.vboxes.peek(i).color;
          }
        }
        return this.nearest(color);
      });
      /**
       * 获取当前颜色近似值
       * @param color
       * @returns
       */
      __publicField(this, "nearest", (color) => {
        let i;
        let d1;
        let d2;
        let pColor;
        for (i = 0; i < this.vboxes.size(); i++) {
          d2 = Math.sqrt(
            Math.pow(color[0] - this.vboxes.peek(i).color[0], 2) + Math.pow(color[1] - this.vboxes.peek(i).color[1], 2) + Math.pow(color[2] - this.vboxes.peek(i).color[2], 2)
          );
          if (d1 === void 0 || d2 < d1) {
            d1 = d2;
            pColor = this.vboxes.peek(i).color;
          }
        }
        return pColor;
      });
      /**
       * 当色彩空间接近极值时，直接取纯黑白色
       */
      __publicField(this, "forcebw", () => {
        this.vboxes.sort((a, b) => {
          return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
        });
        const lowest = this.vboxes[0].color;
        if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
          this.vboxes[0].color = [0, 0, 0];
        const idx = this.vboxes.length - 1;
        const highest = this.vboxes[idx].color;
        if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
          this.vboxes[idx].color = [255, 255, 255];
        this.vboxes.sort(_CMap._compare);
      });
      this.vboxes = new PQueue(_CMap._compare);
    }
  };
  var CMap = _CMap;
  /**
   * 色彩空间 默认比较函数
   */
  __publicField(CMap, "_compare", (a, b) => {
    return pv.naturalOrder(
      a.vbox.count() * a.vbox.volume(),
      b.vbox.count() * b.vbox.volume()
    );
  });

  // src/libs/color-quantize/quantize.ts
  var quantize = (pixels, maxcolors) => {
    if (!pixels.length || maxcolors < 1 || maxcolors > 256) {
      return new CMap();
    }
    const { histo, vbox } = getHistoAndVBox(pixels);
    const pq = new PQueue((a, b) => {
      return pv.naturalOrder(a.count(), b.count());
    });
    pq.push(vbox);
    const iter = (vboxQueue, target) => {
      let vboxSize = vboxQueue.size();
      let tempIterations = 0;
      let vbox2;
      while (tempIterations < maxIterations) {
        if (vboxSize >= target)
          return;
        if (tempIterations++ > maxIterations)
          return;
        if (!vboxQueue.peek().count())
          return;
        vbox2 = vboxQueue.pop();
        const [vbox1, vbox22] = medianCutApply(histo, vbox2);
        if (!vbox1) {
          return;
        }
        vboxQueue.push(vbox1);
        if (vbox22) {
          vboxQueue.push(vbox22);
          vboxSize++;
        }
      }
    };
    iter(pq, fractByPopulations * maxcolors);
    pq.sort((a, b) => {
      return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
    });
    iter(pq, maxcolors);
    const cmap = new CMap();
    while (pq.size()) {
      cmap.push(pq.pop());
    }
    return cmap;
  };

  // src/worker/index.ts
  var worker;
  var definedFunctions = {};
  var callbacks = /* @__PURE__ */ new Map();
  function defineWorkerFunction(funcName, funcBody, transferArgIndexes = []) {
    definedFunctions[funcName] = {
      funcName,
      funcBody
    };
    let callId = 0;
    return (...args) => {
      if (worker) {
        return new Promise((resolve, reject) => {
          const id = `${genRandomString(4)} - ${funcName} - ${callId++}`;
          callbacks.set(id, [resolve, reject]);
          worker.postMessage(
            {
              id,
              funcName,
              args
            },
            transferArgIndexes.map((i) => args[i]).filter((v) => !!v)
          );
        });
      } else {
        if (!APP_CONF.isOSX)
          warn("AMLL Worker 尚未运行，正在本地线程执行函数", funcName, args);
        try {
          const result = funcBody(...args);
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  }
  var grabImageColors = defineWorkerFunction(
    "grabImageColors",
    (img, maxColors = 16) => {
      let canvas;
      let ctx;
      if (IS_WORKER || !APP_CONF.isOSX) {
        canvas = new OffscreenCanvas(img.width, img.height);
        ctx = canvas.getContext("2d");
      } else {
        canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx = canvas.getContext("2d");
      }
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = [];
        for (let i = 0; i < data.width * data.height; i++) {
          pixels.push([
            data.data[i * 4],
            data.data[i * 4 + 1],
            data.data[i * 4 + 2]
          ]);
        }
        const result = quantize(pixels, maxColors);
        const colors = [];
        result.palette().forEach((color) => colors.push(color));
        return colors;
      } else {
        return [];
      }
    }
  );
  var calcImageAverageColor = defineWorkerFunction(
    "calcImageAverageColor",
    (img) => {
      let canvas;
      let ctx;
      if (IS_WORKER || !APP_CONF.isOSX) {
        canvas = new OffscreenCanvas(img.width, img.height);
        ctx = canvas.getContext("2d");
      } else {
        canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx = canvas.getContext("2d");
      }
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const avgColor = [0, 0, 0];
        for (let i = 0; i < data.width * data.height; i++) {
          avgColor[0] += data.data[i * 4];
          avgColor[1] += data.data[i * 4 + 1];
          avgColor[2] += data.data[i * 4 + 2];
        }
        avgColor[0] /= data.width * data.height;
        avgColor[1] /= data.width * data.height;
        avgColor[2] /= data.width * data.height;
        return avgColor;
      } else {
        return [0, 0, 0];
      }
    }
  );
  var setConfigFromMain = defineWorkerFunction(
    "setConfigFromMain",
    (config) => {
      if (IS_WORKER) {
        for (const key in config) {
          setConfig(key, config[key]);
        }
        log("已从主线程同步配置", ...Object.keys(config));
      }
    }
  );

  // src/worker_script.ts
  onmessage = async (evt) => {
    try {
      log("正在执行后台任务", evt.data.id, evt.data.funcName, evt.data.args);
      const ret = definedFunctions[evt.data.funcName].funcBody(...evt.data.args);
      const result = await ret;
      postMessage({
        id: evt.data.id,
        result
      });
    } catch (err) {
      error(
        "后台任务发生错误",
        evt.data.id,
        evt.data.funcName,
        evt.data.args,
        err
      );
      postMessage({
        id: evt.data.id,
        result: void 0,
        error: err
      });
    }
  };
  log("AMLL 后台线程正在运行！");
})();
