import { Container as v } from "@pixi/display";
import { Application as C } from "@pixi/app";
import { BlurFilter as y } from "@pixi/filter-blur";
import { ColorMatrixFilter as w } from "@pixi/filter-color-matrix";
import { Texture as M } from "@pixi/core";
import { Sprite as b } from "@pixi/sprite";
import { create as z } from "jss";
import A from "jss-preset-default";
const D = /^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function T(d) {
  const e = D.exec(d);
  if (e) {
    const t = Number(e.groups?.hour || "0"), i = Number(e.groups?.min || "0"), n = Number(e.groups?.sec.replace(/:/, ".") || "0");
    return Math.floor((t * 3600 + i * 60 + n) * 1e3);
  } else
    throw new TypeError("时间戳字符串解析失败");
}
function I(d) {
  const t = new DOMParser().parseFromString(
    d,
    "application/xml"
  );
  let i = "v1";
  for (const a of t.querySelectorAll("ttm\\:agent"))
    if (a.getAttribute("type") === "person") {
      const s = a.getAttribute("xml:id");
      s && (i = s);
    }
  const n = [];
  for (const a of t.querySelectorAll("body p[begin][end]")) {
    const s = {
      words: [],
      startTime: T(a.getAttribute("begin") ?? "0:0"),
      endTime: T(a.getAttribute("end") ?? "0:0"),
      translatedLyric: "",
      romanLyric: "",
      isBG: !1,
      isDuet: a.getAttribute("ttm:agent") !== i
    };
    let r = null;
    for (const l of a.childNodes)
      if (l.nodeType === Node.TEXT_NODE) {
        const h = l.textContent ?? "";
        /^(\s+)$/.test(h) ? s.words.push({
          word: " ",
          startTime: 0,
          endTime: 0
        }) : s.words.push({
          word: h,
          startTime: 0,
          endTime: 0
        });
      } else if (l.nodeType === Node.ELEMENT_NODE) {
        const h = l, o = h.getAttribute("ttm:role");
        if (h.nodeName === "span" && o)
          if (o === "x-bg") {
            const c = {
              words: [],
              startTime: s.startTime,
              endTime: s.endTime,
              translatedLyric: "",
              romanLyric: "",
              isBG: !0,
              isDuet: s.isDuet
            };
            for (const u of h.childNodes)
              if (u.nodeType === Node.TEXT_NODE) {
                const f = u.textContent ?? "";
                /^(\s+)$/.test(f) ? c.words.push({
                  word: " ",
                  startTime: 0,
                  endTime: 0
                }) : c.words.push({
                  word: f,
                  startTime: 0,
                  endTime: 0
                });
              } else if (u.nodeType === Node.ELEMENT_NODE) {
                const f = u, S = f.getAttribute("ttm:role");
                if (f.nodeName === "span" && S)
                  S === "x-translation" ? c.translatedLyric = f.innerHTML.trim() : S === "x-roman" && (c.romanLyric = f.innerHTML.trim());
                else if (f.hasAttribute("begin") && f.hasAttribute("end")) {
                  const x = {
                    word: u.textContent,
                    startTime: T(f.getAttribute("begin")),
                    endTime: T(f.getAttribute("end"))
                  };
                  c.words.push(x);
                }
              }
            const m = c.words[0];
            c.startTime = m.startTime, m?.word.startsWith("(") && (m.word = m.word.substring(1));
            const p = c.words[c.words.length - 1];
            c.endTime = p.endTime, p?.word.endsWith(")") && (p.word = p.word.substring(
              0,
              p.word.length - 1
            )), r = c;
          } else
            o === "x-translation" ? s.translatedLyric = h.innerHTML : o === "x-roman" && (s.romanLyric = h.innerHTML);
        else if (h.hasAttribute("begin") && h.hasAttribute("end")) {
          const c = {
            word: l.textContent ?? "",
            startTime: T(h.getAttribute("begin")),
            endTime: T(h.getAttribute("end"))
          };
          s.words.push(c);
        }
      }
    n.push(s), r && n.push(r);
  }
  return n;
}
const Z = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseTTML: I
}, Symbol.toStringTag, { value: "Module" }));
class B extends v {
  time = 0;
}
class k {
  constructor(e) {
    this.canvas = e;
    const t = e.getBoundingClientRect();
    this.canvas.width = t.width * this.currerntRenderScale, this.canvas.height = t.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const i = e.getBoundingClientRect();
      this.canvas.width = Math.max(1, i.width), this.canvas.height = Math.max(1, i.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.rebuildFilters();
    }), this.observer.observe(e), this.app = new C({
      view: e,
      resizeTo: this.canvas,
      powerPreference: "low-power",
      backgroundAlpha: 0
    }), this.rebuildFilters(), this.app.ticker.add(this.onTick), this.app.ticker.start();
  }
  observer;
  app;
  curContainer;
  lastContainer = /* @__PURE__ */ new Set();
  onTick = (e) => {
    for (const t of this.lastContainer)
      t.alpha = Math.max(0, t.alpha - e / 60), t.alpha <= 0 && (this.app.stage.removeChild(t), this.lastContainer.delete(t));
    if (this.curContainer) {
      this.curContainer.alpha = Math.min(
        1,
        this.curContainer.alpha + e / 60
      );
      const [t, i, n, a] = this.curContainer.children, s = Math.max(this.app.screen.width, this.app.screen.height);
      t.position.set(this.app.screen.width / 2, this.app.screen.height / 2), i.position.set(
        this.app.screen.width / 2.5,
        this.app.screen.height / 2.5
      ), n.position.set(this.app.screen.width / 2, this.app.screen.height / 2), a.position.set(this.app.screen.width / 2, this.app.screen.height / 2), t.width = s * Math.sqrt(2), t.height = t.width, i.width = s * 0.8, i.height = i.width, n.width = s * 0.5, n.height = n.width, a.width = s * 0.25, a.height = a.width, this.curContainer.time += e * this.flowSpeed, t.rotation += e / 1e3 * this.flowSpeed, i.rotation -= e / 500 * this.flowSpeed, n.rotation += e / 1e3 * this.flowSpeed, a.rotation -= e / 750 * this.flowSpeed, n.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), n.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), a.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), a.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
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
    const e = Math.min(this.canvas.width, this.canvas.height), t = new w();
    t.saturate(1.2, !1);
    const i = new w();
    i.brightness(0.6, !1);
    const n = new w();
    n.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new y(5, 1)), this.app.stage.filters.push(new y(10, 1)), this.app.stage.filters.push(new y(20, 2)), this.app.stage.filters.push(new y(40, 2)), e > 512 && this.app.stage.filters.push(new y(80, 2)), e > 768 && this.app.stage.filters.push(new y(160, 4)), e > 768 * 2 && this.app.stage.filters.push(new y(320, 4)), this.app.stage.filters.push(t, i, n), this.app.stage.filters.push(new y(5, 1));
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
    const t = await M.fromURL(e), i = new B(), n = new b(t), a = new b(t), s = new b(t), r = new b(t);
    n.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), r.anchor.set(0.5, 0.5), n.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, r.rotation = Math.random() * Math.PI * 2, i.addChild(n, a, s, r), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = i, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class ee extends k {
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
const N = (d, e) => d.size === e.size && [...d].every((t) => e.has(t));
class L {
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
function $(d, e, t, i = 0, n) {
  const a = n?.soft ?? !1, s = n?.stiffness ?? 100, r = n?.damping ?? 10, l = n?.mass ?? 1, h = t - d;
  if (a || 1 <= r / (2 * Math.sqrt(s * l))) {
    const o = -Math.sqrt(s / l), c = -o * h - e;
    return (m) => (m -= i, m < 0 ? d : t - (h + m * c) * Math.E ** (m * o));
  } else {
    const o = Math.sqrt(
      4 * l * s - r ** 2
    ), c = (r * h - 2 * l * e) / o, m = 0.5 * o / l, p = -(0.5 * r) / l;
    return (u) => (u -= i, u < 0 ? d : t - (Math.cos(u * m) * h + Math.sin(u * m) * c) * Math.E ** (u * p));
  }
}
function O(d) {
  return (t) => (d(t + 1e-3) - d(t - 1e-3)) / (2 * 1e-3);
}
function q(d) {
  return O(d);
}
class X {
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
    posX: new L(0),
    posY: new L(0)
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
  setTransform(e = this.left, t = this.top, i = !1, n = 0) {
    this.left = e, this.top = t, this.delay = n * 1e3 | 0, i || !this.lyricPlayer.getEnableSpring() ? (i && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), i && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, n), this.lineTransforms.posY.setTargetPosition(t, n));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), i = e + this.lineSize[0], n = t + this.lineSize[1], a = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], r = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], l = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > r || t > l || i < a || n < s);
  }
  dispose() {
    this.element.remove();
  }
}
function _(d) {
  const t = 2.5949095;
  return d < 0.5 ? Math.pow(2 * d, 2) * ((t + 1) * 2 * d - t) / 2 : (Math.pow(2 * d - 2, 2) * ((t + 1) * (d * 2 - 2) + t) + 2) / 2;
}
const g = (d, e, t) => Math.max(d, Math.min(e, t));
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
      const i = this.currentInterlude[1] - this.currentInterlude[0], n = this.currentTime - this.currentInterlude[0];
      if (n <= i) {
        const a = i / Math.ceil(i / this.targetBreatheDuration);
        let s = 1, r = 1;
        s *= Math.sin(1.5 * Math.PI - n / a * 2) / 10 + 1, n < 1e3 && (s *= 1 - Math.pow((1e3 - n) / 1e3, 2)), n < 500 ? r = 0 : n < 1e3 && (r *= (n - 500) / 500), i - n < 750 && (s *= 1 - _(
          (750 - (i - n)) / 750 / 2
        )), i - n < 375 && (r *= g(
          0,
          (i - n) / 375,
          1
        )), s = Math.max(0, s), t += ` scale(${s})`;
        const l = g(
          0.25,
          n * 3 / i * 0.75,
          1
        ), h = g(
          0.25,
          (n - i / 3) * 3 / i * 0.75,
          1
        ), o = g(
          0.25,
          (n - i / 3 * 2) * 3 / i * 0.75,
          1
        );
        this.dot0.style.opacity = `${g(
          0,
          Math.max(0, r * l),
          1
        )}`, this.dot1.style.opacity = `${g(
          0,
          Math.max(0, r * h),
          1
        )}`, this.dot2.style.opacity = `${g(
          0,
          Math.max(0, r * o),
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
const P = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;
function W(d, e = "rgba(0,0,0,1)", t = "rgba(0,0,0,0.5)") {
  const i = 2 + d, n = d / i, a = (1 - n) / 2;
  return [
    `linear-gradient(to right,${e} ${a * 100}%,${t} ${(a + n) * 100}%)`,
    n,
    i
  ];
}
function E(d) {
  return d.endTime - d.startTime >= 1e3 && d.word.length <= 7;
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
    const i = this.element.children[0], n = this.element.children[1], a = this.element.children[2];
    i.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), n.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), a.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
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
    posX: new L(0),
    posY: new L(0),
    scale: new L(1)
  };
  isEnabled = !1;
  enable() {
    this.isEnabled = !0, this.element.classList.add("active");
    const e = this.element.children[0];
    this.splittedWords.forEach((t) => {
      t.elementAnimations.forEach((i) => {
        i.currentTime = 0, i.playbackRate = 1, i.play();
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
      t.elementAnimations.forEach((i) => {
        i.id === "float-word" && (i.playbackRate = -1, i.play());
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
    const e = this.element.children[0], t = this.element.children[1], i = this.element.children[2];
    if (this.lyricPlayer._getIsNonDynamic()) {
      for (; e.firstChild; )
        e.removeChild(e.firstChild), s(e.firstChild);
      e.innerText = this.lyricLine.words.map((l) => l.word).join(""), t.innerText = this.lyricLine.translatedLyric, i.innerText = this.lyricLine.romanLyric;
      return;
    }
    this.splittedWords = [], this.lyricLine.words.forEach((l) => {
      const h = l.word.split(/\s+/), o = h.reduce((m, p) => m + p.length, 0);
      let c = 0;
      h.forEach((m, p) => {
        p > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: !1
        }), this.splittedWords.push({
          word: m,
          startTime: l.startTime + (l.endTime - l.startTime) / o * c,
          endTime: l.startTime + (l.endTime - l.startTime) / o * (c + m.length),
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: E(l)
        }), c += m.length;
      });
    });
    const n = [], a = [];
    function s(l) {
      for (; l.firstChild; )
        l.firstChild.nodeType === Node.ELEMENT_NODE ? n.push(e.firstChild) : l.firstChild.nodeType === Node.TEXT_NODE && a.push(e.firstChild), l.removeChild(l.firstChild), s(l.firstChild);
    }
    s(e);
    let r = null;
    this.splittedWords.forEach((l) => {
      if (l.word.trim().length > 0)
        if (l.shouldEmphasize) {
          const h = n.pop() ?? document.createElement("span");
          h.className = "emphasize", l.elements = [h];
          for (const o of l.word) {
            const c = n.pop() ?? document.createElement("span");
            c.className = "", c.innerText = o, h.appendChild(c), l.elements.push(c);
          }
          if (l.elementAnimations = this.initEmphasizeAnimation(l), r && !P.test(l.word))
            if (r.childElementCount > 0)
              r.appendChild(h);
            else {
              const o = n.pop() ?? document.createElement("span");
              o.className = "", r.remove(), o.appendChild(r), o.appendChild(h), e.appendChild(o), r = o;
            }
          else
            r = P.test(l.word) ? null : h, e.appendChild(h);
        } else {
          const h = n.pop() ?? document.createElement("span");
          if (h.className = "", h.innerText = l.word, l.elements = [h], l.elementAnimations.push(this.initFloatAnimation(l, h)), r)
            if (r.childElementCount > 0)
              r.appendChild(h);
            else {
              const o = n.pop() ?? document.createElement("span");
              o.className = "", r.remove(), o.appendChild(r), o.appendChild(h), e.appendChild(o), r = o;
            }
          else
            r = h, e.appendChild(h);
        }
      else if (l.word.length > 0) {
        const h = a.pop() ?? document.createTextNode(" ");
        e.appendChild(h), r = null;
      } else
        r = null;
    }), t.innerText = this.lyricLine.translatedLyric, i.innerText = this.lyricLine.romanLyric;
  }
  initFloatAnimation(e, t) {
    const i = e.startTime - this.lyricLine.startTime, n = Math.max(1e3, e.endTime - e.startTime), a = t.animate(
      [
        {
          transform: "translateY(0px)"
        },
        {
          transform: "translateY(-3%)"
        }
      ],
      {
        duration: isFinite(n) ? n : 0,
        delay: isFinite(i) ? i : 0,
        id: "float-word",
        composite: "add",
        fill: "both"
      }
    );
    return a.pause(), a;
  }
  initEmphasizeAnimation(e) {
    const t = e.startTime - this.lyricLine.startTime, i = e.endTime - e.startTime;
    return e.elements.map((n, a, s) => {
      if (a === 0)
        return this.initFloatAnimation(e, n);
      {
        const r = Math.max(1e3, e.endTime - e.startTime), l = t + i / (s.length - 1) * (a - 1), h = n.animate(
          [
            {
              offset: 0,
              transform: "translate3d(0, 0px, 0px)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            },
            {
              offset: 0.5,
              transform: "translate3d(0, -2%, 20px)",
              filter: "drop-shadow(0 0 0.2rem var(--amll-lyric-view-color,white))"
            },
            {
              offset: 1,
              transform: "translate3d(0, 0px, 0)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            }
          ],
          {
            duration: isFinite(r) ? r : 0,
            delay: isFinite(l) ? l : 0,
            id: "glow-word",
            iterations: 1,
            composite: "replace",
            fill: "both"
          }
        );
        return h.pause(), h;
      }
    });
  }
  updateMaskImage() {
    this._hide && (this.element.style.display = "", this.element.style.visibility = "hidden"), this.splittedWords.forEach((e) => {
      const t = e.elements[0];
      if (t) {
        e.width = t.clientWidth, e.height = t.clientHeight;
        const [i, n, a] = W(
          16 / e.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), s = `${a * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (t.style.maskImage = i, t.style.maskOrigin = "left", t.style.maskSize = s) : (t.style.webkitMaskImage = i, t.style.webkitMaskOrigin = "left", t.style.webkitMaskSize = s);
        const r = e.width + 16, l = `clamp(${-r}px,calc(${-r}px + (var(--amll-player-time) - ${e.startTime})*${r / Math.abs(e.endTime - e.startTime)}px),0px) 0px, left top`;
        t.style.maskPosition = l, t.style.webkitMaskPosition = l;
      }
    }), this._hide && (this.element.style.display = "none", this.element.style.visibility = "");
  }
  getElement() {
    return this.element;
  }
  setTransform(e = this.left, t = this.top, i = this.scale, n = 1, a = 0, s = !1, r = 0) {
    this.left = e, this.top = t, this.scale = i, this.delay = r * 1e3 | 0;
    const l = this.element.children[0];
    l.style.opacity = `${n}`, s || !this.lyricPlayer.getEnableSpring() ? (this.blur = Math.min(32, a), s && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lineTransforms.scale.setPosition(i), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), s && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, r), this.lineTransforms.posY.setTargetPosition(t, r), this.lineTransforms.scale.setTargetPosition(i), this.blur !== Math.min(32, a) && (this.blur = Math.min(32, a), this.element.style.filter = `blur(${Math.min(32, a)}px)`));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.lineTransforms.scale.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), i = e + this.lineSize[0], n = t + this.lineSize[1], a = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], r = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], l = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > r || t > l || i < a || n < s);
  }
  dispose() {
    this.element.remove();
  }
}
const F = z(A());
class te extends EventTarget {
  element = document.createElement("div");
  currentTime = 0;
  lyricLines = [];
  processedLines = [];
  lyricLinesEl = [];
  lyricLinesSize = /* @__PURE__ */ new Map();
  hotLines = /* @__PURE__ */ new Set();
  bufferedLines = /* @__PURE__ */ new Set();
  scrollToIndex = 0;
  resizeObserver = new ResizeObserver((e) => {
    const t = e[0].contentRect;
    this.size[0] = t.width, this.size[1] = t.height, this.pos[0] = t.left, this.pos[1] = t.top, this.rebuildStyle(), this.calcLayout(!0), this.lyricLinesEl.forEach((i) => i.updateMaskImage());
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
  alignAnchor = 0.5;
  isNonDynamic = !1;
  size = [0, 0];
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
  style = F.createStyleSheet({
    lyricPlayer: {
      userSelect: "none",
      padding: "1rem",
      boxSizing: "border-box",
      fontSize: "max(5vh, 12px)",
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
      maxWidth: "100%",
      width: "100%",
      padding: "max(2vh, 1rem) 1rem",
      contain: "content",
      willChange: "filter,transform,opacity",
      transition: "filter 0.25s",
      boxSizing: "border-box"
    },
    "@media (max-width: 1024px)": {
      lyricLine: {
        padding: "max(1vh, 1rem) 1rem"
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
        opacity: 1
      }
    },
    lyricMainLine: {
      transition: "opacity 0.3s 0.25s",
      willChange: "opacity",
      margin: "-1rem",
      padding: "1rem",
      "& span": {
        display: "inline-block",
        margin: "-1rem",
        padding: "1rem"
      },
      "& > span": {
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        maxLines: "1",
        willChange: "transform,display,mask-image",
        "&.emphasize": {
          margin: "-1rem",
          padding: "1rem",
          transformStyle: "preserve-3d",
          perspective: "50vw"
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
      height: "min(1rem,2.5vh)",
      transformOrigin: "center",
      width: "fit-content",
      padding: "2.5% 0",
      position: "absolute",
      display: "flex",
      gap: "0.5rem",
      "& > *": {
        width: "100%",
        display: "inline-block",
        borderRadius: "50%",
        aspectRatio: "1 / 1",
        backgroundColor: "var(--amll-lyric-view-color,white)",
        marginRight: "4px"
      },
      "&.duet": {
        right: "1rem",
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
    this.calcLayout(!0);
  };
  constructor() {
    super(), this.interludeDots = new R(this), this.bottomLine = new X(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.element.appendChild(this.bottomLine.getElement()), this.style.attach(), this.interludeDots.setTransform(0, 200), window.addEventListener("pageshow", this.onPageShow);
  }
  /**
   * 获取当前播放时间里是否处于间奏区间
   * 如果是则会返回单位为毫秒的始末时间
   * 否则返回 undefined
   *
   * 这个只允许内部调用
   * @returns [开始时间,结束时间] 或 undefined 如果不处于间奏区间
   */
  getCurrentInterlude() {
    if (this.bufferedLines.size > 0)
      return;
    const e = this.currentTime + 20, t = this.scrollToIndex;
    if (t === 0) {
      if (this.processedLines[0]?.startTime && this.processedLines[0].startTime > e)
        return [0, this.processedLines[0].startTime, -2];
    } else if (this.processedLines[t]?.endTime && this.processedLines[t + 1]?.startTime && this.processedLines[t + 1].startTime > e && this.processedLines[t].endTime < e)
      return [
        this.processedLines[t].endTime,
        this.processedLines[t + 1].startTime,
        t
      ];
  }
  /**
   * 重建样式
   *
   * 这个只允许内部调用
   */
  rebuildStyle() {
    let e = "";
    e += "--amll-lyric-player-width:", e += this.element.clientWidth, e += "px;", e += "--amll-lyric-player-height:", e += this.element.clientHeight, e += "px;", e += "--amll-player-time:", e += this.currentTime, e += ";", this.element.setAttribute("style", e);
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
      (i) => i.words.reduce((n, a) => n + a.word.trim().length, 0) > 0
    ).map((i, n, a) => {
      if (i.isBG)
        return {
          ...i
        };
      {
        const s = a[n - 1], r = a[n - 2];
        if (s?.isBG && r) {
          if (r.endTime < i.startTime)
            return {
              ...i,
              startTime: Math.max(r.endTime, i.startTime - t) || i.startTime
            };
        } else if (s?.endTime && s.endTime < i.startTime)
          return {
            ...i,
            startTime: Math.max(s?.endTime, i.startTime - t) || i.startTime
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
    this.processedLines.forEach((i, n, a) => {
      const s = a[n + 1], r = i.words[i.words.length - 1];
      r && E(r) && (s ? s.startTime > i.endTime && (i.endTime = Math.min(i.endTime + 1500, s.startTime)) : i.endTime = i.endTime + 1500);
    }), this.processedLines.forEach((i, n, a) => {
      if (i.isBG)
        return;
      const s = a[n + 1];
      s?.isBG && (s.startTime = Math.min(s.startTime, i.startTime));
    }), this.lyricLinesEl.forEach((i) => i.dispose()), this.lyricLinesEl = this.processedLines.map(
      (i) => new Y(this, i)
    ), this.lyricLinesEl.forEach((i) => {
      this.element.appendChild(i.getElement()), i.updateMaskImage();
    }), this.interludeDots.setInterlude(void 0), this.hotLines.clear(), this.bufferedLines.clear(), this.setLinePosXSpringParams({}), this.setLinePosYSpringParams({}), this.setLineScaleSpringParams({}), this.setCurrentTime(0, !0), this.calcLayout(!0);
  }
  /**
   * 重新布局定位歌词行的位置，调用完成后再逐帧调用 `update`
   * 函数即可让歌词通过动画移动到目标位置。
   *
   * 此函数还有一个 `reflow` 参数，用于指定是否需要重新计算布局
   *
   * 因为计算布局必定会导致浏览器重排布局，所以会大幅度影响流畅度和性能，故请只在以下情况下将其​设置为 true：
   *
   * 1. 歌词页面大小发生改变时（这个组件会自行处理）
   * 2. 加载了新的歌词时（不论前后歌词是否完全一样）
   * 3. 用户自行跳转了歌曲播放位置（不论距离远近）
   *
   * @param reflow 是否进行重新布局（重新计算每行歌词大小）
   */
  calcLayout(e = !1) {
    e && (this.lyricLinesEl.forEach((o) => {
      const c = o.measureSize();
      this.lyricLinesSize.set(o, c), o.lineSize = c;
    }), this.interludeDotsSize[0] = this.interludeDots.getElement().clientWidth, this.interludeDotsSize[1] = this.interludeDots.getElement().clientHeight, this.bottomLine.lineSize = this.bottomLine.measureSize());
    const t = 0.95;
    let n = -this.lyricLinesEl.slice(0, this.scrollToIndex).reduce(
      (o, c) => o + (c.getLine().isBG ? 0 : this.lyricLinesSize.get(c)?.[1] ?? 0),
      0
    );
    if (this.alignAnchor === "bottom") {
      n += this.element.clientHeight / 2;
      const o = this.lyricLinesEl[this.scrollToIndex];
      if (o) {
        const c = this.lyricLinesSize.get(o)?.[1] ?? 0;
        n -= c / 2;
      }
    } else if (typeof this.alignAnchor == "number") {
      n += this.element.clientHeight * this.alignAnchor;
      const o = this.lyricLinesEl[this.scrollToIndex];
      if (o) {
        const c = this.lyricLinesSize.get(o)?.[1] ?? 0;
        n -= c / 2;
      }
    }
    const a = this.getCurrentInterlude();
    let s = 0;
    if (a) {
      if (s = a[1] - a[0], s >= 5e3) {
        const o = this.lyricLinesEl[a[2] + 1];
        o && (n -= this.lyricLinesSize.get(o)?.[1] ?? 0);
      }
    } else
      this.interludeDots.setInterlude(void 0);
    const r = Math.max(...this.bufferedLines);
    let l = 0, h = !1;
    this.lyricLinesEl.forEach((o, c) => {
      const m = this.bufferedLines.has(c), p = m || c >= this.scrollToIndex && c < r, u = o.getLine();
      let f = 0;
      u.isDuet && (f = this.size[0] - (this.lyricLinesSize.get(o)?.[0] ?? 0)), !h && s >= 5e3 && (c === this.scrollToIndex && a?.[2] === -2 || c === this.scrollToIndex + 1) && (h = !0, this.interludeDots.setTransform(0, n), a && this.interludeDots.setInterlude([a[0], a[1]]), n += this.interludeDotsSize[1]), o.setTransform(
        f,
        n,
        p ? 1 : t,
        m ? 1 : 1 / 3,
        this.enableBlur ? p ? 0 : 1 + (c < this.scrollToIndex ? Math.abs(this.scrollToIndex - c) : Math.abs(c - Math.max(this.scrollToIndex, r))) : 0,
        e,
        l
      ), u.isBG && p ? n += this.lyricLinesSize.get(o)?.[1] ?? 0 : u.isBG || (n += this.lyricLinesSize.get(o)?.[1] ?? 0), n >= 0 && (l += 0.05);
    }), this.bottomLine.setTransform(0, n, e, l);
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
   * 设置歌词行的对齐方式，默认为 `top`
   *
   * - 设置成 `top` 的话歌词将会向组件顶部对齐
   * - 设置成 `bottom` 的话歌词将会向组件底部对齐
   * - 设置成 [0.0-1.0] 之间任意数字的话则会根据当前组件高度从顶部向下位移为对齐位置垂直居中对齐
   * @param alignAnchor 歌词行对齐方式，详情见函数说明
   */
  setAlignAnchor(e) {
    this.alignAnchor = e;
  }
  /**
   * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
   * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
   *
   * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
   * @param time 当前播放进度，单位为毫秒
   */
  setCurrentTime(e, t = !1) {
    this.currentTime = e, this.element.style.setProperty("--amll-player-time", `${e}`);
    const i = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
    this.hotLines.forEach((s) => {
      const r = this.processedLines[s];
      if (r) {
        if (r.isBG)
          return;
        const l = this.processedLines[s + 1];
        if (l?.isBG) {
          const h = Math.min(r.startTime, l?.startTime), o = Math.max(r.endTime, l?.endTime);
          (h > e || o <= e) && (this.hotLines.delete(s), i.add(s), this.hotLines.delete(s + 1), i.add(s + 1), t && (this.lyricLinesEl[s].disable(), this.lyricLinesEl[s + 1].disable()));
        } else
          (r.startTime > e || r.endTime <= e) && (this.hotLines.delete(s), i.add(s), t && this.lyricLinesEl[s].disable());
      } else
        this.hotLines.delete(s), i.add(s), t && this.lyricLinesEl[s].disable();
    }), this.processedLines.forEach((s, r, l) => {
      !s.isBG && s.startTime <= e && s.endTime > e && (this.hotLines.has(r) || (this.hotLines.add(r), a.add(r), t && this.lyricLinesEl[r].enable(), l[r + 1]?.isBG && (this.hotLines.add(r + 1), a.add(r + 1), t && this.lyricLinesEl[r + 1].enable())));
    }), this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (n.add(s), t && this.lyricLinesEl[s].disable());
    }), t ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (s) => s.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((s) => this.bufferedLines.add(s)), this.calcLayout(!0)) : (n.size > 0 || a.size > 0) && (n.size === 0 && a.size > 0 ? (a.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : a.size === 0 && n.size > 0 ? N(n, this.bufferedLines) && this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (this.bufferedLines.delete(s), this.lyricLinesEl[s].disable());
    }) : (a.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), n.forEach((s) => {
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
    this.interludeDots.update(e), this.bottomLine.update(e), this.lyricLinesEl.forEach((i) => i.update(t));
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
  ee as BackgroundRender,
  te as LyricPlayer,
  Z as ttml
};
//# sourceMappingURL=amll-core.mjs.map
