var D = Object.defineProperty;
var I = (c, t, e) => t in c ? D(c, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : c[t] = e;
var h = (c, t, e) => (I(c, typeof t != "symbol" ? t + "" : t, e), e);
import { Container as B } from "@pixi/display";
import { Application as k } from "@pixi/app";
import { BlurFilter as g } from "@pixi/filter-blur";
import { ColorMatrixFilter as P } from "@pixi/filter-color-matrix";
import { Texture as N } from "@pixi/core";
import { Sprite as S } from "@pixi/sprite";
import { create as O } from "jss";
import $ from "jss-preset-default";
const q = /^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function b(c) {
  var e, n, s;
  const t = q.exec(c);
  if (t) {
    const a = Number(((e = t.groups) == null ? void 0 : e.hour) || "0"), l = Number(((n = t.groups) == null ? void 0 : n.min) || "0"), i = Number(((s = t.groups) == null ? void 0 : s.sec.replace(/:/, ".")) || "0");
    return Math.floor((a * 3600 + l * 60 + i) * 1e3);
  } else
    throw new TypeError("时间戳字符串解析失败");
}
function R(c) {
  const e = new DOMParser().parseFromString(
    c,
    "application/xml"
  );
  let n = "v1";
  for (const a of e.querySelectorAll("ttm\\:agent"))
    if (a.getAttribute("type") === "person") {
      const l = a.getAttribute("xml:id");
      l && (n = l);
    }
  const s = [];
  for (const a of e.querySelectorAll("body p[begin][end]")) {
    const l = {
      words: [],
      startTime: b(a.getAttribute("begin") ?? "0:0"),
      endTime: b(a.getAttribute("end") ?? "0:0"),
      translatedLyric: "",
      romanLyric: "",
      isBG: !1,
      isDuet: a.getAttribute("ttm:agent") !== n
    };
    let i = null;
    for (const r of a.childNodes)
      if (r.nodeType === Node.TEXT_NODE) {
        const o = r.textContent ?? "";
        /^(\s+)$/.test(o) ? l.words.push({
          word: " ",
          startTime: 0,
          endTime: 0
        }) : l.words.push({
          word: o,
          startTime: 0,
          endTime: 0
        });
      } else if (r.nodeType === Node.ELEMENT_NODE) {
        const o = r, d = o.getAttribute("ttm:role");
        if (o.nodeName === "span" && d)
          if (d === "x-bg") {
            const u = {
              words: [],
              startTime: l.startTime,
              endTime: l.endTime,
              translatedLyric: "",
              romanLyric: "",
              isBG: !0,
              isDuet: l.isDuet
            };
            for (const p of o.childNodes)
              if (p.nodeType === Node.TEXT_NODE) {
                const y = p.textContent ?? "";
                /^(\s+)$/.test(y) ? u.words.push({
                  word: " ",
                  startTime: 0,
                  endTime: 0
                }) : u.words.push({
                  word: y,
                  startTime: 0,
                  endTime: 0
                });
              } else if (p.nodeType === Node.ELEMENT_NODE) {
                const y = p, T = y.getAttribute("ttm:role");
                if (y.nodeName === "span" && T)
                  T === "x-translation" ? u.translatedLyric = y.innerHTML.trim() : T === "x-roman" && (u.romanLyric = y.innerHTML.trim());
                else if (y.hasAttribute("begin") && y.hasAttribute("end")) {
                  const E = {
                    word: p.textContent,
                    startTime: b(y.getAttribute("begin")),
                    endTime: b(y.getAttribute("end"))
                  };
                  u.words.push(E);
                }
              }
            const f = u.words[0];
            u.startTime = f.startTime, f != null && f.word.startsWith("(") && (f.word = f.word.substring(1));
            const m = u.words[u.words.length - 1];
            u.endTime = m.endTime, m != null && m.word.endsWith(")") && (m.word = m.word.substring(
              0,
              m.word.length - 1
            )), i = u;
          } else
            d === "x-translation" ? l.translatedLyric = o.innerHTML : d === "x-roman" && (l.romanLyric = o.innerHTML);
        else if (o.hasAttribute("begin") && o.hasAttribute("end")) {
          const u = {
            word: r.textContent ?? "",
            startTime: b(o.getAttribute("begin")),
            endTime: b(o.getAttribute("end"))
          };
          l.words.push(u);
        }
      }
    s.push(l), i && s.push(i);
  }
  return console.log(s), s;
}
const ae = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseTTML: R
}, Symbol.toStringTag, { value: "Module" }));
class F extends B {
  constructor() {
    super(...arguments);
    h(this, "time", 0);
  }
}
class _ {
  constructor(t) {
    h(this, "observer");
    h(this, "app");
    h(this, "curContainer");
    h(this, "lastContainer", /* @__PURE__ */ new Set());
    h(this, "onTick", (t) => {
      for (const e of this.lastContainer)
        e.alpha = Math.max(0, e.alpha - t / 60), e.alpha <= 0 && (this.app.stage.removeChild(e), this.lastContainer.delete(e));
      if (this.curContainer) {
        this.curContainer.alpha = Math.min(
          1,
          this.curContainer.alpha + t / 60
        );
        const [e, n, s, a] = this.curContainer.children, l = Math.max(this.app.screen.width, this.app.screen.height);
        e.position.set(this.app.screen.width / 2, this.app.screen.height / 2), n.position.set(
          this.app.screen.width / 2.5,
          this.app.screen.height / 2.5
        ), s.position.set(this.app.screen.width / 2, this.app.screen.height / 2), a.position.set(this.app.screen.width / 2, this.app.screen.height / 2), e.width = l * Math.sqrt(2), e.height = e.width, n.width = l * 0.8, n.height = n.width, s.width = l * 0.5, s.height = s.width, a.width = l * 0.25, a.height = a.width, this.curContainer.time += t * this.flowSpeed, e.rotation += t / 1e3 * this.flowSpeed, n.rotation -= t / 500 * this.flowSpeed, s.rotation += t / 1e3 * this.flowSpeed, a.rotation -= t / 750 * this.flowSpeed, s.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), s.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), a.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), a.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
      }
    });
    h(this, "flowSpeed", 2);
    h(this, "currerntRenderScale", 0.75);
    this.canvas = t;
    const e = t.getBoundingClientRect();
    this.canvas.width = e.width * this.currerntRenderScale, this.canvas.height = e.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const n = t.getBoundingClientRect();
      this.canvas.width = Math.max(1, n.width), this.canvas.height = Math.max(1, n.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.rebuildFilters();
    }), this.observer.observe(t), this.app = new k({
      view: t,
      resizeTo: this.canvas,
      powerPreference: "low-power",
      backgroundAlpha: 0
    }), this.rebuildFilters(), this.app.ticker.add(this.onTick), this.app.ticker.start();
  }
  /**
   * 修改背景的流动速度，数字越大越快，默认为 2
   * @param speed 背景的流动速度，默认为 2
   */
  setFlowSpeed(t) {
    this.flowSpeed = t;
  }
  /**
   * 修改背景的渲染比例，默认是 0.5
   *
   * 一般情况下这个程度既没有明显瑕疵也不会特别吃性能
   * @param scale 背景的渲染比例
   */
  setRenderScale(t) {
    this.currerntRenderScale = t;
    const e = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, e.width), this.canvas.height = Math.max(1, e.height), this.app.renderer.resize(
      this.canvas.width * this.currerntRenderScale,
      this.canvas.height * this.currerntRenderScale
    ), this.rebuildFilters();
  }
  rebuildFilters() {
    const t = Math.min(this.canvas.width, this.canvas.height), e = new P();
    e.saturate(1.2, !1);
    const n = new P();
    n.brightness(0.6, !1);
    const s = new P();
    s.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new g(5, 1)), this.app.stage.filters.push(new g(10, 1)), this.app.stage.filters.push(new g(20, 2)), this.app.stage.filters.push(new g(40, 2)), t > 512 && this.app.stage.filters.push(new g(80, 2)), t > 768 && this.app.stage.filters.push(new g(160, 4)), t > 768 * 2 && this.app.stage.filters.push(new g(320, 4)), this.app.stage.filters.push(e, n, s), this.app.stage.filters.push(new g(5, 1));
  }
  /**
   * 修改背景动画帧率，默认是 30 FPS
   *
   * 如果设置成 0 则会停止动画
   * @param fps 目标帧率，默认 30 FPS
   */
  setFPS(t) {
    this.app.ticker.maxFPS = t;
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
  async setAlbumImage(t) {
    const e = await N.fromURL(t), n = new F(), s = new S(e), a = new S(e), l = new S(e), i = new S(e);
    s.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), l.anchor.set(0.5, 0.5), i.anchor.set(0.5, 0.5), s.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, l.rotation = Math.random() * Math.PI * 2, i.rotation = Math.random() * Math.PI * 2, n.addChild(s, a, l, i), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = n, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class le extends _ {
  constructor() {
    const e = document.createElement("canvas");
    super(e);
    h(this, "element");
    this.element = e, e.style.pointerEvents = "none", e.style.zIndex = "-1";
  }
  getElement() {
    return this.element;
  }
  dispose() {
    super.dispose(), this.element.remove();
  }
}
const W = (c, t) => c.size === t.size && [...c].every((e) => t.has(e));
function G(c) {
  const e = 2.5949095;
  return c < 0.5 ? Math.pow(2 * c, 2) * ((e + 1) * 2 * c - e) / 2 : (Math.pow(2 * c - 2, 2) * ((e + 1) * (c * 2 - 2) + e) + 2) / 2;
}
const L = (c, t, e) => Math.max(c, Math.min(t, e));
class X {
  constructor(t) {
    h(this, "element", document.createElement("div"));
    h(this, "dot0", document.createElement("span"));
    h(this, "dot1", document.createElement("span"));
    h(this, "dot2", document.createElement("span"));
    h(this, "left", 0);
    h(this, "top", 0);
    h(this, "scale", 1);
    h(this, "lastStyle", "");
    h(this, "currentInterlude");
    h(this, "currentTime", 0);
    h(this, "targetBreatheDuration", 1500);
    this.lyricPlayer = t, this.element.className = this.lyricPlayer.style.classes.interludeDots, this.element.appendChild(this.dot0), this.element.appendChild(this.dot1), this.element.appendChild(this.dot2);
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, e = this.top) {
    this.left = t, this.top = e, this.update();
  }
  setInterlude(t) {
    this.currentInterlude = t, this.currentTime = (t == null ? void 0 : t[0]) ?? 0;
  }
  update(t = 0) {
    this.currentTime += t;
    let e = "";
    if (e += `transform:translate(${this.left}px, ${this.top}px)`, this.currentInterlude) {
      const n = this.currentInterlude[1] - this.currentInterlude[0], s = this.currentTime - this.currentInterlude[0];
      if (s <= n) {
        const a = n / Math.ceil(n / this.targetBreatheDuration);
        let l = 1, i = 1;
        l *= Math.sin(1.5 * Math.PI - s / a * 2) / 10 + 1, s < 1e3 && (l *= 1 - Math.pow((1e3 - s) / 1e3, 2)), s < 500 ? i = 0 : s < 1e3 && (i *= (s - 500) / 500), n - s < 750 && (l *= 1 - G(
          (750 - (n - s)) / 750 / 2
        )), n - s < 375 && (i *= L(
          0,
          (n - s) / 375,
          1
        )), l = Math.max(0, l), e += ` scale(${l})`;
        const r = L(
          0.25,
          s * 3 / n * 0.75,
          1
        ), o = L(
          0.25,
          (s - n / 3) * 3 / n * 0.75,
          1
        ), d = L(
          0.25,
          (s - n / 3 * 2) * 3 / n * 0.75,
          1
        );
        this.dot0.style.opacity = `${L(
          0,
          Math.max(0, i * r),
          1
        )}`, this.dot1.style.opacity = `${L(
          0,
          Math.max(0, i * o),
          1
        )}`, this.dot2.style.opacity = `${L(
          0,
          Math.max(0, i * d),
          1
        )}`;
      } else
        e += " scale(0)", this.dot0.style.opacity = "0", this.dot1.style.opacity = "0", this.dot2.style.opacity = "0";
    } else
      e += " scale(0)", this.dot0.style.opacity = "0", this.dot1.style.opacity = "0", this.dot2.style.opacity = "0";
    e += ";", this.lastStyle !== e && (this.element.setAttribute("style", e), this.lastStyle = e);
  }
  dispose() {
    this.element.remove();
  }
}
class x {
  constructor(t = 0) {
    h(this, "currentPosition", 0);
    h(this, "targetPosition", 0);
    h(this, "currentTime", 0);
    h(this, "params", {});
    h(this, "currentSolver");
    h(this, "getV");
    h(this, "queueParams");
    h(this, "queuePosition");
    this.targetPosition = t, this.currentPosition = this.targetPosition, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  resetSolver() {
    const t = this.getV(this.currentTime);
    this.currentTime = 0, this.currentSolver = Y(
      this.currentPosition,
      t,
      this.targetPosition,
      0,
      this.params
    ), this.getV = j(this.currentSolver);
  }
  arrived() {
    return Math.abs(this.targetPosition - this.currentPosition) < 0.01 && this.getV(this.currentTime) < 0.01 && this.queueParams === void 0 && this.queuePosition === void 0;
  }
  setPosition(t) {
    this.targetPosition = t, this.currentPosition = t, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  update(t = 0) {
    this.currentTime += t, this.currentPosition = this.currentSolver(this.currentTime), this.queueParams && (this.queueParams.time -= t, this.queueParams.time <= 0 && this.updateParams({
      ...this.queueParams
    })), this.queuePosition && (this.queuePosition.time -= t, this.queuePosition.time <= 0 && this.setTargetPosition(this.queuePosition.position)), this.arrived() && this.setPosition(this.targetPosition);
  }
  updateParams(t, e = 0) {
    e > 0 ? this.queueParams = {
      ...t,
      time: e
    } : (this.params = {
      ...this.params,
      ...t
    }, this.resetSolver());
  }
  setTargetPosition(t, e = 0) {
    e > 0 ? this.queuePosition = {
      position: t,
      time: e
    } : (this.queuePosition = void 0, this.targetPosition = t, this.resetSolver());
  }
  getCurrentPosition() {
    return this.currentPosition;
  }
}
function Y(c, t, e, n = 0, s) {
  const a = (s == null ? void 0 : s.soft) ?? !1, l = (s == null ? void 0 : s.stiffness) ?? 100, i = (s == null ? void 0 : s.damping) ?? 10, r = (s == null ? void 0 : s.mass) ?? 1, o = e - c;
  if (a || 1 <= i / (2 * Math.sqrt(l * r))) {
    const d = -Math.sqrt(l / r), u = -d * o - t;
    return (f) => (f -= n, f < 0 ? c : e - (o + f * u) * Math.E ** (f * d));
  } else {
    const d = Math.sqrt(
      4 * r * l - i ** 2
    ), u = (i * o - 2 * r * t) / d, f = 0.5 * d / r, m = -(0.5 * i) / r;
    return (p) => (p -= n, p < 0 ? c : e - (Math.cos(p * f) * o + Math.sin(p * f) * u) * Math.E ** (p * m));
  }
}
function V(c) {
  return (e) => (c(e + 1e-3) - c(e - 1e-3)) / (2 * 1e-3);
}
function j(c) {
  return V(c);
}
const w = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;
function U(c, t = "rgba(0,0,0,1)", e = "rgba(0,0,0,0.5)") {
  const n = 2 + c, s = c / n, a = (1 - s) / 2;
  return [
    `linear-gradient(to right,${t} ${a * 100}%,${e} ${(a + s) * 100}%)`,
    s,
    n
  ];
}
function v(c) {
  return c.endTime - c.startTime >= 1e3 && c.word.length <= 7;
}
class H {
  constructor(t, e = {
    words: [],
    translatedLyric: "",
    romanLyric: "",
    startTime: 0,
    endTime: 0,
    isBG: !1,
    isDuet: !1
  }) {
    h(this, "element", document.createElement("div"));
    h(this, "left", 0);
    h(this, "top", 0);
    h(this, "scale", 1);
    h(this, "blur", 0);
    h(this, "delay", 0);
    h(this, "splittedWords", []);
    // 由 LyricPlayer 来设置
    h(this, "lineSize", [0, 0]);
    h(this, "lineTransforms", {
      posX: new x(0),
      posY: new x(0),
      scale: new x(1)
    });
    h(this, "isEnabled", !1);
    h(this, "_hide", !0);
    h(this, "lastStyle", "");
    this.lyricPlayer = t, this.lyricLine = e, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.lyricLine.isBG && this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet && this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div"));
    const n = this.element.children[0], s = this.element.children[1], a = this.element.children[2];
    n.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), s.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), a.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
  }
  enable() {
    this.isEnabled = !0, this.element.classList.add("active");
    const t = this.element.children[0];
    this.splittedWords.forEach((e) => {
      e.elementAnimations.forEach((n) => {
        n.currentTime = 0, n.playbackRate = 1, n.play();
      });
    }), t.classList.add("active");
  }
  measureSize() {
    this._hide && (this.element.style.display = "", this.element.style.visibility = "hidden");
    const t = [
      this.element.clientWidth,
      this.element.clientHeight
    ];
    return this._hide && (this.element.style.display = "none", this.element.style.visibility = ""), t;
  }
  disable() {
    this.isEnabled = !1, this.element.classList.remove("active");
    const t = this.element.children[0];
    this.splittedWords.forEach((e) => {
      e.elementAnimations.forEach((n) => {
        n.id === "float-word" && (n.playbackRate = -1, n.play());
      });
    }), t.classList.remove("active");
  }
  setLine(t) {
    this.lyricLine = t, this.lyricLine.isBG ? this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine) : this.element.classList.remove(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet ? this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine) : this.element.classList.remove(
      this.lyricPlayer.style.classes.lyricDuetLine
    ), this.rebuildElement(), this.rebuildStyle();
  }
  getLine() {
    return this.lyricLine;
  }
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
    let t = `transform:translate(${this.lineTransforms.posX.getCurrentPosition()}px,${this.lineTransforms.posY.getCurrentPosition()}px) scale(${this.lineTransforms.scale.getCurrentPosition()});`;
    !this.lyricPlayer.getEnableSpring() && this.isInSight && (t += `transition-delay:${this.delay}ms;`), t += `filter:blur(${Math.min(32, this.blur)}px);`, t !== this.lastStyle && (this.lastStyle = t, this.element.setAttribute("style", t));
  }
  rebuildElement() {
    const t = this.element.children[0], e = this.element.children[1], n = this.element.children[2];
    this.splittedWords = [], this.lyricLine.words.forEach((r) => {
      if (w.test(r.word))
        this.splittedWords.push({
          ...r,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: v(r)
        });
      else {
        const o = /(\s*)(\S*)(\s*)/.exec(r.word);
        o && (o[1].length > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: !1
        }), this.splittedWords.push({
          word: o[2],
          startTime: r.startTime,
          endTime: r.endTime,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: v(r)
        }), o[3].length > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: !1
        }));
      }
    });
    const s = [], a = [];
    function l(r) {
      for (; r.firstChild; )
        r.firstChild.nodeType === Node.ELEMENT_NODE ? s.push(t.firstChild) : r.firstChild.nodeType === Node.TEXT_NODE && a.push(t.firstChild), r.removeChild(r.firstChild), l(r.firstChild);
    }
    l(t);
    let i = null;
    this.splittedWords.forEach((r) => {
      if (r.word.trim().length > 0)
        if (r.shouldEmphasize) {
          const o = s.pop() ?? document.createElement("span");
          o.className = "emphasize", r.elements = [o];
          for (const d of r.word) {
            const u = s.pop() ?? document.createElement("span");
            u.className = "", u.innerText = d, o.appendChild(u), r.elements.push(u);
          }
          if (r.elementAnimations = this.initEmphasizeAnimation(r), console.log(r.word, w.test(r.word)), i && !w.test(r.word))
            if (i.childElementCount > 0)
              i.appendChild(o);
            else {
              const d = s.pop() ?? document.createElement("span");
              d.className = "", i.remove(), d.appendChild(i), d.appendChild(o), t.appendChild(d), i = d;
            }
          else
            i = w.test(r.word) ? null : o, t.appendChild(o);
        } else {
          const o = s.pop() ?? document.createElement("span");
          if (o.className = "", o.innerText = r.word, r.elements = [o], r.elementAnimations.push(this.initFloatAnimation(r, o)), i)
            if (i.childElementCount > 0)
              i.appendChild(o);
            else {
              const d = s.pop() ?? document.createElement("span");
              d.className = "", i.remove(), d.appendChild(i), d.appendChild(o), t.appendChild(d), i = d;
            }
          else
            i = o, t.appendChild(o);
        }
      else if (r.word.length > 0) {
        const o = a.pop() ?? document.createTextNode(" ");
        t.appendChild(o), i = null;
      } else
        i = null;
    }), e.innerText = this.lyricLine.translatedLyric, n.innerText = this.lyricLine.romanLyric;
  }
  initFloatAnimation(t, e) {
    const n = e.animate(
      [
        {
          transform: "translateY(0px)"
        },
        {
          transform: "translateY(-3%)"
        }
      ],
      {
        duration: Math.max(1e3, t.endTime - t.startTime),
        delay: t.startTime - this.lyricLine.startTime,
        id: "float-word",
        composite: "add",
        fill: "both"
      }
    );
    return n.pause(), n;
  }
  initEmphasizeAnimation(t) {
    const e = t.startTime - this.lyricLine.startTime, n = t.endTime - t.startTime;
    return t.elements.map((s, a, l) => {
      if (a === 0)
        return this.initFloatAnimation(t, s);
      {
        const i = s.animate(
          [
            {
              offset: 0,
              transform: "translate3d(0, 0px, 0px)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-line-color))"
            },
            {
              offset: 0.5,
              transform: "translate3d(0, -2%, 20px)",
              filter: "drop-shadow(0 0 0.2rem var(--amll-lyric-line-color))"
            },
            {
              offset: 1,
              transform: "translate3d(0, 0px, 0)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-line-color))"
            }
          ],
          {
            duration: Math.max(1e3, t.endTime - t.startTime),
            delay: e + n / (l.length - 1) * (a - 1),
            id: "glow-word",
            iterations: 1,
            composite: "replace",
            fill: "both"
          }
        );
        return i.pause(), i;
      }
    });
  }
  updateMaskImage() {
    this._hide && (this.element.style.display = "", this.element.style.visibility = "hidden"), this.splittedWords.forEach((t) => {
      const e = t.elements[0];
      if (e) {
        t.width = e.clientWidth, t.height = e.clientHeight;
        const [n, s, a] = U(
          16 / t.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), l = `${a * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (e.style.maskImage = n, e.style.maskOrigin = "left", e.style.maskSize = l) : (e.style.webkitMaskImage = n, e.style.webkitMaskOrigin = "left", e.style.webkitMaskSize = l);
        const i = t.width + 16, r = `clamp(${-i}px,calc(${-i}px + (var(--amll-player-time) - ${t.startTime})*${i / Math.abs(t.endTime - t.startTime)}px),0px) 0px, left top`;
        e.style.maskPosition = r, e.style.webkitMaskPosition = r;
      }
    }), this._hide && (this.element.style.display = "none", this.element.style.visibility = "");
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, e = this.top, n = this.scale, s = 1, a = 0, l = !1, i = 0) {
    this.left = t, this.top = e, this.scale = n, this.delay = i * 1e3 | 0;
    const r = this.element.children[0];
    r.style.opacity = `${s}`, l || !this.lyricPlayer.getEnableSpring() ? (this.blur = Math.min(32, a), l && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(t), this.lineTransforms.posY.setPosition(e), this.lineTransforms.scale.setPosition(n), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), l && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(t, i), this.lineTransforms.posY.setTargetPosition(e, i), this.lineTransforms.scale.setTargetPosition(n), this.blur !== Math.min(32, a) && (this.blur = Math.min(32, a), this.element.style.filter = `blur(${Math.min(32, a)}px)`));
  }
  update(t = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(t), this.lineTransforms.posY.update(t), this.lineTransforms.scale.update(t), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const t = this.lineTransforms.posX.getCurrentPosition(), e = this.lineTransforms.posY.getCurrentPosition(), n = t + this.lineSize[0], s = e + this.lineSize[1], a = this.lyricPlayer.pos[0], l = this.lyricPlayer.pos[1], i = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], r = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(t > i || e > r || n < a || s < l);
  }
  dispose() {
    this.element.remove();
  }
}
const J = O($());
class he extends EventTarget {
  constructor() {
    super();
    h(this, "element", document.createElement("div"));
    h(this, "currentTime", 0);
    h(this, "lyricLines", []);
    h(this, "processedLines", []);
    h(this, "lyricLinesEl", []);
    h(this, "lyricLinesSize", /* @__PURE__ */ new Map());
    h(this, "hotLines", /* @__PURE__ */ new Set());
    h(this, "bufferedLines", /* @__PURE__ */ new Set());
    h(this, "scrollToIndex", 0);
    h(this, "resizeObserver", new ResizeObserver((e) => {
      const n = e[0].contentRect;
      this.size[0] = n.width, this.size[1] = n.height, this.pos[0] = n.left, this.pos[1] = n.top, this.rebuildStyle(), this.calcLayout(!0), this.lyricLinesEl.forEach((s) => s.updateMaskImage());
    }));
    h(this, "posXSpringParams", {
      mass: 1,
      damping: 10,
      stiffness: 100
    });
    h(this, "posYSpringParams", {
      mass: 1,
      damping: 15,
      stiffness: 100
    });
    h(this, "scaleSpringParams", {
      mass: 1,
      damping: 20,
      stiffness: 100
    });
    h(this, "enableBlur", !0);
    h(this, "interludeDots");
    h(this, "interludeDotsSize", [0, 0]);
    h(this, "supportPlusLighter", CSS.supports("mix-blend-mode", "plus-lighter"));
    h(this, "supportMaskImage", CSS.supports("mask-image", "none"));
    h(this, "disableSpring", !1);
    h(this, "alignAnchor", 0.5);
    h(this, "size", [0, 0]);
    h(this, "pos", [0, 0]);
    h(this, "style", J.createStyleSheet({
      lyricPlayer: {
        userSelect: "none",
        padding: "1rem",
        boxSizing: "border-box",
        fontSize: "max(5vh, 12px)",
        fontWeight: "bold",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        maxWidth: "100%",
        maxHeight: "100%",
        zIndex: 1,
        color: "var(--amll-lyric-line-color)",
        mixBlendMode: "plus-lighter",
        contain: "strict"
      },
      lyricLine: {
        position: "absolute",
        transformOrigin: "left",
        maxWidth: "65%",
        padding: "max(2vh, 1rem) 1rem",
        contain: "content",
        transition: "filter 0.25s",
        margin: "max(2vh, 1rem) -1rem"
      },
      "@media (max-width: 1024px)": {
        lyricLine: {
          maxWidth: "75%",
          padding: "max(1vh, 1rem) 1rem",
          margin: "0 -1rem"
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
          backgroundColor: "var(--amll-lyric-line-color)",
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
    }));
    h(this, "onPageShow", () => {
      this.calcLayout(!0);
    });
    this.interludeDots = new X(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.style.attach(), this.interludeDots.setTransform(0, 200), window.addEventListener("pageshow", this.onPageShow);
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
  /**
   * 获取当前播放时间里是否处于间奏区间
   * 如果是则会返回单位为毫秒的始末时间
   * 否则返回 undefined
   *
   * 这个只允许内部调用
   * @returns [开始时间,结束时间] 或 undefined 如果不处于间奏区间
   */
  getCurrentInterlude() {
    var s, a, l;
    if (this.bufferedLines.size > 0)
      return;
    const e = this.currentTime + 20, n = this.scrollToIndex;
    if (n === 0) {
      if ((s = this.processedLines[0]) != null && s.startTime && this.processedLines[0].startTime > e)
        return [0, this.processedLines[0].startTime];
    } else if ((a = this.processedLines[n]) != null && a.endTime && ((l = this.processedLines[n + 1]) != null && l.startTime) && this.processedLines[n + 1].startTime > e && this.processedLines[n].endTime < e)
      return [
        this.processedLines[n].endTime,
        this.processedLines[n + 1].startTime
      ];
  }
  /**
   * 重建样式
   *
   * 这个只允许内部调用
   */
  rebuildStyle() {
    let e = "";
    e += "--amll-lyric-player-width:", e += this.element.clientWidth, e += "px;", e += "--amll-lyric-player-height:", e += this.element.clientHeight, e += "px;", e += "--amll-lyric-line-color:", e += "#FFFFFF;", e += "--amll-player-time:", e += this.currentTime, e += ";", this.element.setAttribute("style", e);
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
    const n = 750;
    this.processedLines = e.map((s, a, l) => {
      if (s.isBG)
        return {
          ...s
        };
      {
        const i = l[a - 1], r = l[a - 2];
        if (i != null && i.isBG && r) {
          if (r.endTime < s.startTime)
            return {
              ...s,
              startTime: Math.max(r.endTime, s.startTime - n) || s.startTime
            };
        } else if (i != null && i.endTime && i.endTime < s.startTime)
          return {
            ...s,
            startTime: Math.max(i == null ? void 0 : i.endTime, s.startTime - n) || s.startTime
          };
        return {
          ...s
        };
      }
    }), this.processedLines.forEach((s, a, l) => {
      const i = l[a + 1], r = s.words[s.words.length - 1];
      r && v(r) && (i ? i.startTime > s.endTime && (s.endTime = Math.min(s.endTime + 1500, i.startTime)) : s.endTime = s.endTime + 1500);
    }), this.processedLines.forEach((s, a, l) => {
      if (s.isBG)
        return;
      const i = l[a + 1];
      i != null && i.isBG && (i.startTime = Math.min(i.startTime, s.startTime));
    }), this.lyricLinesEl.forEach((s) => s.dispose()), this.lyricLinesEl = this.processedLines.map(
      (s) => new H(this, s)
    ), this.lyricLinesEl.forEach((s) => {
      this.element.appendChild(s.getElement()), s.updateMaskImage();
    }), this.setLinePosXSpringParams({}), this.setLinePosYSpringParams({}), this.setLineScaleSpringParams({}), this.setCurrentTime(0, !0), this.calcLayout(!0);
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
    var d, u, f;
    e && (this.lyricLinesEl.forEach((m) => {
      const p = m.measureSize();
      this.lyricLinesSize.set(m, p), m.lineSize = p;
    }), this.interludeDotsSize[0] = this.interludeDots.getElement().clientWidth, this.interludeDotsSize[1] = this.interludeDots.getElement().clientHeight);
    const n = 0.95;
    let a = -this.lyricLinesEl.slice(0, this.scrollToIndex).reduce(
      (m, p) => {
        var y;
        return m + (p.getLine().isBG ? 0 : ((y = this.lyricLinesSize.get(p)) == null ? void 0 : y[1]) ?? 0);
      },
      0
    );
    if (this.alignAnchor === "bottom") {
      a += this.element.clientHeight / 2;
      const m = this.lyricLinesEl[this.scrollToIndex];
      if (m) {
        const p = ((d = this.lyricLinesSize.get(m)) == null ? void 0 : d[1]) ?? 0;
        a -= p / 2;
      }
    } else if (typeof this.alignAnchor == "number") {
      a += this.element.clientHeight * this.alignAnchor;
      const m = this.lyricLinesEl[this.scrollToIndex];
      if (m) {
        const p = ((u = this.lyricLinesSize.get(m)) == null ? void 0 : u[1]) ?? 0;
        a -= p / 2;
      }
    }
    const l = this.currentTime === 0 ? void 0 : this.getCurrentInterlude();
    let i = 0;
    if (l && (i = l[1] - l[0], i >= 5e3)) {
      const m = this.currentTime === 0 ? this.lyricLinesEl[0] : this.lyricLinesEl[this.scrollToIndex + 1];
      m && (a -= ((f = this.lyricLinesSize.get(m)) == null ? void 0 : f[1]) ?? 0);
    }
    const r = Math.max(...this.bufferedLines);
    let o = 0;
    this.lyricLinesEl.forEach((m, p) => {
      var C, z, A;
      const y = this.bufferedLines.has(p), T = y || p >= this.scrollToIndex && p < r, E = m.getLine();
      let M = 0;
      E.isDuet && (M = this.size[0] - (((C = this.lyricLinesSize.get(m)) == null ? void 0 : C[0]) ?? 0)), p === this.scrollToIndex + 1 && i >= 5e3 && (this.interludeDots.setTransform(0, a), this.interludeDots.setInterlude(this.getCurrentInterlude()), a += this.interludeDotsSize[1]), m.setTransform(
        M,
        a,
        T ? 1 : n,
        y ? 1 : 1 / 3,
        this.enableBlur ? 3 * (T ? 0 : 1 + (p < this.scrollToIndex ? Math.abs(this.scrollToIndex - p) : Math.abs(p - Math.max(this.scrollToIndex, r)))) : 0,
        e,
        o
      ), E.isBG && T ? a += ((z = this.lyricLinesSize.get(m)) == null ? void 0 : z[1]) ?? 0 : E.isBG || (a += ((A = this.lyricLinesSize.get(m)) == null ? void 0 : A[1]) ?? 0), a >= 0 && (o += 0.05);
    });
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
  setCurrentTime(e, n = !1) {
    this.currentTime = e, this.element.style.setProperty("--amll-player-time", `${e}`);
    const s = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
    this.hotLines.forEach((i) => {
      const r = this.processedLines[i];
      if (!r.isBG)
        if (r) {
          const o = this.processedLines[i + 1];
          if (o != null && o.isBG) {
            const d = Math.min(r.startTime, o == null ? void 0 : o.startTime), u = Math.max(r.endTime, o == null ? void 0 : o.endTime);
            (d > e || u <= e) && (this.hotLines.delete(i), s.add(i), this.hotLines.delete(i + 1), s.add(i + 1), n && (this.lyricLinesEl[i].disable(), this.lyricLinesEl[i + 1].disable()));
          } else
            (r.startTime > e || r.endTime <= e) && (this.hotLines.delete(i), s.add(i), n && this.lyricLinesEl[i].disable());
        } else
          this.hotLines.delete(i), s.add(i), n && this.lyricLinesEl[i].disable();
    }), this.processedLines.forEach((i, r, o) => {
      var d;
      !i.isBG && i.startTime <= e && i.endTime > e && (this.hotLines.has(r) || (this.hotLines.add(r), l.add(r), n && this.lyricLinesEl[r].enable(), (d = o[r + 1]) != null && d.isBG && (this.hotLines.add(r + 1), l.add(r + 1), n && this.lyricLinesEl[r + 1].enable())));
    }), this.bufferedLines.forEach((i) => {
      this.hotLines.has(i) || (a.add(i), n && this.lyricLinesEl[i].disable());
    }), n ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (i) => i.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((i) => this.bufferedLines.add(i)), this.calcLayout(!0)) : (a.size > 0 || l.size > 0) && (a.size === 0 && l.size > 0 ? (l.forEach((i) => {
      this.bufferedLines.add(i), this.lyricLinesEl[i].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : l.size === 0 && a.size > 0 ? W(a, this.bufferedLines) && this.bufferedLines.forEach((i) => {
      this.hotLines.has(i) || (this.bufferedLines.delete(i), this.lyricLinesEl[i].disable());
    }) : (l.forEach((i) => {
      this.bufferedLines.add(i), this.lyricLinesEl[i].enable();
    }), a.forEach((i) => {
      this.bufferedLines.delete(i), this.lyricLinesEl[i].disable();
    }), this.bufferedLines.size > 0 && (this.scrollToIndex = Math.min(...this.bufferedLines))), this.calcLayout());
  }
  /**
   * 更新动画，这个函数应该被逐帧调用或者在以下情况下调用一次：
   *
   * 1. 刚刚调用完设置歌词函数的时候
   * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
   */
  update(e = 0) {
    const n = e / 1e3;
    this.interludeDots.update(e), this.lyricLinesEl.forEach((s) => s.update(n));
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
    }, this.lyricLinesEl.forEach(
      (n) => n.lineTransforms.posX.updateParams(this.posXSpringParams)
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
    }, this.lyricLinesEl.forEach(
      (n) => n.lineTransforms.posY.updateParams(this.posYSpringParams)
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
      (n) => n.lineTransforms.scale.updateParams(this.scaleSpringParams)
    );
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((e) => e.dispose()), window.removeEventListener("pageshow", this.onPageShow);
  }
}
export {
  le as BackgroundRender,
  he as LyricPlayer,
  ae as ttml
};
//# sourceMappingURL=amll-core.mjs.map
