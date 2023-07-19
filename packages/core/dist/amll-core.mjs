var S = Object.defineProperty;
var T = (c, t, e) => t in c ? S(c, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : c[t] = e;
var a = (c, t, e) => (T(c, typeof t != "symbol" ? t + "" : t, e), e);
import { Application as w, ColorMatrixFilter as g, BlurFilter as u, Texture as E, Sprite as y, Container as x } from "pixi.js";
import b from "jss";
import v from "jss-preset-default";
class M extends x {
  constructor() {
    super(...arguments);
    a(this, "time", 0);
  }
}
class C {
  constructor(t) {
    a(this, "observer");
    a(this, "app");
    a(this, "curContainer");
    a(this, "lastContainer", /* @__PURE__ */ new Set());
    a(this, "onTick", (t) => {
      for (const e of this.lastContainer)
        e.alpha = Math.max(0, e.alpha - t / 60), e.alpha <= 0 && (this.app.stage.removeChild(e), this.lastContainer.delete(e));
      if (this.curContainer) {
        this.curContainer.alpha = Math.min(
          1,
          this.curContainer.alpha + t / 60
        );
        const [e, r, i, n] = this.curContainer.children, l = Math.max(this.app.screen.width, this.app.screen.height);
        e.position.set(this.app.screen.width / 2, this.app.screen.height / 2), r.position.set(
          this.app.screen.width / 2.5,
          this.app.screen.height / 2.5
        ), i.position.set(this.app.screen.width / 2, this.app.screen.height / 2), n.position.set(this.app.screen.width / 2, this.app.screen.height / 2), e.width = l * Math.sqrt(2), e.height = e.width, r.width = l * 0.8, r.height = r.width, i.width = l * 0.5, i.height = i.width, n.width = l * 0.25, n.height = n.width, this.curContainer.time += t, e.rotation += t / 1e3, r.rotation -= t / 500, i.rotation += t / 1e3, n.rotation -= t / 750, i.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), i.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), n.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), n.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
      }
    });
    a(this, "currerntRenderScale", 0.75);
    this.canvas = t;
    const e = t.getBoundingClientRect();
    this.canvas.width = e.width * this.currerntRenderScale, this.canvas.height = e.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const r = t.getBoundingClientRect();
      this.canvas.width = Math.max(1, r.width), this.canvas.height = Math.max(1, r.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.rebuildFilters();
    }), this.observer.observe(t), this.app = new w({
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
    const t = Math.min(this.canvas.width, this.canvas.height), e = new g();
    e.saturate(1.2, !1);
    const r = new g();
    r.brightness(0.6, !1);
    const i = new g();
    i.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new u(5, 1)), this.app.stage.filters.push(new u(10, 1)), this.app.stage.filters.push(new u(20, 2)), this.app.stage.filters.push(new u(40, 2)), t > 512 && this.app.stage.filters.push(new u(80, 2)), t > 768 && this.app.stage.filters.push(new u(160, 4)), t > 768 * 2 && this.app.stage.filters.push(new u(320, 4)), this.app.stage.filters.push(e, r, i), this.app.stage.filters.push(new u(5, 1));
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
    const e = await E.fromURL(t), r = new M(), i = new y(e), n = new y(e), l = new y(e), s = new y(e);
    i.anchor.set(0.5, 0.5), n.anchor.set(0.5, 0.5), l.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), i.rotation = Math.random() * Math.PI * 2, n.rotation = Math.random() * Math.PI * 2, l.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, r.addChild(i, n, l, s), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = r, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class G extends C {
  constructor() {
    const e = document.createElement("canvas");
    super(e);
    a(this, "element");
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
class B {
  constructor(t) {
    a(this, "element", document.createElement("div"));
    a(this, "dot0", document.createElement("div"));
    a(this, "dot1", document.createElement("div"));
    a(this, "dot2", document.createElement("div"));
    this.lyricPlayer = t, this.element.className = t.style.classes.interludeDots, this.element.appendChild(this.dot0), this.element.appendChild(this.dot1), this.element.appendChild(this.dot2);
  }
  getElement() {
    return this.element;
  }
  dispose() {
    this.element.remove();
  }
}
class L {
  constructor(t = 0) {
    a(this, "currentPosition", 0);
    a(this, "targetPosition", 0);
    a(this, "currentTime", 0);
    a(this, "params", {});
    a(this, "currentSolver");
    a(this, "getV");
    a(this, "queueParams", []);
    a(this, "queuePosition", []);
    this.targetPosition = t, this.currentPosition = this.targetPosition, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  resetSolver() {
    const t = this.getV(this.currentTime);
    this.currentTime = 0, this.currentSolver = I(
      this.currentPosition,
      t,
      this.targetPosition,
      0,
      this.params
    ), this.getV = A(this.currentSolver);
  }
  setPosition(t) {
    this.targetPosition = t, this.currentPosition = t, this.currentSolver = () => this.targetPosition, this.getV = () => 0;
  }
  update(t = 0) {
    this.currentTime += t, this.currentPosition = this.currentSolver(this.currentTime);
    const e = this.queueParams[0];
    e && (this.queueParams.forEach((i) => {
      i.time -= t;
    }), e.time <= 0 && (this.updateParams({
      mass: e.mass,
      damping: e.damping,
      stiffness: e.stiffness,
      soft: e.soft
    }), this.queueParams.shift()));
    const r = this.queuePosition[0];
    r && (this.queuePosition.forEach((i) => {
      i.time -= t;
    }), r.time <= 0 && (this.setTargetPosition(r.position), this.queuePosition.shift()));
  }
  updateParams(t, e = 0) {
    e > 0 ? (this.queueParams = this.queueParams.filter((r) => r.time < e), this.queueParams.push({
      ...t,
      time: e
    })) : (this.params = {
      ...this.params,
      ...t
    }, this.resetSolver());
  }
  setTargetPosition(t, e = 0) {
    e > 0 ? (this.queuePosition = this.queuePosition.filter((r) => r.time < e), this.queuePosition.push({
      position: t,
      time: e
    })) : (this.targetPosition = t, this.resetSolver());
  }
  getCurrentPosition() {
    return this.currentPosition;
  }
}
function I(c, t, e, r = 0, i) {
  const n = i.soft ?? !1, l = i.stiffness ?? 100, s = i.damping ?? 10, h = i.mass ?? 1, o = e - c;
  if (n || 1 <= s / (2 * Math.sqrt(l * h))) {
    const d = -Math.sqrt(l / h), m = -d * o - t;
    return (p) => (p -= r, p < 0 ? c : e - (o + p * m) * Math.E ** (p * d));
  } else {
    const d = Math.sqrt(
      4 * h * l - s ** 2
    ), m = (s * o - 2 * h * t) / d, p = 0.5 * d / h, P = -(0.5 * s) / h;
    return (f) => (f -= r, f < 0 ? c : e - (Math.cos(f * p) * o + Math.sin(f * p) * m) * Math.E ** (f * P));
  }
}
function k(c) {
  return (e) => (c(e + 1e-3) - c(e - 1e-3)) / (2 * 1e-3);
}
function A(c) {
  return k(c);
}
const q = /^([\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?)+$/u;
function R(c, t = "rgba(0,0,0,1)", e = "rgba(0,0,0,0.5)") {
  const r = 2 + c, i = c / r, n = (1 - i) / 2;
  return [
    `linear-gradient(to right,${t} ${n * 100}%,${e} ${(n + i) * 100}%)`,
    i,
    r
  ];
}
class $ {
  constructor(t, e = {
    words: [],
    translatedLyric: "",
    romanLyric: "",
    startTime: 0,
    endTime: 0,
    isBG: !1,
    isDuet: !1
  }) {
    a(this, "element", document.createElement("div"));
    a(this, "currentTime", 0);
    a(this, "left", 0);
    a(this, "top", 0);
    a(this, "scale", 1);
    a(this, "blur", 0);
    a(this, "delay", 0);
    a(this, "splittedWords", []);
    // 由 LyricPlayer 来设置
    a(this, "lineSize", [0, 0]);
    a(this, "lineTransforms", {
      posX: new L(0),
      posY: new L(0),
      scale: new L(1)
    });
    a(this, "_hide", !0);
    a(this, "lastStyle", "");
    this.lyricPlayer = t, this.lyricLine = e, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.lyricLine.isBG && this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet && this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div"));
    const r = this.element.children[0], i = this.element.children[1], n = this.element.children[2];
    r.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), i.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), n.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
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
    const t = this.element.children[0], e = this.element.children[1], r = this.element.children[2];
    for (this.splittedWords = [], this.lyricLine.words.forEach((i) => {
      q.test(i.word) ? this.splittedWords = this.splittedWords.concat(
        i.word.split("").map((n, l, s) => ({
          word: n,
          startTime: i.startTime + l * (i.endTime - i.startTime) / s.length,
          endTime: i.startTime + (l + 1) * (i.endTime - i.startTime) / s.length,
          width: 0,
          height: 0
        }))
      ) : this.splittedWords.push({
        ...i,
        width: 0,
        height: 0
      });
    }); this.splittedWords.length > t.childElementCount; )
      t.appendChild(document.createElement("span"));
    for (let i = 0; i < Math.max(t.childElementCount, this.splittedWords.length); i++) {
      const n = this.splittedWords[i], l = t.children[i];
      n ? l.innerText = n.word : l.innerText = "";
    }
    e.innerText = this.lyricLine.translatedLyric, r.innerText = this.lyricLine.romanLyric;
  }
  updateMaskImage() {
    var e, r;
    const t = this.element.children[0];
    for (let i = 0; i < Math.max(t.childElementCount, this.splittedWords.length); i++) {
      const n = this.splittedWords[i], l = t.children[i];
      if (((r = (e = n == null ? void 0 : n.word) == null ? void 0 : e.trim()) == null ? void 0 : r.length) > 0) {
        n.width = l.clientWidth, n.height = l.clientHeight;
        const [s, h, o] = R(
          16 / n.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), d = `${o * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (l.style.maskImage = s, l.style.maskOrigin = "left", l.style.maskSize = d) : (l.style.webkitMaskImage = s, l.style.webkitMaskOrigin = "left", l.style.webkitMaskSize = d);
        const m = n.width + 16, p = `clamp(${-m}px,calc(${-m}px + (var(--amll-player-time) - ${n.startTime})*${m / Math.abs(n.endTime - n.startTime)}px),0px) 0px, left top`;
        l.style.maskPosition = p, l.style.webkitMaskPosition = p;
      }
    }
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, e = this.top, r = this.scale, i = 1, n = 0, l = !1, s = 0) {
    this.left = t, this.top = e, this.scale = r, this.blur = n, this.delay = s * 1e3 | 0;
    const h = this.element.children[0];
    h.style.opacity = `${i}`, l || this.lyricPlayer.disableSpring ? (l && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(t), this.lineTransforms.posY.setPosition(e), this.lineTransforms.scale.setPosition(r), this.lyricPlayer.disableSpring ? this.show() : this.rebuildStyle(), l && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(t, s), this.lineTransforms.posY.setTargetPosition(e, s), this.lineTransforms.scale.setTargetPosition(r), this.element.style.filter = `blur(${n}px)`);
  }
  update(t = 0) {
    this.lyricPlayer.disableSpring || (this.lineTransforms.posX.update(t), this.lineTransforms.posY.update(t), this.lineTransforms.scale.update(t), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const t = this.lineTransforms.posX.getCurrentPosition(), e = this.lineTransforms.posY.getCurrentPosition(), r = t + this.lineSize[0], i = e + this.lineSize[1], n = this.lyricPlayer.pos[0], l = this.lyricPlayer.pos[1], s = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], h = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(t > s || e > h || r < n || i < l);
  }
  dispose() {
    this.element.remove();
  }
}
b.setup(v());
class Y extends EventTarget {
  constructor() {
    super();
    a(this, "element", document.createElement("div"));
    a(this, "currentTime", 0);
    a(this, "lyricLines", []);
    a(this, "processedLines", []);
    a(this, "lyricLinesEl", []);
    a(this, "lyricLinesSize", /* @__PURE__ */ new Map());
    a(this, "hotLines", /* @__PURE__ */ new Set());
    a(this, "bufferedLines", /* @__PURE__ */ new Set());
    a(this, "scrollToIndex", 0);
    a(this, "resizeObserver", new ResizeObserver((e) => {
      const r = e[0].contentRect;
      this.size = [r.width, r.height], this.pos = [r.left, r.top], this.rebuildStyle(), this.calcLayout(!0), this.lyricLinesEl.forEach((i) => i.updateMaskImage());
    }));
    a(this, "enableBlur", !0);
    a(this, "size", [0, 0]);
    a(this, "pos", [0, 0]);
    a(this, "interludeDots");
    a(this, "supportPlusLighter", CSS.supports("mix-blend-mode", "plus-lighter"));
    a(this, "supportMaskImage", CSS.supports("mask-image", "none"));
    a(this, "disableSpring", !1);
    a(this, "alignAnchor", 0.5);
    a(this, "style", b.createStyleSheet({
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
        padding: "2vh",
        contain: "content",
        transition: "filter 0.25s"
      },
      "@media (max-width: 1024px)": {
        lyricLine: {
          maxWidth: "75%",
          padding: "1vh"
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
        "& > *": {
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
        fontSize: "max(50%, 10px)",
        opacity: 0.5,
        "& > *": {
          content: '"*"'
        }
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
    a(this, "posXSpringParams", {
      mass: 1,
      damping: 10,
      stiffness: 100
    });
    a(this, "posYSpringParams", {
      mass: 1,
      damping: 15,
      stiffness: 100
    });
    a(this, "scaleSpringParams", {
      mass: 1,
      damping: 20,
      stiffness: 100
    });
    this.interludeDots = new B(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.style.attach();
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
    const r = 750;
    this.processedLines = e.map((i, n, l) => {
      if (i.isBG)
        return {
          ...i
        };
      {
        const s = l[n - 1], h = l[n - 2];
        if (s != null && s.isBG && h) {
          if (h.endTime < i.startTime)
            return {
              ...i,
              startTime: Math.max(h.endTime, i.startTime - r) || i.startTime
            };
        } else if (s != null && s.endTime && s.endTime < i.startTime)
          return {
            ...i,
            startTime: Math.max(s == null ? void 0 : s.endTime, i.startTime - r) || i.startTime
          };
        return {
          ...i
        };
      }
    }), this.lyricLinesEl.forEach((i) => i.dispose()), this.lyricLinesEl = this.processedLines.map(
      (i) => new $(this, i)
    ), this.lyricLinesEl.forEach(
      (i) => (this.element.appendChild(i.getElement()), i.updateMaskImage())
    ), this.setLinePosXSpringParams({}), this.setLinePosYSpringParams({}), this.setLineScaleSpringParams({}), this.calcLayout(!0);
  }
  calcLayout(e = !1) {
    e && this.lyricLinesEl.forEach((h) => {
      const o = [
        h.getElement().clientWidth,
        h.getElement().clientHeight
      ];
      this.lyricLinesSize.set(h, o), h.lineSize = o;
    });
    const r = 0.95;
    let n = -this.lyricLinesEl.slice(0, this.scrollToIndex).reduce(
      (h, o) => h + (o.getLine().isBG ? 0 : this.lyricLinesSize.get(o)[1]),
      0
    );
    if (this.alignAnchor === "bottom") {
      n += this.element.clientHeight / 2;
      const h = this.lyricLinesEl[this.scrollToIndex];
      if (h) {
        const o = this.lyricLinesSize.get(h)[1];
        n -= o / 2;
      }
    } else if (typeof this.alignAnchor == "number") {
      n += this.element.clientHeight * this.alignAnchor;
      const h = this.lyricLinesEl[this.scrollToIndex];
      if (h) {
        const o = this.lyricLinesSize.get(h)[1];
        n -= o;
      }
    }
    const l = Math.max(...this.bufferedLines);
    let s = 0;
    this.lyricLinesEl.forEach((h, o) => {
      const d = this.bufferedLines.has(o) || o >= this.scrollToIndex && o < l, m = h.getLine();
      let p = 0;
      m.isDuet && (p = this.size[0] - this.lyricLinesSize.get(h)[0]), h.setTransform(
        p,
        n,
        d ? 1 : r,
        !d && o <= this.scrollToIndex ? 1 / 3 : 1,
        this.enableBlur ? 3 * (d ? 0 : 1 + (o < this.scrollToIndex ? Math.abs(this.scrollToIndex - o) : Math.abs(o - Math.max(this.scrollToIndex, l)))) : 0,
        e,
        s
      ), m.isBG && d ? n += this.lyricLinesSize.get(h)[1] : m.isBG || (n += this.lyricLinesSize.get(h)[1]), n >= 0 && (s += 0.05);
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
  setCurrentTime(e, r = !1) {
    this.currentTime = e, this.element.style.setProperty("--amll-player-time", `${e}`);
    const i = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
    this.hotLines.forEach((s) => {
      const h = this.processedLines[s];
      if (!h.isBG)
        if (h) {
          const o = this.processedLines[s + 1];
          if (o != null && o.isBG) {
            const d = Math.min(h.startTime, o == null ? void 0 : o.startTime), m = Math.max(h.endTime, o == null ? void 0 : o.endTime);
            (d > e || m <= e) && (this.hotLines.delete(s), i.add(s), this.hotLines.delete(s + 1), i.add(s + 1), r && (this.lyricLinesEl[s].disable(), this.lyricLinesEl[s + 1].disable()));
          } else
            (h.startTime > e || h.endTime <= e) && (this.hotLines.delete(s), i.add(s), r && this.lyricLinesEl[s].disable());
        } else
          this.hotLines.delete(s), i.add(s), r && this.lyricLinesEl[s].disable();
    }), this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (this.bufferedLines.delete(s), n.add(s), r && this.lyricLinesEl[s].disable());
    }), this.processedLines.forEach((s, h, o) => {
      var d;
      !s.isBG && s.startTime <= e && s.endTime > e && (this.hotLines.has(h) || (this.hotLines.add(h), l.add(h), r && this.lyricLinesEl[h].enable(), (d = o[h + 1]) != null && d.isBG && (this.hotLines.add(h + 1), l.add(h + 1), r && this.lyricLinesEl[h + 1].enable())));
    }), r ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (s) => s.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((s) => this.bufferedLines.add(s)), this.calcLayout(!0)) : (n.size > 0 || l.size > 0) && (n.size === 0 && l.size > 0 ? (l.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : l.size === 0 && n.size > 0 ? z(n, this.bufferedLines) && this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (this.bufferedLines.delete(s), this.lyricLinesEl[s].disable());
    }) : (l.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), n.forEach((s) => {
      this.bufferedLines.delete(s), this.lyricLinesEl[s].disable();
    }), this.bufferedLines.size > 0 && (this.scrollToIndex = Math.min(...this.bufferedLines))), this.calcLayout());
  }
  /**
   * 更新动画，这个函数应该逐帧调用
   * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
   */
  update(e = 0) {
    e /= 1e3, this.lyricLinesEl.forEach((r) => r.update(e));
  }
  setLinePosXSpringParams(e) {
    this.posXSpringParams = {
      ...this.posXSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (r) => r.lineTransforms.posX.updateParams(this.posXSpringParams)
    );
  }
  setLinePosYSpringParams(e) {
    this.posYSpringParams = {
      ...this.posYSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (r) => r.lineTransforms.posY.updateParams(this.posYSpringParams)
    );
  }
  setLineScaleSpringParams(e) {
    this.scaleSpringParams = {
      ...this.scaleSpringParams,
      ...e
    }, this.lyricLinesEl.forEach(
      (r) => r.lineTransforms.scale.updateParams(this.scaleSpringParams)
    );
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((e) => e.dispose());
  }
}
export {
  G as BackgroundRender,
  Y as LyricPlayer
};
