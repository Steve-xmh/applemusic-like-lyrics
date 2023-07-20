var b = Object.defineProperty;
var S = (c, t, e) => t in c ? b(c, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : c[t] = e;
var h = (c, t, e) => (S(c, typeof t != "symbol" ? t + "" : t, e), e);
import { Container as P } from "@pixi/display";
import { Application as E } from "@pixi/app";
import { BlurFilter as f } from "@pixi/filter-blur";
import { ColorMatrixFilter as L } from "@pixi/filter-color-matrix";
import { Texture as w } from "@pixi/core";
import { Sprite as g } from "@pixi/sprite";
import { create as x } from "jss";
import v from "jss-preset-default";
class C extends P {
  constructor() {
    super(...arguments);
    h(this, "time", 0);
  }
}
class M {
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
        const [e, s, r, n] = this.curContainer.children, a = Math.max(this.app.screen.width, this.app.screen.height);
        e.position.set(this.app.screen.width / 2, this.app.screen.height / 2), s.position.set(
          this.app.screen.width / 2.5,
          this.app.screen.height / 2.5
        ), r.position.set(this.app.screen.width / 2, this.app.screen.height / 2), n.position.set(this.app.screen.width / 2, this.app.screen.height / 2), e.width = a * Math.sqrt(2), e.height = e.width, s.width = a * 0.8, s.height = s.width, r.width = a * 0.5, r.height = r.width, n.width = a * 0.25, n.height = n.width, this.curContainer.time += t * this.flowSpeed, e.rotation += t / 1e3 * this.flowSpeed, s.rotation -= t / 500 * this.flowSpeed, r.rotation += t / 1e3 * this.flowSpeed, n.rotation -= t / 750 * this.flowSpeed, r.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), r.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), n.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), n.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
      }
    });
    h(this, "flowSpeed", 2);
    h(this, "currerntRenderScale", 0.75);
    this.canvas = t;
    const e = t.getBoundingClientRect();
    this.canvas.width = e.width * this.currerntRenderScale, this.canvas.height = e.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const s = t.getBoundingClientRect();
      this.canvas.width = Math.max(1, s.width), this.canvas.height = Math.max(1, s.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.rebuildFilters();
    }), this.observer.observe(t), this.app = new E({
      view: t,
      resizeTo: this.canvas,
      powerPreference: "low-power",
      backgroundAlpha: 0
    }), this.rebuildFilters(), this.app.ticker.add(this.onTick), this.app.ticker.start();
  }
  setRenderScale(t) {
    this.currerntRenderScale = t;
    const e = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, e.width), this.canvas.height = Math.max(1, e.height), this.app.renderer.resize(
      this.canvas.width * this.currerntRenderScale,
      this.canvas.height * this.currerntRenderScale
    ), this.rebuildFilters();
  }
  rebuildFilters() {
    const t = Math.min(this.canvas.width, this.canvas.height), e = new L();
    e.saturate(1.2, !1);
    const s = new L();
    s.brightness(0.6, !1);
    const r = new L();
    r.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new f(5, 1)), this.app.stage.filters.push(new f(10, 1)), this.app.stage.filters.push(new f(20, 2)), this.app.stage.filters.push(new f(40, 2)), t > 512 && this.app.stage.filters.push(new f(80, 2)), t > 768 && this.app.stage.filters.push(new f(160, 4)), t > 768 * 2 && this.app.stage.filters.push(new f(320, 4)), this.app.stage.filters.push(e, s, r), this.app.stage.filters.push(new f(5, 1));
  }
  setFPS(t) {
    this.app.ticker.maxFPS = t;
  }
  pause() {
    this.app.ticker.stop(), this.app.render();
  }
  resume() {
    this.app.ticker.start();
  }
  async setAlbumImage(t) {
    const e = await w.fromURL(t), s = new C(), r = new g(e), n = new g(e), a = new g(e), i = new g(e);
    r.anchor.set(0.5, 0.5), n.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), i.anchor.set(0.5, 0.5), r.rotation = Math.random() * Math.PI * 2, n.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, i.rotation = Math.random() * Math.PI * 2, s.addChild(r, n, a, i), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = s, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class U extends M {
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
const z = (c, t) => c.size === t.size && [...c].every((e) => t.has(e));
class I {
  constructor(t) {
    h(this, "element", document.createElement("div"));
    h(this, "dot0", document.createElement("span"));
    h(this, "dot1", document.createElement("span"));
    h(this, "dot2", document.createElement("span"));
    this.lyricPlayer = t, this.element.className = t.style.classes.interludeDots, this.dot0.innerText = "·", this.dot1.innerText = "·", this.dot2.innerText = "·", this.element.appendChild(this.dot0), this.element.appendChild(this.dot1), this.element.appendChild(this.dot2);
  }
  getElement() {
    return this.element;
  }
  dispose() {
    this.element.remove();
  }
}
class T {
  constructor(t = 0) {
    h(this, "currentPosition", 0);
    h(this, "targetPosition", 0);
    h(this, "currentTime", 0);
    h(this, "params", {});
    h(this, "currentSolver");
    h(this, "getV");
    h(this, "queueParams", []);
    h(this, "queuePosition", []);
    this.targetPosition = t, this.currentPosition = this.targetPosition, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  resetSolver() {
    const t = this.getV(this.currentTime);
    this.currentTime = 0, this.currentSolver = B(
      this.currentPosition,
      t,
      this.targetPosition,
      0,
      this.params
    ), this.getV = D(this.currentSolver);
  }
  setPosition(t) {
    this.targetPosition = t, this.currentPosition = t, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  update(t = 0) {
    this.currentTime += t, this.currentPosition = this.currentSolver(this.currentTime);
    const e = this.queueParams[0];
    e && (this.queueParams.forEach((r) => {
      r.time -= t;
    }), e.time <= 0 && (this.updateParams({
      mass: e.mass,
      damping: e.damping,
      stiffness: e.stiffness,
      soft: e.soft
    }), this.queueParams.shift()));
    const s = this.queuePosition[0];
    s && (this.queuePosition.forEach((r) => {
      r.time -= t;
    }), s.time <= 0 && (this.setTargetPosition(s.position), this.queuePosition.shift()));
  }
  updateParams(t, e = 0) {
    e > 0 ? (this.queueParams = this.queueParams.filter((s) => s.time < e), this.queueParams.push({
      ...t,
      time: e
    })) : (this.params = {
      ...this.params,
      ...t
    }, this.resetSolver());
  }
  setTargetPosition(t, e = 0) {
    e > 0 ? (this.queuePosition = this.queuePosition.filter((s) => s.time < e), this.queuePosition.push({
      position: t,
      time: e
    })) : (this.targetPosition = t, this.resetSolver());
  }
  getCurrentPosition() {
    return this.currentPosition;
  }
}
function B(c, t, e, s = 0, r) {
  const n = r.soft ?? !1, a = r.stiffness ?? 100, i = r.damping ?? 10, l = r.mass ?? 1, m = e - c;
  if (n || 1 <= i / (2 * Math.sqrt(a * l))) {
    const o = -Math.sqrt(a / l), d = -o * m - t;
    return (p) => (p -= s, p < 0 ? c : e - (m + p * d) * Math.E ** (p * o));
  } else {
    const o = Math.sqrt(
      4 * l * a - i ** 2
    ), d = (i * m - 2 * l * t) / o, p = 0.5 * o / l, y = -(0.5 * i) / l;
    return (u) => (u -= s, u < 0 ? c : e - (Math.cos(u * p) * m + Math.sin(u * p) * d) * Math.E ** (u * y));
  }
}
function k(c) {
  return (e) => (c(e + 1e-3) - c(e - 1e-3)) / (2 * 1e-3);
}
function D(c) {
  return k(c);
}
const A = /^([\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?)+$/u;
function q(c, t = "rgba(0,0,0,1)", e = "rgba(0,0,0,0.5)") {
  const s = 2 + c, r = c / s, n = (1 - r) / 2;
  return [
    `linear-gradient(to right,${t} ${n * 100}%,${e} ${(n + r) * 100}%)`,
    r,
    s
  ];
}
class R {
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
    h(this, "currentTime", 0);
    h(this, "left", 0);
    h(this, "top", 0);
    h(this, "scale", 1);
    h(this, "blur", 0);
    h(this, "delay", 0);
    h(this, "splittedWords", []);
    // 由 LyricPlayer 来设置
    h(this, "lineSize", [0, 0]);
    h(this, "lineTransforms", {
      posX: new T(0),
      posY: new T(0),
      scale: new T(1)
    });
    h(this, "_hide", !0);
    h(this, "lastStyle", "");
    this.lyricPlayer = t, this.lyricLine = e, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.lyricLine.isBG && this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet && this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div"));
    const s = this.element.children[0], r = this.element.children[1], n = this.element.children[2];
    s.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), r.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), n.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
  }
  enable() {
    this.element.classList.add("active"), this.element.children[0].classList.add("active");
  }
  disable() {
    this.element.classList.remove("active"), this.element.children[0].classList.remove("active");
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
      this.lastStyle !== "visibility:hidden;transform:translate(0,-10000px);" && (this.lastStyle = "visibility:hidden;transform:translate(0,-10000px);", this.element.setAttribute(
        "style",
        "visibility:hidden;transform:translate(0,-10000px);"
      ));
      return;
    }
    let t = `transform:translate(${this.lineTransforms.posX.getCurrentPosition()}px,${this.lineTransforms.posY.getCurrentPosition()}px) scale(${this.lineTransforms.scale.getCurrentPosition()});`;
    this.lyricPlayer.disableSpring && this.isInSight && (t += `transition-delay:${this.delay}ms;`), t += `filter:blur(${this.blur}px);`, t !== this.lastStyle && (this.lastStyle = t, this.element.setAttribute("style", t));
  }
  rebuildElement() {
    const t = this.element.children[0], e = this.element.children[1], s = this.element.children[2];
    for (this.splittedWords = [], this.lyricLine.words.forEach((n) => {
      if (A.test(n.word))
        this.splittedWords.push(
          ...n.word.split("").map((a, i, l) => ({
            word: a,
            startTime: n.startTime + i * (n.endTime - n.startTime) / l.length,
            endTime: n.startTime + (i + 1) * (n.endTime - n.startTime) / l.length,
            width: 0,
            height: 0
          }))
        );
      else {
        const a = /(\s*)(\S*)(\s*)/.exec(n.word);
        a && (a[1].length > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0
        }), this.splittedWords.push({
          word: a[2],
          startTime: n.startTime,
          endTime: n.endTime,
          width: 0,
          height: 0
        }), a[3].length > 0 && this.splittedWords.push({
          word: " ",
          startTime: 0,
          endTime: 0,
          width: 0,
          height: 0
        }));
      }
    }); t.hasChildNodes(); )
      t.removeChild(t.firstChild);
    let r = null;
    this.splittedWords.forEach((n) => {
      if (n.word.trim().length > 0) {
        const a = document.createElement("span");
        if (a.innerText = n.word, n.element = a, r)
          if (r.childElementCount > 0)
            r.appendChild(a);
          else {
            const i = document.createElement("span");
            r.remove(), i.appendChild(r), i.appendChild(a), t.appendChild(i), r = i;
          }
        else
          r = a, t.appendChild(a);
      } else if (n.word.length > 0) {
        const a = document.createTextNode(" ");
        t.appendChild(a), r = null;
      } else
        r = null;
    }), e.innerText = this.lyricLine.translatedLyric, s.innerText = this.lyricLine.romanLyric;
  }
  updateMaskImage() {
    this.element.children[0], this.splittedWords.forEach((t, e) => {
      const s = t.element;
      if (s) {
        t.width = s.clientWidth, t.height = s.clientHeight;
        const [r, n, a] = q(
          16 / t.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), i = `${a * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (s.style.maskImage = r, s.style.maskOrigin = "left", s.style.maskSize = i) : (s.style.webkitMaskImage = r, s.style.webkitMaskOrigin = "left", s.style.webkitMaskSize = i);
        const l = t.width + 16, m = `clamp(${-l}px,calc(${-l}px + (var(--amll-player-time) - ${t.startTime})*${l / Math.abs(t.endTime - t.startTime)}px),0px) 0px, left top`;
        s.style.maskPosition = m, s.style.webkitMaskPosition = m;
      }
    });
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, e = this.top, s = this.scale, r = 1, n = 0, a = !1, i = 0) {
    this.left = t, this.top = e, this.scale = s, this.blur = n, this.delay = i * 1e3 | 0;
    const l = this.element.children[0];
    l.style.opacity = `${r}`, a || this.lyricPlayer.disableSpring ? (a && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(t), this.lineTransforms.posY.setPosition(e), this.lineTransforms.scale.setPosition(s), this.lyricPlayer.disableSpring ? this.show() : this.rebuildStyle(), a && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(t, i), this.lineTransforms.posY.setTargetPosition(e, i), this.lineTransforms.scale.setTargetPosition(s), this.element.style.filter = `blur(${n}px)`);
  }
  update(t = 0) {
    this.lyricPlayer.disableSpring || (this.lineTransforms.posX.update(t), this.lineTransforms.posY.update(t), this.lineTransforms.scale.update(t), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const t = this.lineTransforms.posX.getCurrentPosition(), e = this.lineTransforms.posY.getCurrentPosition(), s = t + this.lineSize[0], r = e + this.lineSize[1], n = this.lyricPlayer.pos[0], a = this.lyricPlayer.pos[1], i = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], l = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(t > i || e > l || s < n || r < a);
  }
  dispose() {
    this.element.remove();
  }
}
const W = x(v());
class j extends EventTarget {
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
      const s = e[0].contentRect;
      this.size[0] = s.width, this.size[1] = s.height, this.pos[0] = s.left, this.pos[1] = s.top, this.rebuildStyle(), this.calcLayout(!0), this.lyricLinesEl.forEach((r) => r.updateMaskImage());
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
    h(this, "style", W.createStyleSheet({
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
        padding: "2vh 0",
        contain: "content",
        transition: "filter 0.25s"
      },
      "@media (max-width: 1024px)": {
        lyricLine: {
          maxWidth: "75%",
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
          opacity: 1
        }
      },
      lyricMainLine: {
        transition: "opacity 0.3s 0.25s",
        "& span": {
          display: "inline-block",
          whiteSpace: "pre-wrap"
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
        fontSize: "max(150%, 10px)",
        transformOrigin: "left",
        width: "fit-content",
        position: "absolute",
        opacity: 0.25
      },
      "@supports (mix-blend-mode: plus-lighter)": {
        lyricMainLine: {
          // opacity: 0.15,
          // "&.active": {
          // 	opacity: 0.75,
          // },
        },
        lyricSubLine: {
          opacity: 0.3
        }
      },
      tmpDisableTransition: {
        transition: "none !important"
      }
    }));
    this.interludeDots = new I(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.style.attach();
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
   * 获取当前播放时间里是否处于间奏区间
   * 如果是则会返回单位为毫秒的始末时间
   * 否则返回 undefined
   * @returns [开始时间,结束时间] 或 undefined 如果不处于间奏区间
   */
  getCurrentInterlude() {
    var s, r, n;
    if (this.bufferedLines.size > 0)
      return;
    const e = this.scrollToIndex;
    if (e === 0) {
      if ((s = this.processedLines[0]) != null && s.startTime && this.processedLines[0].startTime > this.currentTime)
        return [0, this.processedLines[0].startTime];
    } else if ((r = this.processedLines[e]) != null && r.endTime && ((n = this.processedLines[e + 1]) != null && n.startTime) && this.processedLines[e + 1].startTime > this.currentTime && this.processedLines[e].endTime < this.currentTime)
      return [
        this.processedLines[e].endTime,
        this.processedLines[e + 1].startTime
      ];
  }
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
    const s = 750;
    this.processedLines = e.map((r, n, a) => {
      if (r.isBG)
        return {
          ...r
        };
      {
        const i = a[n - 1], l = a[n - 2];
        if (i != null && i.isBG && l) {
          if (l.endTime < r.startTime)
            return {
              ...r,
              startTime: Math.max(l.endTime, r.startTime - s) || r.startTime
            };
        } else if (i != null && i.endTime && i.endTime < r.startTime)
          return {
            ...r,
            startTime: Math.max(i == null ? void 0 : i.endTime, r.startTime - s) || r.startTime
          };
        return {
          ...r
        };
      }
    }), this.lyricLinesEl.forEach((r) => r.dispose()), this.lyricLinesEl = this.processedLines.map(
      (r) => new R(this, r)
    ), this.lyricLinesEl.forEach(
      (r) => (this.element.appendChild(r.getElement()), r.updateMaskImage())
    ), this.setLinePosXSpringParams({}), this.setLinePosYSpringParams({}), this.setLineScaleSpringParams({}), this.calcLayout(!0);
  }
  calcLayout(e = !1) {
    e && (this.lyricLinesEl.forEach((o) => {
      const d = [
        o.getElement().clientWidth,
        o.getElement().clientHeight
      ];
      this.lyricLinesSize.set(o, d), o.lineSize = d;
    }), this.interludeDotsSize[0] = this.interludeDots.getElement().clientWidth, this.interludeDotsSize[1] = this.interludeDots.getElement().clientHeight);
    const s = 0.95;
    let n = -this.lyricLinesEl.slice(0, this.scrollToIndex).reduce(
      (o, d) => o + (d.getLine().isBG ? 0 : this.lyricLinesSize.get(d)[1]),
      0
    );
    if (this.alignAnchor === "bottom") {
      n += this.element.clientHeight / 2;
      const o = this.lyricLinesEl[this.scrollToIndex];
      if (o) {
        const d = this.lyricLinesSize.get(o)[1];
        n -= d / 2;
      }
    } else if (typeof this.alignAnchor == "number") {
      n += this.element.clientHeight * this.alignAnchor;
      const o = this.lyricLinesEl[this.scrollToIndex];
      if (o) {
        const d = this.lyricLinesSize.get(o)[1];
        n -= d / 2;
      }
    }
    const a = this.currentTime === 0 ? void 0 : this.getCurrentInterlude();
    let i = 0;
    if (a && (i = a[1] - a[0], i >= 5e3)) {
      const o = this.currentTime === 0 ? this.lyricLinesEl[0] : this.lyricLinesEl[this.scrollToIndex + 1];
      o && (n -= this.lyricLinesSize.get(o)[1]);
    }
    const l = Math.max(...this.bufferedLines);
    let m = 0;
    this.lyricLinesEl.forEach((o, d) => {
      const p = this.bufferedLines.has(d) || d >= this.scrollToIndex && d < l, y = o.getLine();
      let u = 0;
      y.isDuet && (u = this.size[0] - this.lyricLinesSize.get(o)[0]), d === this.scrollToIndex + 1 && i >= 5e3 && (n += this.interludeDotsSize[1]), o.setTransform(
        u,
        n,
        p ? 1 : s,
        !p && d <= this.scrollToIndex ? 1 / 3 : 1,
        this.enableBlur ? 3 * (p ? 0 : 1 + (d < this.scrollToIndex ? Math.abs(this.scrollToIndex - d) : Math.abs(d - Math.max(this.scrollToIndex, l)))) : 0,
        e,
        m
      ), y.isBG && p ? n += this.lyricLinesSize.get(o)[1] : y.isBG || (n += this.lyricLinesSize.get(o)[1]), n >= 0 && (m += 0.05);
    });
  }
  getCurrentTime() {
    return this.currentTime;
  }
  getLyrics() {
    return this.lyricLines;
  }
  getElement() {
    return this.element;
  }
  /**
   * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
   * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
   *
   * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
   * @param time 当前播放进度，单位为毫秒
   */
  setCurrentTime(e, s = !1) {
    this.currentTime = e, this.element.style.setProperty("--amll-player-time", `${e}`);
    const r = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
    this.hotLines.forEach((i) => {
      const l = this.processedLines[i];
      if (!l.isBG)
        if (l) {
          const m = this.processedLines[i + 1];
          if (m != null && m.isBG) {
            const o = Math.min(l.startTime, m == null ? void 0 : m.startTime), d = Math.max(l.endTime, m == null ? void 0 : m.endTime);
            (o > e || d <= e) && (this.hotLines.delete(i), r.add(i), this.hotLines.delete(i + 1), r.add(i + 1), s && (this.lyricLinesEl[i].disable(), this.lyricLinesEl[i + 1].disable()));
          } else
            (l.startTime > e || l.endTime <= e) && (this.hotLines.delete(i), r.add(i), s && this.lyricLinesEl[i].disable());
        } else
          this.hotLines.delete(i), r.add(i), s && this.lyricLinesEl[i].disable();
    }), this.bufferedLines.forEach((i) => {
      this.hotLines.has(i) || (this.bufferedLines.delete(i), n.add(i), s && this.lyricLinesEl[i].disable());
    }), this.processedLines.forEach((i, l, m) => {
      var o;
      !i.isBG && i.startTime <= e && i.endTime > e && (this.hotLines.has(l) || (this.hotLines.add(l), a.add(l), s && this.lyricLinesEl[l].enable(), (o = m[l + 1]) != null && o.isBG && (this.hotLines.add(l + 1), a.add(l + 1), s && this.lyricLinesEl[l + 1].enable())));
    }), s ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (i) => i.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((i) => this.bufferedLines.add(i)), this.calcLayout(!0)) : (n.size > 0 || a.size > 0) && (n.size === 0 && a.size > 0 ? (a.forEach((i) => {
      this.bufferedLines.add(i), this.lyricLinesEl[i].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : a.size === 0 && n.size > 0 ? z(n, this.bufferedLines) && this.bufferedLines.forEach((i) => {
      this.hotLines.has(i) || (this.bufferedLines.delete(i), this.lyricLinesEl[i].disable());
    }) : (a.forEach((i) => {
      this.bufferedLines.add(i), this.lyricLinesEl[i].enable();
    }), n.forEach((i) => {
      this.bufferedLines.delete(i), this.lyricLinesEl[i].disable();
    }), this.bufferedLines.size > 0 && (this.scrollToIndex = Math.min(...this.bufferedLines))), this.calcLayout());
  }
  /**
   * 更新动画，这个函数应该被逐帧调用
   * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
   */
  update(e = 0) {
    e /= 1e3, this.lyricLinesEl.forEach((s) => s.update(e));
  }
  setLinePosXSpringParams(e) {
    this.posXSpringParams = {
      ...this.posXSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (s) => s.lineTransforms.posX.updateParams(this.posXSpringParams)
    );
  }
  setLinePosYSpringParams(e) {
    this.posYSpringParams = {
      ...this.posYSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (s) => s.lineTransforms.posY.updateParams(this.posYSpringParams)
    );
  }
  setLineScaleSpringParams(e) {
    this.scaleSpringParams = {
      ...this.scaleSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (s) => s.lineTransforms.scale.updateParams(this.scaleSpringParams)
    );
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((e) => e.dispose());
  }
}
export {
  U as BackgroundRender,
  j as LyricPlayer
};
