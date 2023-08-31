import { Container as C } from "@pixi/display";
import { Application as M } from "@pixi/app";
import { BlurFilter as y } from "@pixi/filter-blur";
import { ColorMatrixFilter as E } from "@pixi/filter-color-matrix";
import { Texture as z } from "@pixi/core";
import { Sprite as w } from "@pixi/sprite";
import { create as D } from "jss";
import A from "jss-preset-default";
const I = /^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function T(h) {
  const e = I.exec(h);
  if (e) {
    const t = Number(e.groups?.hour || "0"), n = Number(e.groups?.min || "0"), i = Number(e.groups?.sec.replace(/:/, ".") || "0");
    return Math.floor((t * 3600 + n * 60 + i) * 1e3);
  } else
    throw new TypeError("时间戳字符串解析失败");
}
function B(h) {
  const t = new DOMParser().parseFromString(
    h,
    "application/xml"
  );
  let n = "v1";
  for (const l of t.querySelectorAll("ttm\\:agent"))
    if (l.getAttribute("type") === "person") {
      const s = l.getAttribute("xml:id");
      s && (n = s);
    }
  const i = [];
  for (const l of t.querySelectorAll("body p[begin][end]")) {
    const s = {
      words: [],
      startTime: T(l.getAttribute("begin") ?? "0:0"),
      endTime: T(l.getAttribute("end") ?? "0:0"),
      translatedLyric: "",
      romanLyric: "",
      isBG: !1,
      isDuet: l.getAttribute("ttm:agent") !== n
    };
    let r = null;
    for (const a of l.childNodes)
      if (a.nodeType === Node.TEXT_NODE) {
        const o = a.textContent ?? "";
        /^(\s+)$/.test(o) ? s.words.push({
          word: " ",
          startTime: 0,
          endTime: 0
        }) : s.words.push({
          word: o,
          startTime: 0,
          endTime: 0
        });
      } else if (a.nodeType === Node.ELEMENT_NODE) {
        const o = a, c = o.getAttribute("ttm:role");
        if (o.nodeName === "span" && c)
          if (c === "x-bg") {
            const d = {
              words: [],
              startTime: s.startTime,
              endTime: s.endTime,
              translatedLyric: "",
              romanLyric: "",
              isBG: !0,
              isDuet: s.isDuet
            };
            for (const m of o.childNodes)
              if (m.nodeType === Node.TEXT_NODE) {
                const p = m.textContent ?? "";
                /^(\s+)$/.test(p) ? d.words.push({
                  word: " ",
                  startTime: 0,
                  endTime: 0
                }) : d.words.push({
                  word: p,
                  startTime: 0,
                  endTime: 0
                });
              } else if (m.nodeType === Node.ELEMENT_NODE) {
                const p = m, L = p.getAttribute("ttm:role");
                if (p.nodeName === "span" && L)
                  L === "x-translation" ? d.translatedLyric = p.innerHTML.trim() : L === "x-roman" && (d.romanLyric = p.innerHTML.trim());
                else if (p.hasAttribute("begin") && p.hasAttribute("end")) {
                  const b = {
                    word: m.textContent,
                    startTime: T(p.getAttribute("begin")),
                    endTime: T(p.getAttribute("end"))
                  };
                  d.words.push(b);
                }
              }
            const u = d.words[0];
            d.startTime = u.startTime, u?.word.startsWith("(") && (u.word = u.word.substring(1));
            const f = d.words[d.words.length - 1];
            d.endTime = f.endTime, f?.word.endsWith(")") && (f.word = f.word.substring(
              0,
              f.word.length - 1
            )), r = d;
          } else
            c === "x-translation" ? s.translatedLyric = o.innerHTML : c === "x-roman" && (s.romanLyric = o.innerHTML);
        else if (o.hasAttribute("begin") && o.hasAttribute("end")) {
          const d = {
            word: a.textContent ?? "",
            startTime: T(o.getAttribute("begin")),
            endTime: T(o.getAttribute("end"))
          };
          s.words.push(d);
        }
      }
    i.push(s), r && i.push(r);
  }
  return i;
}
const ee = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseTTML: B
}, Symbol.toStringTag, { value: "Module" }));
class k extends C {
  time = 0;
}
class N {
  constructor(e) {
    this.canvas = e;
    const t = e.getBoundingClientRect();
    this.canvas.width = t.width * this.currerntRenderScale, this.canvas.height = t.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const n = e.getBoundingClientRect();
      this.canvas.width = Math.max(1, n.width), this.canvas.height = Math.max(1, n.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.app.ticker.start(), this.rebuildFilters();
    }), this.observer.observe(e), this.app = new M({
      view: e,
      resizeTo: this.canvas,
      powerPreference: "low-power",
      backgroundAlpha: 0
    }), this.rebuildFilters(), this.app.ticker.add(this.onTick), this.app.ticker.start();
  }
  observer;
  app;
  curContainer;
  staticMode = !1;
  lastContainer = /* @__PURE__ */ new Set();
  onTick = (e) => {
    for (const t of this.lastContainer)
      t.alpha = Math.max(0, t.alpha - e / 60), t.alpha <= 0 && (this.app.stage.removeChild(t), this.lastContainer.delete(t));
    if (this.curContainer) {
      this.curContainer.alpha = Math.min(
        1,
        this.curContainer.alpha + e / 60
      );
      const [t, n, i, l] = this.curContainer.children, s = Math.max(this.app.screen.width, this.app.screen.height);
      t.position.set(this.app.screen.width / 2, this.app.screen.height / 2), n.position.set(
        this.app.screen.width / 2.5,
        this.app.screen.height / 2.5
      ), i.position.set(this.app.screen.width / 2, this.app.screen.height / 2), l.position.set(this.app.screen.width / 2, this.app.screen.height / 2), t.width = s * Math.sqrt(2), t.height = t.width, n.width = s * 0.8, n.height = n.width, i.width = s * 0.5, i.height = i.width, l.width = s * 0.25, l.height = l.width, this.curContainer.time += e * this.flowSpeed, t.rotation += e / 1e3 * this.flowSpeed, n.rotation -= e / 500 * this.flowSpeed, i.rotation += e / 1e3 * this.flowSpeed, l.rotation -= e / 750 * this.flowSpeed, i.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), i.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), l.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), l.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), this.curContainer.alpha >= 1 && this.lastContainer.size === 0 && this.staticMode && this.app.ticker.stop();
    }
  };
  flowSpeed = 2;
  currerntRenderScale = 0.75;
  /**
   * 修改背景的流动速度，数字越大越快，默认为 2
   * @param speed 背景的流动速度，默认为 2
   */
  setFlowSpeed(e) {
    this.flowSpeed = e;
  }
  /**
   * 修改背景的渲染比例，默认是 0.5
   *
   * 一般情况下这个程度既没有明显瑕疵也不会特别吃性能
   * @param scale 背景的渲染比例
   */
  setRenderScale(e) {
    this.currerntRenderScale = e;
    const t = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, t.width), this.canvas.height = Math.max(1, t.height), this.app.renderer.resize(
      this.canvas.width * this.currerntRenderScale,
      this.canvas.height * this.currerntRenderScale
    ), this.rebuildFilters();
  }
  rebuildFilters() {
    const e = Math.min(this.canvas.width, this.canvas.height), t = new E();
    t.saturate(1.2, !1);
    const n = new E();
    n.brightness(0.6, !1);
    const i = new E();
    i.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new y(5, 1)), this.app.stage.filters.push(new y(10, 1)), this.app.stage.filters.push(new y(20, 2)), this.app.stage.filters.push(new y(40, 2)), e > 512 && this.app.stage.filters.push(new y(80, 2)), e > 768 && this.app.stage.filters.push(new y(160, 4)), e > 768 * 2 && this.app.stage.filters.push(new y(320, 4)), this.app.stage.filters.push(t, n, i), this.app.stage.filters.push(new y(5, 1));
  }
  /**
   * 是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能
   * @param enable 是否启用静态模式
   */
  setStaticMode(e = !1) {
    this.staticMode = e, this.app.ticker.start();
  }
  /**
   * 修改背景动画帧率，默认是 30 FPS
   *
   * 如果设置成 0 则会停止动画
   * @param fps 目标帧率，默认 30 FPS
   */
  setFPS(e) {
    this.app.ticker.maxFPS = e;
  }
  /**
   * 暂停背景动画，画面即便是更新了图片也不会发生变化
   */
  pause() {
    this.app.ticker.stop(), this.app.render();
  }
  /**
   * 恢复播放背景动画
   */
  resume() {
    this.app.ticker.start();
  }
  /**
   * 设置背景专辑图片，图片材质加载并设置完成后会返回
   * @param albumUrl 图片的目标链接
   */
  async setAlbumImage(e) {
    const t = await z.fromURL(e), n = new k(), i = new w(t), l = new w(t), s = new w(t), r = new w(t);
    i.anchor.set(0.5, 0.5), l.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), r.anchor.set(0.5, 0.5), i.rotation = Math.random() * Math.PI * 2, l.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, r.rotation = Math.random() * Math.PI * 2, n.addChild(i, l, s, r), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = n, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0, this.app.ticker.start();
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class te extends N {
  element;
  constructor() {
    const e = document.createElement("canvas");
    super(e), this.element = e, e.style.pointerEvents = "none", e.style.zIndex = "-1";
  }
  getElement() {
    return this.element;
  }
  dispose() {
    super.dispose(), this.element.remove();
  }
}
const O = (h, e) => h.size === e.size && [...h].every((t) => e.has(t));
class S {
  currentPosition = 0;
  targetPosition = 0;
  currentTime = 0;
  params = {};
  currentSolver;
  getV;
  queueParams;
  queuePosition;
  constructor(e = 0) {
    this.targetPosition = e, this.currentPosition = this.targetPosition, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  resetSolver() {
    const e = this.getV(this.currentTime);
    this.currentTime = 0, this.currentSolver = $(
      this.currentPosition,
      e,
      this.targetPosition,
      0,
      this.params
    ), this.getV = q(this.currentSolver);
  }
  arrived() {
    return Math.abs(this.targetPosition - this.currentPosition) < 0.01 && this.getV(this.currentTime) < 0.01 && this.queueParams === void 0 && this.queuePosition === void 0;
  }
  setPosition(e) {
    this.targetPosition = e, this.currentPosition = e, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  update(e = 0) {
    this.currentTime += e, this.currentPosition = this.currentSolver(this.currentTime), this.queueParams && (this.queueParams.time -= e, this.queueParams.time <= 0 && this.updateParams({
      ...this.queueParams
    })), this.queuePosition && (this.queuePosition.time -= e, this.queuePosition.time <= 0 && this.setTargetPosition(this.queuePosition.position)), this.arrived() && this.setPosition(this.targetPosition);
  }
  updateParams(e, t = 0) {
    t > 0 ? this.queueParams = {
      ...e,
      time: t
    } : (this.params = {
      ...this.params,
      ...e
    }, this.resetSolver());
  }
  setTargetPosition(e, t = 0) {
    t > 0 ? this.queuePosition = {
      position: e,
      time: t
    } : (this.queuePosition = void 0, this.targetPosition = e, this.resetSolver());
  }
  getCurrentPosition() {
    return this.currentPosition;
  }
}
function $(h, e, t, n = 0, i) {
  const l = i?.soft ?? !1, s = i?.stiffness ?? 100, r = i?.damping ?? 10, a = i?.mass ?? 1, o = t - h;
  if (l || 1 <= r / (2 * Math.sqrt(s * a))) {
    const c = -Math.sqrt(s / a), d = -c * o - e;
    return (u) => (u -= n, u < 0 ? h : t - (o + u * d) * Math.E ** (u * c));
  } else {
    const c = Math.sqrt(
      4 * a * s - r ** 2
    ), d = (r * o - 2 * a * e) / c, u = 0.5 * c / a, f = -(0.5 * r) / a;
    return (m) => (m -= n, m < 0 ? h : t - (Math.cos(m * u) * o + Math.sin(m * u) * d) * Math.E ** (m * f));
  }
}
function _(h) {
  return (t) => (h(t + 1e-3) - h(t - 1e-3)) / (2 * 1e-3);
}
function q(h) {
  return _(h);
}
class F {
  constructor(e) {
    this.lyricPlayer = e, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.rebuildStyle();
  }
  element = document.createElement("div");
  left = 0;
  top = 0;
  delay = 0;
  // 由 LyricPlayer 来设置
  lineSize = [0, 0];
  lineTransforms = {
    posX: new S(0),
    posY: new S(0)
  };
  measureSize() {
    return [
      this.element.clientWidth,
      this.element.clientHeight
    ];
  }
  lastStyle = "";
  show() {
    this.rebuildStyle();
  }
  hide() {
    this.rebuildStyle();
  }
  rebuildStyle() {
    let e = `transform:translate(${this.lineTransforms.posX.getCurrentPosition()}px,${this.lineTransforms.posY.getCurrentPosition()}px);`;
    !this.lyricPlayer.getEnableSpring() && this.isInSight && (e += `transition-delay:${this.delay}ms;`), e !== this.lastStyle && (this.lastStyle = e, this.element.setAttribute("style", e));
  }
  getElement() {
    return this.element;
  }
  setTransform(e = this.left, t = this.top, n = !1, i = 0) {
    this.left = e, this.top = t, this.delay = i * 1e3 | 0, n || !this.lyricPlayer.getEnableSpring() ? (n && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), n && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, i), this.lineTransforms.posY.setTargetPosition(t, i));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), n = e + this.lineSize[0], i = t + this.lineSize[1], l = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], r = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], a = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > r || t > a || n < l || i < s);
  }
  dispose() {
    this.element.remove();
  }
}
function X(h) {
  const t = 2.5949095;
  return h < 0.5 ? Math.pow(2 * h, 2) * ((t + 1) * 2 * h - t) / 2 : (Math.pow(2 * h - 2, 2) * ((t + 1) * (h * 2 - 2) + t) + 2) / 2;
}
const g = (h, e, t) => Math.max(h, Math.min(e, t));
class R {
  constructor(e) {
    this.lyricPlayer = e, this.element.className = this.lyricPlayer.style.classes.interludeDots, this.element.appendChild(this.dot0), this.element.appendChild(this.dot1), this.element.appendChild(this.dot2);
  }
  element = document.createElement("div");
  dot0 = document.createElement("span");
  dot1 = document.createElement("span");
  dot2 = document.createElement("span");
  left = 0;
  top = 0;
  scale = 1;
  lastStyle = "";
  currentInterlude;
  currentTime = 0;
  targetBreatheDuration = 1500;
  getElement() {
    return this.element;
  }
  setTransform(e = this.left, t = this.top) {
    this.left = e, this.top = t, this.update();
  }
  setInterlude(e) {
    this.currentInterlude = e, this.currentTime = e?.[0] ?? 0;
  }
  update(e = 0) {
    this.currentTime += e;
    let t = "";
    if (t += `transform:translate(${this.left}px, ${this.top}px)`, this.currentInterlude) {
      const n = this.currentInterlude[1] - this.currentInterlude[0], i = this.currentTime - this.currentInterlude[0];
      if (i <= n) {
        const l = n / Math.ceil(n / this.targetBreatheDuration);
        let s = 1, r = 1;
        s *= Math.sin(1.5 * Math.PI - i / l * 2) / 10 + 1, i < 1e3 && (s *= 1 - Math.pow((1e3 - i) / 1e3, 2)), i < 500 ? r = 0 : i < 1e3 && (r *= (i - 500) / 500), n - i < 750 && (s *= 1 - X(
          (750 - (n - i)) / 750 / 2
        )), n - i < 375 && (r *= g(
          0,
          (n - i) / 375,
          1
        )), s = Math.max(0, s), t += ` scale(${s})`;
        const a = g(
          0.25,
          i * 3 / n * 0.75,
          1
        ), o = g(
          0.25,
          (i - n / 3) * 3 / n * 0.75,
          1
        ), c = g(
          0.25,
          (i - n / 3 * 2) * 3 / n * 0.75,
          1
        );
        this.dot0.style.opacity = `${g(
          0,
          Math.max(0, r * a),
          1
        )}`, this.dot1.style.opacity = `${g(
          0,
          Math.max(0, r * o),
          1
        )}`, this.dot2.style.opacity = `${g(
          0,
          Math.max(0, r * c),
          1
        )}`;
      } else
        t += " scale(0)", this.dot0.style.opacity = "0", this.dot1.style.opacity = "0", this.dot2.style.opacity = "0";
    } else
      t += " scale(0)", this.dot0.style.opacity = "0", this.dot1.style.opacity = "0", this.dot2.style.opacity = "0";
    t += ";", this.lastStyle !== t && (this.element.setAttribute("style", t), this.lastStyle = t);
  }
  dispose() {
    this.element.remove();
  }
}
const v = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;
function W(h, e = "rgba(0,0,0,1)", t = "rgba(0,0,0,0.5)") {
  const n = 2 + h, i = h / n, l = (1 - i) / 2;
  return [
    `linear-gradient(to right,${e} ${l * 100}%,${t} ${(l + i) * 100}%)`,
    i,
    n
  ];
}
function x(h) {
  return h.endTime - h.startTime >= 1e3 && h.word.length <= 7;
}
class Y {
  constructor(e, t = {
    words: [],
    translatedLyric: "",
    romanLyric: "",
    startTime: 0,
    endTime: 0,
    isBG: !1,
    isDuet: !1
  }) {
    this.lyricPlayer = e, this.lyricLine = t, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.lyricLine.isBG && this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet && this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div"));
    const n = this.element.children[0], i = this.element.children[1], l = this.element.children[2];
    n.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), i.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), l.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
  }
  element = document.createElement("div");
  left = 0;
  top = 0;
  scale = 1;
  blur = 0;
  delay = 0;
  splittedWords = [];
  // 由 LyricPlayer 来设置
  lineSize = [0, 0];
  lineTransforms = {
    posX: new S(0),
    posY: new S(0),
    scale: new S(1)
  };
  isEnabled = !1;
  enable() {
    this.isEnabled = !0, this.element.classList.add("active");
    const e = this.element.children[0];
    this.splittedWords.forEach((t) => {
      t.elementAnimations.forEach((n) => {
        n.currentTime = 0, n.playbackRate = 1, n.play();
      });
    }), e.classList.add("active");
  }
  measureSize() {
    this._hide && (this.element.style.display = "", this.element.style.visibility = "hidden");
    const e = [
      this.element.clientWidth,
      this.element.clientHeight
    ];
    return this._hide && (this.element.style.display = "none", this.element.style.visibility = ""), e;
  }
  disable() {
    this.isEnabled = !1, this.element.classList.remove("active");
    const e = this.element.children[0];
    this.splittedWords.forEach((t) => {
      t.elementAnimations.forEach((n) => {
        n.id === "float-word" && (n.playbackRate = -1, n.play());
      });
    }), e.classList.remove("active");
  }
  setLine(e) {
    this.lyricLine = e, this.lyricLine.isBG ? this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine) : this.element.classList.remove(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet ? this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine) : this.element.classList.remove(
      this.lyricPlayer.style.classes.lyricDuetLine
    ), this.rebuildElement(), this.rebuildStyle();
  }
  getLine() {
    return this.lyricLine;
  }
  _hide = !0;
  lastStyle = "";
  show() {
    this._hide = !1, this.rebuildStyle();
  }
  hide() {
    this._hide = !0, this.rebuildStyle();
  }
  rebuildStyle() {
    if (this._hide) {
      this.lastStyle !== "display:none;transform:translate(0,-10000px);" && (this.lastStyle = "display:none;transform:translate(0,-10000px);", this.element.setAttribute(
        "style",
        "display:none;transform:translate(0,-10000px);"
      ));
      return;
    }
    let e = `transform:translate(${this.lineTransforms.posX.getCurrentPosition()}px,${this.lineTransforms.posY.getCurrentPosition()}px) scale(${this.lineTransforms.scale.getCurrentPosition()});`;
    !this.lyricPlayer.getEnableSpring() && this.isInSight && (e += `transition-delay:${this.delay}ms;`), e += `filter:blur(${Math.min(32, this.blur)}px);`, e !== this.lastStyle && (this.lastStyle = e, this.element.setAttribute("style", e));
  }
  rebuildElement() {
    const e = this.element.children[0], t = this.element.children[1], n = this.element.children[2];
    if (this.lyricPlayer._getIsNonDynamic()) {
      for (; e.firstChild; )
        e.removeChild(e.firstChild), s(e.firstChild);
      e.innerText = this.lyricLine.words.map((a) => a.word).join(""), t.innerText = this.lyricLine.translatedLyric, n.innerText = this.lyricLine.romanLyric;
      return;
    }
    this.splittedWords = [], this.lyricLine.words.forEach((a) => {
      const o = a.word.split(/\s+/), c = o.reduce((u, f) => u + f.length, 0);
      let d = 0;
      o.forEach((u, f) => {
        f > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: !1
        }), this.splittedWords.push({
          word: u,
          startTime: a.startTime + (a.endTime - a.startTime) / c * d,
          endTime: a.startTime + (a.endTime - a.startTime) / c * (d + u.length),
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: x(a)
        }), d += u.length;
      });
    });
    const i = [], l = [];
    function s(a) {
      for (; a.firstChild; )
        a.firstChild.nodeType === Node.ELEMENT_NODE ? i.push(e.firstChild) : a.firstChild.nodeType === Node.TEXT_NODE && l.push(e.firstChild), a.removeChild(a.firstChild), s(a.firstChild);
    }
    s(e);
    let r = null;
    this.splittedWords.forEach((a) => {
      if (a.word.trim().length > 0)
        if (a.shouldEmphasize) {
          const o = i.pop() ?? document.createElement("span");
          o.className = "emphasize", a.elements = [o];
          for (const c of a.word) {
            const d = i.pop() ?? document.createElement("span");
            d.className = "", d.innerText = c, o.appendChild(d), a.elements.push(d);
          }
          if (a.elementAnimations = this.initEmphasizeAnimation(a), r && !v.test(a.word))
            if (r.childElementCount > 0)
              r.appendChild(o);
            else {
              const c = i.pop() ?? document.createElement("span");
              c.className = "", r.remove(), c.appendChild(r), c.appendChild(o), e.appendChild(c), r = c;
            }
          else
            r = v.test(a.word) ? null : o, e.appendChild(o);
        } else {
          const o = i.pop() ?? document.createElement("span");
          if (o.className = "", o.innerText = a.word, a.elements = [o], a.elementAnimations.push(this.initFloatAnimation(a, o)), r)
            if (r.childElementCount > 0)
              r.appendChild(o);
            else {
              const c = i.pop() ?? document.createElement("span");
              c.className = "", r.remove(), c.appendChild(r), c.appendChild(o), e.appendChild(c), r = c;
            }
          else
            r = o, e.appendChild(o);
        }
      else if (a.word.length > 0) {
        const o = l.pop() ?? document.createTextNode(" ");
        e.appendChild(o), r = null;
      } else
        r = null;
    }), t.innerText = this.lyricLine.translatedLyric, n.innerText = this.lyricLine.romanLyric;
  }
  initFloatAnimation(e, t) {
    const n = e.startTime - this.lyricLine.startTime, i = Math.max(1e3, e.endTime - e.startTime), l = t.animate(
      [
        {
          transform: "translateY(0px)"
        },
        {
          transform: "translateY(-3%)"
        }
      ],
      {
        duration: isFinite(i) ? i : 0,
        delay: isFinite(n) ? n : 0,
        id: "float-word",
        composite: "add",
        fill: "both"
      }
    );
    return l.pause(), l;
  }
  initEmphasizeAnimation(e) {
    const t = e.startTime - this.lyricLine.startTime, n = e.endTime - e.startTime;
    return e.elements.map((i, l, s) => {
      if (l === 0)
        return this.initFloatAnimation(e, i);
      {
        const r = Math.max(1e3, e.endTime - e.startTime), a = t + n / (s.length - 1) * (l - 1), o = i.animate(
          [
            {
              offset: 0,
              transform: "translate3d(0, 0px, 0px)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            },
            {
              offset: 0.5,
              transform: "translate3d(0, -2%, 20px)",
              filter: "drop-shadow(0 0 0.05em var(--amll-lyric-view-color,white))"
            },
            {
              offset: 1,
              transform: "translate3d(0, 0px, 0)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            }
          ],
          {
            duration: isFinite(r) ? r : 0,
            delay: isFinite(a) ? a : 0,
            id: "glow-word",
            iterations: 1,
            composite: "replace",
            fill: "both"
          }
        );
        return o.pause(), o;
      }
    });
  }
  updateMaskImage() {
    this._hide && (this.element.style.display = "", this.element.style.visibility = "hidden"), this.splittedWords.forEach((e) => {
      const t = e.elements[0];
      if (t) {
        e.width = t.clientWidth, e.height = t.clientHeight;
        const [n, i, l] = W(
          16 / e.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), s = `${l * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (t.style.maskImage = n, t.style.maskOrigin = "left", t.style.maskSize = s) : (t.style.webkitMaskImage = n, t.style.webkitMaskOrigin = "left", t.style.webkitMaskSize = s);
        const r = e.width + 16, a = `clamp(${-r}px,calc(${-r}px + (var(--amll-player-time) - ${e.startTime})*${r / Math.abs(e.endTime - e.startTime)}px),0px) 0px, left top`;
        t.style.maskPosition = a, t.style.webkitMaskPosition = a;
      }
    }), this._hide && (this.element.style.display = "none", this.element.style.visibility = "");
  }
  getElement() {
    return this.element;
  }
  setTransform(e = this.left, t = this.top, n = this.scale, i = 1, l = 0, s = !1, r = 0) {
    this.left = e, this.top = t, this.scale = n, this.delay = r * 1e3 | 0;
    const a = this.element.children[0];
    a.style.opacity = `${i}`, s || !this.lyricPlayer.getEnableSpring() ? (this.blur = Math.min(32, l), s && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lineTransforms.scale.setPosition(n), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), s && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, r), this.lineTransforms.posY.setTargetPosition(t, r), this.lineTransforms.scale.setTargetPosition(n), this.blur !== Math.min(32, l) && (this.blur = Math.min(32, l), this.element.style.filter = `blur(${Math.min(32, l)}px)`));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.lineTransforms.scale.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), n = e + this.lineSize[0], i = t + this.lineSize[1], l = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], r = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], a = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > r || t > a || n < l || i < s);
  }
  dispose() {
    this.element.remove();
  }
}
const G = D(A());
class ie extends EventTarget {
  element = document.createElement("div");
  currentTime = 0;
  lyricLines = [];
  processedLines = [];
  lyricLinesEl = [];
  lyricLinesSize = /* @__PURE__ */ new Map();
  hotLines = /* @__PURE__ */ new Set();
  bufferedLines = /* @__PURE__ */ new Set();
  scrollToIndex = 0;
  allowScroll = !0;
  scrolledHandler = 0;
  isScrolled = !1;
  invokedByScrollEvent = !1;
  scrollOffset = 0;
  resizeObserver = new ResizeObserver((e) => {
    const t = e[0].contentRect;
    this.size[0] = t.width, this.size[1] = t.height, this.pos[0] = t.left, this.pos[1] = t.top;
    const n = getComputedStyle(e[0].target), i = this.element.clientWidth - parseFloat(n.paddingLeft) - parseFloat(n.paddingRight), l = this.element.clientHeight - parseFloat(n.paddingTop) - parseFloat(n.paddingBottom);
    this.innerSize[0] = i, this.innerSize[1] = l, this.rebuildStyle(), this.calcLayout(!0, !0), this.lyricLinesEl.forEach((s) => s.updateMaskImage());
  });
  posXSpringParams = {
    mass: 1,
    damping: 10,
    stiffness: 100
  };
  posYSpringParams = {
    mass: 1,
    damping: 15,
    stiffness: 100
  };
  scaleSpringParams = {
    mass: 1,
    damping: 20,
    stiffness: 100
  };
  enableBlur = !0;
  interludeDots;
  interludeDotsSize = [0, 0];
  bottomLine;
  supportPlusLighter = CSS.supports("mix-blend-mode", "plus-lighter");
  supportMaskImage = CSS.supports("mask-image", "none");
  disableSpring = !1;
  alignAnchor = "center";
  alignPosition = 0.5;
  isNonDynamic = !1;
  size = [0, 0];
  innerSize = [0, 0];
  pos = [0, 0];
  _getIsNonDynamic() {
    return this.isNonDynamic;
  }
  /**
   * 设置是否使用物理弹簧算法实现歌词动画效果，默认启用
   *
   * 如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行
   *
   * 如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一
   */
  setEnableSpring(e = !0) {
    this.disableSpring = !e, e ? this.element.classList.remove(this.style.classes.disableSpring) : this.element.classList.add(this.style.classes.disableSpring), this.calcLayout(!0);
  }
  /**
   * 获取当前是否启用了物理弹簧
   * @returns 是否启用物理弹簧
   */
  getEnableSpring() {
    return !this.disableSpring;
  }
  style = G.createStyleSheet({
    lyricPlayer: {
      userSelect: "none",
      fontSize: "var(--amll-lyric-player-font-size,max(5vh, 12px))",
      padding: "1em",
      margin: "-1em",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      maxWidth: "100%",
      maxHeight: "100%",
      zIndex: 1,
      color: "var(--amll-lyric-view-color,white)",
      mixBlendMode: "plus-lighter",
      contain: "strict"
    },
    lyricLine: {
      position: "absolute",
      transformOrigin: "left",
      maxWidth: "var(--amll-lyric-player-width,100%)",
      minWidth: "var(--amll-lyric-player-width,100%)",
      width: "var(--amll-lyric-player-width,100%)",
      padding: "2vh 0.05em",
      contain: "content",
      willChange: "filter,transform,opacity",
      transition: "filter 0.25s",
      boxSizing: "border-box"
    },
    "@media (max-width: 1024px)": {
      lyricLine: {
        padding: "1vh 0"
      }
    },
    lyricDuetLine: {
      textAlign: "right",
      transformOrigin: "right"
    },
    lyricBgLine: {
      opacity: 0,
      fontSize: "max(50%, 10px)",
      transition: "opacity 0.25s",
      "&.active": {
        transition: "opacity 0.25s 0.25s",
        opacity: 0.75
      }
    },
    lyricMainLine: {
      transition: "opacity 0.3s 0.25s",
      willChange: "opacity",
      margin: "-1em",
      padding: "1em",
      "& span": {
        display: "inline-block"
      },
      "& > span": {
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        maxLines: "1",
        // willChange: "transform,display,mask-image",
        "&.emphasize": {
          transformStyle: "preserve-3d",
          perspective: "50vw",
          padding: "1em",
          margin: "-1em"
        }
      }
    },
    lyricSubLine: {
      fontSize: "max(50%, 10px)",
      opacity: 0.5
    },
    disableSpring: {
      "& > *": {
        transition: "filter 0.25s, transform 0.5s"
      }
    },
    interludeDots: {
      height: "clamp(0.5em,1vh,3em)",
      transformOrigin: "center",
      width: "fit-content",
      padding: "2.5% 0",
      position: "absolute",
      display: "flex",
      gap: "0.25em",
      left: "1em",
      "& > *": {
        height: "100%",
        display: "inline-block",
        borderRadius: "50%",
        aspectRatio: "1 / 1",
        backgroundColor: "var(--amll-lyric-view-color,white)",
        marginRight: "4px"
      },
      "&.duet": {
        right: "1em",
        transformOrigin: "center"
      }
    },
    "@supports (mix-blend-mode: plus-lighter)": {
      lyricSubLine: {
        opacity: 0.3
      }
    },
    tmpDisableTransition: {
      transition: "none !important"
    }
  });
  onPageShow = () => {
    this.calcLayout(!0, !0);
  };
  constructor() {
    super(), this.interludeDots = new R(this), this.bottomLine = new F(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.element.appendChild(this.bottomLine.getElement()), this.style.attach(), this.interludeDots.setTransform(0, 200), window.addEventListener("pageshow", this.onPageShow), this.element.addEventListener("wheel", (e) => {
      this.allowScroll && (this.isScrolled = !0, clearTimeout(this.scrolledHandler), this.scrolledHandler = setTimeout(() => {
        this.isScrolled = !1, this.scrollOffset = 0;
      }, 5e3), this.invokedByScrollEvent = !0, e.deltaMode === e.DOM_DELTA_PIXEL ? (this.scrollOffset += e.deltaY, this.calcLayout(!0)) : (this.scrollOffset += e.deltaY * 50, this.calcLayout(!1)), this.invokedByScrollEvent = !1);
    });
  }
  /**
   * 获取当前播放时间里是否处于间奏区间
   * 如果是则会返回单位为毫秒的始末时间
   * 否则返回 undefined
   *
   * 这个只允许内部调用
   * @returns [开始时间,结束时间,大概处于的歌词行ID,下一句是否为对唱歌词] 或 undefined 如果不处于间奏区间
   */
  getCurrentInterlude() {
    if (this.bufferedLines.size > 0)
      return;
    const e = this.currentTime + 20, t = this.scrollToIndex;
    if (t === 0) {
      if (this.processedLines[0]?.startTime && this.processedLines[0].startTime > e)
        return [
          e,
          this.processedLines[0].startTime,
          -2,
          this.processedLines[0].isDuet
        ];
    } else if (this.processedLines[t]?.endTime && this.processedLines[t + 1]?.startTime && this.processedLines[t + 1].startTime > e && this.processedLines[t].endTime < e)
      return [
        Math.max(this.processedLines[t].endTime, e),
        this.processedLines[t + 1].startTime,
        t,
        this.processedLines[t + 1].isDuet
      ];
  }
  /**
   * 重建样式
   *
   * 这个只允许内部调用
   */
  rebuildStyle() {
    let e = "";
    e += "--amll-lyric-player-width:", e += this.innerSize[0], e += "px;", e += "--amll-lyric-player-height:", e += this.innerSize[1], e += "px;", e += "--amll-player-time:", e += this.currentTime, e += ";", this.element.setAttribute("style", e);
  }
  /**
   * 设置是否启用歌词行的模糊效果
   * @param enable 是否启用
   */
  setEnableBlur(e) {
    this.enableBlur !== e && (this.enableBlur = e, this.calcLayout());
  }
  /**
   * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
   * @param lines 歌词数组
   */
  setLyricLines(e) {
    this.lyricLines = e;
    const t = 750;
    this.processedLines = e.filter(
      (i) => i.words.reduce((l, s) => l + s.word.trim().length, 0) > 0
    ).map((i, l, s) => {
      if (i.isBG)
        return {
          ...i
        };
      {
        const r = s[l - 1], a = s[l - 2];
        if (r?.isBG && a) {
          if (a.endTime < i.startTime)
            return {
              ...i,
              startTime: Math.max(a.endTime, i.startTime - t) || i.startTime
            };
        } else if (r?.endTime && r.endTime < i.startTime)
          return {
            ...i,
            startTime: Math.max(r?.endTime, i.startTime - t) || i.startTime
          };
        return {
          ...i
        };
      }
    }), this.isNonDynamic = !0;
    for (const i of this.processedLines)
      if (i.words.length > 1) {
        this.isNonDynamic = !1;
        break;
      }
    this.processedLines.forEach((i, l, s) => {
      const r = s[l + 1], a = i.words[i.words.length - 1];
      a && x(a) && (r ? r.startTime > i.endTime && (i.endTime = Math.min(i.endTime + 1500, r.startTime)) : i.endTime = i.endTime + 1500);
    }), this.processedLines.forEach((i, l, s) => {
      if (i.isBG)
        return;
      const r = s[l + 1];
      r?.isBG && (r.startTime = Math.min(r.startTime, i.startTime));
    });
    const n = this.lyricLinesEl;
    for (this.lyricLinesEl = this.processedLines.map((i, l) => this.lyricLinesEl[l] ?? new Y(this, i)); n.length > this.processedLines.length; )
      n.pop()?.dispose();
    this.lyricLinesEl.forEach((i) => {
      this.element.appendChild(i.getElement()), i.updateMaskImage();
    }), this.interludeDots.setInterlude(void 0), this.hotLines.clear(), this.bufferedLines.clear(), this.setLinePosXSpringParams({}), this.setLinePosYSpringParams({}), this.setLineScaleSpringParams({}), this.setCurrentTime(0, !0), this.calcLayout(!0, !0);
  }
  /**
   * 重新布局定位歌词行的位置，调用完成后再逐帧调用 `update`
   * 函数即可让歌词通过动画移动到目标位置。
   *
   * 函数有一个 `force` 参数，用于指定是否强制修改布局，也就是不经过动画直接调整元素位置和大小。
   *
   * 此函数还有一个 `reflow` 参数，用于指定是否需要重新计算布局
   *
   * 因为计算布局必定会导致浏览器重排布局，所以会大幅度影响流畅度和性能，故请只在以下情况下将其​设置为 true：
   *
   * 1. 歌词页面大小发生改变时（这个组件会自行处理）
   * 2. 加载了新的歌词时（不论前后歌词是否完全一样）
   * 3. 用户自行跳转了歌曲播放位置（不论距离远近）
   *
   * @param force 是否不经过动画直接修改布局定位
   * @param reflow 是否进行重新布局（重新计算每行歌词大小）
   */
  calcLayout(e = !1, t = !1) {
    t && (this.lyricLinesEl.forEach((m) => {
      const p = m.measureSize();
      this.lyricLinesSize.set(m, p), m.lineSize = p;
    }), this.interludeDotsSize[0] = this.interludeDots.getElement().clientWidth, this.interludeDotsSize[1] = this.interludeDots.getElement().clientHeight, this.bottomLine.lineSize = this.bottomLine.measureSize());
    const n = this.getCurrentInterlude();
    let i = -this.scrollOffset, l = this.scrollToIndex, s = 0;
    n ? (s = n[1] - n[0], s >= 5e3 && this.lyricLinesEl[n[2] + 1] && (l = n[2] + 1)) : this.interludeDots.setInterlude(void 0);
    const r = 0.95, a = this.lyricLinesEl.slice(0, l).reduce(
      (m, p) => m + (p.getLine().isBG ? 0 : this.lyricLinesSize.get(p)?.[1] ?? 0),
      0
    );
    i -= a, i += this.size[1] * this.alignPosition;
    const o = this.lyricLinesEl[l];
    if (o) {
      const m = this.lyricLinesSize.get(o)?.[1] ?? 0;
      switch (this.alignAnchor) {
        case "bottom":
          i -= m;
          break;
        case "center":
          i -= m / 2;
          break;
      }
    }
    const c = Math.max(...this.bufferedLines);
    let d = 0, u = 0.05, f = !1;
    this.lyricLinesEl.forEach((m, p) => {
      const L = this.bufferedLines.has(p), b = L || p >= this.scrollToIndex && p < c, P = m.getLine();
      P.isDuet && this.size[0] - (this.lyricLinesSize.get(m)?.[0] ?? 0), !f && s >= 5e3 && (p === this.scrollToIndex && n?.[2] === -2 || p === this.scrollToIndex + 1) && (f = !0, this.interludeDots.setTransform(32, i), n && this.interludeDots.setInterlude([n[0], n[1]]), i += this.interludeDotsSize[1]), m.setTransform(
        0,
        i,
        b ? 1 : r,
        L ? 1 : 1 / 3,
        !this.invokedByScrollEvent && this.enableBlur ? b ? 0 : 1 + (p < this.scrollToIndex ? Math.abs(this.scrollToIndex - p) : Math.abs(p - Math.max(this.scrollToIndex, c))) : 0,
        e,
        d
      ), P.isBG && b ? i += this.lyricLinesSize.get(m)?.[1] ?? 0 : P.isBG || (i += this.lyricLinesSize.get(m)?.[1] ?? 0), i >= 0 && (d += u, u /= 1.2);
    }), this.bottomLine.setTransform(0, i, e, d);
  }
  /**
   * 获取当前歌词的播放位置
   *
   * 一般和最后调用 `setCurrentTime` 给予的参数一样
   * @returns 当前播放位置
   */
  getCurrentTime() {
    return this.currentTime;
  }
  /**
   * 获取当前歌词数组
   *
   * 一般和最后调用 `setLyricLines` 给予的参数一样
   * @returns 当前歌词数组
   */
  getLyricLines() {
    return this.lyricLines;
  }
  getElement() {
    return this.element;
  }
  /**
   * 获取一个特殊的底栏元素，默认是空白的，可以往内部添加任意元素
   *
   * 这个元素始终在歌词的底部，可以用于显示歌曲创作者等信息
   *
   * 但是请勿删除该元素，只能在内部存放元素
   *
   * @returns 一个元素，可以往内部添加任意元素
   */
  getBottomLineElement() {
    return this.bottomLine.getElement();
  }
  /**
   * 设置目标歌词行的对齐方式，默认为 `center`
   *
   * - 设置成 `top` 的话将会向目标歌词行的顶部对齐
   * - 设置成 `bottom` 的话将会向目标歌词行的底部对齐
   * - 设置成 `center` 的话将会向目标歌词行的垂直中心对齐
   * @param alignAnchor 歌词行对齐方式，详情见函数说明
   */
  setAlignAnchor(e) {
    this.alignAnchor = e;
  }
  /**
   * 设置默认的歌词行对齐位置，相对于整个歌词播放组件的大小位置，默认为 `0.5`
   * @param alignPosition 一个 `[0.0-1.0]` 之间的任意数字，代表组件高度由上到下的比例位置
   */
  setAlignPosition(e) {
    this.alignPosition = e;
  }
  /**
   * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
   * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
   *
   * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
   * @param time 当前播放进度，单位为毫秒
   */
  setCurrentTime(e, t = !1) {
    if (this.currentTime = e, this.element.style.setProperty("--amll-player-time", `${e}`), this.isScrolled)
      return;
    const n = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
    this.hotLines.forEach((s) => {
      const r = this.processedLines[s];
      if (r) {
        if (r.isBG)
          return;
        const a = this.processedLines[s + 1];
        if (a?.isBG) {
          const o = Math.min(r.startTime, a?.startTime), c = Math.max(r.endTime, a?.endTime);
          (o > e || c <= e) && (this.hotLines.delete(s), n.add(s), this.hotLines.delete(s + 1), n.add(s + 1), t && (this.lyricLinesEl[s].disable(), this.lyricLinesEl[s + 1].disable()));
        } else
          (r.startTime > e || r.endTime <= e) && (this.hotLines.delete(s), n.add(s), t && this.lyricLinesEl[s].disable());
      } else
        this.hotLines.delete(s), n.add(s), t && this.lyricLinesEl[s].disable();
    }), this.processedLines.forEach((s, r, a) => {
      !s.isBG && s.startTime <= e && s.endTime > e && (this.hotLines.has(r) || (this.hotLines.add(r), l.add(r), t && this.lyricLinesEl[r].enable(), a[r + 1]?.isBG && (this.hotLines.add(r + 1), l.add(r + 1), t && this.lyricLinesEl[r + 1].enable())));
    }), this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (i.add(s), t && this.lyricLinesEl[s].disable());
    }), t ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (s) => s.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((s) => this.bufferedLines.add(s)), this.calcLayout(!0)) : (i.size > 0 || l.size > 0) && (i.size === 0 && l.size > 0 ? (l.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : l.size === 0 && i.size > 0 ? O(i, this.bufferedLines) && this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (this.bufferedLines.delete(s), this.lyricLinesEl[s].disable());
    }) : (l.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), i.forEach((s) => {
      this.bufferedLines.delete(s), this.lyricLinesEl[s].disable();
    }), this.bufferedLines.size > 0 && (this.scrollToIndex = Math.min(...this.bufferedLines))), this.calcLayout());
  }
  /**
   * 更新动画，这个函数应该被逐帧调用或者在以下情况下调用一次：
   *
   * 1. 刚刚调用完设置歌词函数的时候
   * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
   */
  update(e = 0) {
    const t = e / 1e3;
    this.interludeDots.update(e), this.bottomLine.update(t), this.lyricLinesEl.forEach((n) => n.update(t));
  }
  /**
   * 设置所有歌词行在横坐标上的弹簧属性，包括重量、弹力和阻力。
   *
   * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
   */
  setLinePosXSpringParams(e) {
    this.posXSpringParams = {
      ...this.posXSpringParams,
      ...e
    }, this.bottomLine.lineTransforms.posX.updateParams(this.posXSpringParams), this.lyricLinesEl.forEach(
      (t) => t.lineTransforms.posX.updateParams(this.posXSpringParams)
    );
  }
  /**
   * 设置所有歌词行在​纵坐标上的弹簧属性，包括重量、弹力和阻力。
   *
   * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
   */
  setLinePosYSpringParams(e) {
    this.posYSpringParams = {
      ...this.posYSpringParams,
      ...e
    }, this.bottomLine.lineTransforms.posY.updateParams(this.posYSpringParams), this.lyricLinesEl.forEach(
      (t) => t.lineTransforms.posY.updateParams(this.posYSpringParams)
    );
  }
  /**
   * 设置所有歌词行在​缩放大小上的弹簧属性，包括重量、弹力和阻力。
   *
   * @param params 需要设置的弹簧属性，提供的属性将会覆盖原来的属性，未提供的属性将会保持原样
   */
  setLineScaleSpringParams(e) {
    this.scaleSpringParams = {
      ...this.scaleSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (t) => t.lineTransforms.scale.updateParams(this.scaleSpringParams)
    );
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((e) => e.dispose()), window.removeEventListener("pageshow", this.onPageShow), this.bottomLine.dispose(), this.interludeDots.dispose();
  }
}
export {
  te as BackgroundRender,
  ie as LyricPlayer,
  ee as ttml
};
//# sourceMappingURL=amll-core.mjs.map
