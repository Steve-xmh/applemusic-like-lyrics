import { Container as z } from "@pixi/display";
import { Application as A } from "@pixi/app";
import { BlurFilter as y } from "@pixi/filter-blur";
import { ColorMatrixFilter as E } from "@pixi/filter-color-matrix";
import { Filter as D, Texture as I } from "@pixi/core";
import { Sprite as w } from "@pixi/sprite";
import { create as B } from "jss";
import k from "jss-preset-default";
const N = /^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function L(h) {
  const e = N.exec(h);
  if (e) {
    const t = Number(e.groups?.hour || "0"), r = Number(e.groups?.min || "0"), i = Number(e.groups?.sec.replace(/:/, ".") || "0");
    return Math.floor((t * 3600 + r * 60 + i) * 1e3);
  } else
    throw new TypeError("时间戳字符串解析失败");
}
function O(h) {
  const t = new DOMParser().parseFromString(
    h,
    "application/xml"
  );
  let r = "v1";
  for (const a of t.querySelectorAll("ttm\\:agent"))
    if (a.getAttribute("type") === "person") {
      const s = a.getAttribute("xml:id");
      s && (r = s);
    }
  const i = [];
  for (const a of t.querySelectorAll("body p[begin][end]")) {
    const s = {
      words: [],
      startTime: L(a.getAttribute("begin") ?? "0:0"),
      endTime: L(a.getAttribute("end") ?? "0:0"),
      translatedLyric: "",
      romanLyric: "",
      isBG: !1,
      isDuet: a.getAttribute("ttm:agent") !== r
    };
    let n = null;
    for (const l of a.childNodes)
      if (l.nodeType === Node.TEXT_NODE) {
        const o = l.textContent ?? "";
        /^(\s+)$/.test(o) ? s.words.push({
          word: " ",
          startTime: 0,
          endTime: 0
        }) : s.words.push({
          word: o,
          startTime: 0,
          endTime: 0
        });
      } else if (l.nodeType === Node.ELEMENT_NODE) {
        const o = l, c = o.getAttribute("ttm:role");
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
                const p = m, T = p.getAttribute("ttm:role");
                if (p.nodeName === "span" && T)
                  T === "x-translation" ? d.translatedLyric = p.innerHTML.trim() : T === "x-roman" && (d.romanLyric = p.innerHTML.trim());
                else if (p.hasAttribute("begin") && p.hasAttribute("end")) {
                  const b = {
                    word: m.textContent,
                    startTime: L(p.getAttribute("begin")),
                    endTime: L(p.getAttribute("end"))
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
            )), n = d;
          } else
            c === "x-translation" ? s.translatedLyric = o.innerHTML : c === "x-roman" && (s.romanLyric = o.innerHTML);
        else if (o.hasAttribute("begin") && o.hasAttribute("end")) {
          const d = {
            word: l.textContent ?? "",
            startTime: L(o.getAttribute("begin")),
            endTime: L(o.getAttribute("end"))
          };
          s.words.push(d);
        }
      }
    i.push(s), n && i.push(n);
  }
  return i;
}
const ne = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parseTTML: O
}, Symbol.toStringTag, { value: "Module" }));
var F = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`, _ = `uniform float radius;
uniform float strength;
uniform vec2 center;
uniform sampler2D uSampler;
varying vec2 vTextureCoord;

uniform vec4 filterArea;
uniform vec4 filterClamp;
uniform vec2 dimensions;

void main()
{
    vec2 coord = vTextureCoord * filterArea.xy;
    coord -= center * dimensions.xy;
    float distance = length(coord);
    if (distance < radius) {
        float percent = distance / radius;
        if (strength > 0.0) {
            coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
        } else {
            coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);
        }
    }
    coord += center * dimensions.xy;
    coord /= filterArea.xy;
    vec2 clampedCoord = clamp(coord, filterClamp.xy, filterClamp.zw);
    vec4 color = texture2D(uSampler, clampedCoord);
    if (coord != clampedCoord) {
        color *= max(0.0, 1.0 - length(coord - clampedCoord));
    }

    gl_FragColor = color;
}
`;
const C = class extends D {
  constructor(h) {
    super(F, _), this.uniforms.dimensions = new Float32Array(2), Object.assign(this, C.defaults, h);
  }
  apply(h, e, t, r) {
    const { width: i, height: a } = e.filterFrame;
    this.uniforms.dimensions[0] = i, this.uniforms.dimensions[1] = a, h.applyFilter(this, e, t, r);
  }
  get radius() {
    return this.uniforms.radius;
  }
  set radius(h) {
    this.uniforms.radius = h;
  }
  get strength() {
    return this.uniforms.strength;
  }
  set strength(h) {
    this.uniforms.strength = h;
  }
  get center() {
    return this.uniforms.center;
  }
  set center(h) {
    this.uniforms.center = h;
  }
};
let v = C;
v.defaults = { center: [0.5, 0.5], radius: 100, strength: 1 };
class $ extends z {
  time = 0;
}
class q {
  constructor(e) {
    this.canvas = e;
    const t = e.getBoundingClientRect();
    this.canvas.width = t.width * this.currerntRenderScale, this.canvas.height = t.height * this.currerntRenderScale, this.observer = new ResizeObserver(() => {
      const r = e.getBoundingClientRect();
      this.canvas.width = Math.max(1, r.width), this.canvas.height = Math.max(1, r.height), this.app.renderer.resize(
        this.canvas.width * this.currerntRenderScale,
        this.canvas.height * this.currerntRenderScale
      ), this.app.ticker.start(), this.rebuildFilters();
    }), this.observer.observe(e), this.app = new A({
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
      t.alpha = Math.max(0, t.alpha - e / 60), t.alpha <= 0 && (this.app.stage.removeChild(t), this.lastContainer.delete(t), t.destroy(!0));
    if (this.curContainer) {
      this.curContainer.alpha = Math.min(
        1,
        this.curContainer.alpha + e / 60
      );
      const [t, r, i, a] = this.curContainer.children, s = Math.max(this.app.screen.width, this.app.screen.height);
      t.position.set(this.app.screen.width / 2, this.app.screen.height / 2), r.position.set(
        this.app.screen.width / 2.5,
        this.app.screen.height / 2.5
      ), i.position.set(this.app.screen.width / 2, this.app.screen.height / 2), a.position.set(this.app.screen.width / 2, this.app.screen.height / 2), t.width = s * Math.sqrt(2), t.height = t.width, r.width = s * 0.8, r.height = r.width, i.width = s * 0.5, i.height = i.width, a.width = s * 0.25, a.height = a.width, this.curContainer.time += e * this.flowSpeed, t.rotation += e / 1e3 * this.flowSpeed, r.rotation -= e / 500 * this.flowSpeed, i.rotation += e / 1e3 * this.flowSpeed, a.rotation -= e / 750 * this.flowSpeed, i.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), i.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), a.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), a.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), this.curContainer.alpha >= 1 && this.lastContainer.size === 0 && this.staticMode && this.app.ticker.stop();
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
    const e = Math.min(this.canvas.width, this.canvas.height), t = Math.max(this.canvas.width, this.canvas.height), r = new E();
    r.saturate(1.2, !1);
    const i = new E();
    i.brightness(0.6, !1);
    const a = new E();
    a.contrast(0.3, !0), this.app.stage.filters?.forEach((s) => {
      s.destroy();
    }), this.app.stage.filters = [], this.app.stage.filters.push(new y(5, 1)), this.app.stage.filters.push(new y(10, 1)), this.app.stage.filters.push(new y(20, 2)), this.app.stage.filters.push(new y(40, 2)), this.app.stage.filters.push(new y(80, 2)), e > 768 && this.app.stage.filters.push(new y(160, 4)), e > 768 * 2 && this.app.stage.filters.push(new y(320, 4)), this.app.stage.filters.push(r, i, a), this.app.stage.filters.push(new y(5, 1)), this.app.stage.filters.push(
      new v({
        radius: (t + e) / 2,
        strength: 1,
        center: [0.25, 1]
      })
    ), this.app.stage.filters.push(
      new v({
        radius: (t + e) / 2,
        strength: 1,
        center: [0.75, 0]
      })
    );
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
    const t = await I.fromURL(e), r = new $(), i = new w(t), a = new w(t), s = new w(t), n = new w(t);
    i.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), n.anchor.set(0.5, 0.5), i.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, n.rotation = Math.random() * Math.PI * 2, r.addChild(i, a, s, n), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = r, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0, this.app.ticker.start();
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class ae extends q {
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
const X = (h, e) => h.size === e.size && [...h].every((t) => e.has(t));
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
    this.currentTime = 0, this.currentSolver = R(
      this.currentPosition,
      e,
      this.targetPosition,
      0,
      this.params
    ), this.getV = Y(this.currentSolver);
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
function R(h, e, t, r = 0, i) {
  const a = i?.soft ?? !1, s = i?.stiffness ?? 100, n = i?.damping ?? 10, l = i?.mass ?? 1, o = t - h;
  if (a || 1 <= n / (2 * Math.sqrt(s * l))) {
    const c = -Math.sqrt(s / l), d = -c * o - e;
    return (u) => (u -= r, u < 0 ? h : t - (o + u * d) * Math.E ** (u * c));
  } else {
    const c = Math.sqrt(
      4 * l * s - n ** 2
    ), d = (n * o - 2 * l * e) / c, u = 0.5 * c / l, f = -(0.5 * n) / l;
    return (m) => (m -= r, m < 0 ? h : t - (Math.cos(m * u) * o + Math.sin(m * u) * d) * Math.E ** (m * f));
  }
}
function W(h) {
  return (t) => (h(t + 1e-3) - h(t - 1e-3)) / (2 * 1e-3);
}
function Y(h) {
  return W(h);
}
class G {
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
  setTransform(e = this.left, t = this.top, r = !1, i = 0) {
    this.left = e, this.top = t, this.delay = i * 1e3 | 0, r || !this.lyricPlayer.getEnableSpring() ? (r && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), r && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, i), this.lineTransforms.posY.setTargetPosition(t, i));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), r = e + this.lineSize[0], i = t + this.lineSize[1], a = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], n = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], l = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > n || t > l || r < a || i < s);
  }
  dispose() {
    this.element.remove();
  }
}
function V(h) {
  const t = 2.5949095;
  return h < 0.5 ? Math.pow(2 * h, 2) * ((t + 1) * 2 * h - t) / 2 : (Math.pow(2 * h - 2, 2) * ((t + 1) * (h * 2 - 2) + t) + 2) / 2;
}
const g = (h, e, t) => Math.max(h, Math.min(e, t));
class j {
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
      const r = this.currentInterlude[1] - this.currentInterlude[0], i = this.currentTime - this.currentInterlude[0];
      if (i <= r) {
        const a = r / Math.ceil(r / this.targetBreatheDuration);
        let s = 1, n = 1;
        s *= Math.sin(1.5 * Math.PI - i / a * 2) / 10 + 1, i < 1e3 && (s *= 1 - Math.pow((1e3 - i) / 1e3, 2)), i < 500 ? n = 0 : i < 1e3 && (n *= (i - 500) / 500), r - i < 750 && (s *= 1 - V(
          (750 - (r - i)) / 750 / 2
        )), r - i < 375 && (n *= g(
          0,
          (r - i) / 375,
          1
        )), s = Math.max(0, s), t += ` scale(${s})`;
        const l = g(
          0.25,
          i * 3 / r * 0.75,
          1
        ), o = g(
          0.25,
          (i - r / 3) * 3 / r * 0.75,
          1
        ), c = g(
          0.25,
          (i - r / 3 * 2) * 3 / r * 0.75,
          1
        );
        this.dot0.style.opacity = `${g(
          0,
          Math.max(0, n * l),
          1
        )}`, this.dot1.style.opacity = `${g(
          0,
          Math.max(0, n * o),
          1
        )}`, this.dot2.style.opacity = `${g(
          0,
          Math.max(0, n * c),
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
const x = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;
function H(h, e = "rgba(0,0,0,1)", t = "rgba(0,0,0,0.5)") {
  const r = 2 + h, i = h / r, a = (1 - i) / 2;
  return [
    `linear-gradient(to right,${e} ${a * 100}%,${t} ${(a + i) * 100}%)`,
    i,
    r
  ];
}
function M(h) {
  return h.endTime - h.startTime >= 1e3 && h.word.length <= 7;
}
class U {
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
    const r = this.element.children[0], i = this.element.children[1], a = this.element.children[2];
    r.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), i.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), a.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
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
      t.elementAnimations.forEach((r) => {
        r.currentTime = 0, r.playbackRate = 1, r.play();
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
      t.elementAnimations.forEach((r) => {
        r.id === "float-word" && (r.playbackRate = -1, r.play());
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
    const e = this.element.children[0], t = this.element.children[1], r = this.element.children[2];
    if (this.lyricPlayer._getIsNonDynamic()) {
      for (; e.firstChild; )
        e.removeChild(e.firstChild), s(e.firstChild);
      e.innerText = this.lyricLine.words.map((l) => l.word).join(""), t.innerText = this.lyricLine.translatedLyric, r.innerText = this.lyricLine.romanLyric;
      return;
    }
    this.splittedWords = [], this.lyricLine.words.forEach((l) => {
      const o = l.word.split(/\s+/), c = o.reduce((u, f) => u + f.length, 0);
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
          startTime: l.startTime + (l.endTime - l.startTime) / c * d,
          endTime: l.startTime + (l.endTime - l.startTime) / c * (d + u.length),
          width: 0,
          height: 0,
          elements: [],
          elementAnimations: [],
          shouldEmphasize: M(l)
        }), d += u.length;
      });
    });
    const i = [], a = [];
    function s(l) {
      for (; l.firstChild; )
        l.firstChild.nodeType === Node.ELEMENT_NODE ? i.push(e.firstChild) : l.firstChild.nodeType === Node.TEXT_NODE && a.push(e.firstChild), l.removeChild(l.firstChild), s(l.firstChild);
    }
    s(e);
    let n = null;
    this.splittedWords.forEach((l) => {
      if (l.word.trim().length > 0)
        if (l.shouldEmphasize) {
          const o = i.pop() ?? document.createElement("span");
          o.className = "emphasize", l.elements = [o];
          for (const c of l.word) {
            const d = i.pop() ?? document.createElement("span");
            d.className = "", d.innerText = c, o.appendChild(d), l.elements.push(d);
          }
          if (l.elementAnimations = this.initEmphasizeAnimation(l), n && !x.test(l.word))
            if (n.childElementCount > 0)
              n.appendChild(o);
            else {
              const c = i.pop() ?? document.createElement("span");
              c.className = "", n.remove(), c.appendChild(n), c.appendChild(o), e.appendChild(c), n = c;
            }
          else
            n = x.test(l.word) ? null : o, e.appendChild(o);
        } else {
          const o = i.pop() ?? document.createElement("span");
          if (o.className = "", o.innerText = l.word, l.elements = [o], l.elementAnimations.push(this.initFloatAnimation(l, o)), n)
            if (n.childElementCount > 0)
              n.appendChild(o);
            else {
              const c = i.pop() ?? document.createElement("span");
              c.className = "", n.remove(), c.appendChild(n), c.appendChild(o), e.appendChild(c), n = c;
            }
          else
            n = o, e.appendChild(o);
        }
      else if (l.word.length > 0) {
        const o = a.pop() ?? document.createTextNode(" ");
        e.appendChild(o), n = null;
      } else
        n = null;
    }), t.innerText = this.lyricLine.translatedLyric, r.innerText = this.lyricLine.romanLyric;
  }
  initFloatAnimation(e, t) {
    const r = e.startTime - this.lyricLine.startTime, i = Math.max(1e3, e.endTime - e.startTime), a = t.animate(
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
        delay: isFinite(r) ? r : 0,
        id: "float-word",
        composite: "add",
        fill: "both"
      }
    );
    return a.pause(), a;
  }
  initEmphasizeAnimation(e) {
    const t = e.startTime - this.lyricLine.startTime, r = e.endTime - e.startTime;
    return e.elements.map((i, a, s) => {
      if (a === 0)
        return this.initFloatAnimation(e, i);
      {
        const n = Math.max(1e3, e.endTime - e.startTime), l = t + r / (s.length - 1) * (a - 1), o = i.animate(
          [
            {
              offset: 0,
              transform: "translate3d(0, 0, 0px)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            },
            {
              offset: 0.5,
              transform: "translate3d(0, -1%, 20px)",
              filter: "drop-shadow(0 0 0.05em var(--amll-lyric-view-color,white))"
            },
            {
              offset: 1,
              transform: "translate3d(0, 0, 0)",
              filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))"
            }
          ],
          {
            duration: isFinite(n) ? n : 0,
            delay: isFinite(l) ? l : 0,
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
        const [r, i, a] = H(
          16 / e.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), s = `${a * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (t.style.maskImage = r, t.style.maskOrigin = "left", t.style.maskSize = s) : (t.style.webkitMaskImage = r, t.style.webkitMaskOrigin = "left", t.style.webkitMaskSize = s);
        const n = e.width + 16, l = `clamp(${-n}px,calc(${-n}px + (var(--amll-player-time) - ${e.startTime})*${n / Math.abs(e.endTime - e.startTime)}px),0px) 0px, left top`;
        t.style.maskPosition = l, t.style.webkitMaskPosition = l;
      }
    }), this._hide && (this.element.style.display = "none", this.element.style.visibility = "");
  }
  getElement() {
    return this.element;
  }
  setTransform(e = this.left, t = this.top, r = this.scale, i = 1, a = 0, s = !1, n = 0) {
    this.left = e, this.top = t, this.scale = r, this.delay = n * 1e3 | 0;
    const l = this.element.children[0];
    l.style.opacity = `${i}`, s || !this.lyricPlayer.getEnableSpring() ? (this.blur = Math.min(32, a), s && this.element.classList.add(
      this.lyricPlayer.style.classes.tmpDisableTransition
    ), this.lineTransforms.posX.setPosition(e), this.lineTransforms.posY.setPosition(t), this.lineTransforms.scale.setPosition(r), this.lyricPlayer.getEnableSpring() ? this.rebuildStyle() : this.show(), s && requestAnimationFrame(() => {
      this.element.classList.remove(
        this.lyricPlayer.style.classes.tmpDisableTransition
      );
    })) : (this.lineTransforms.posX.setTargetPosition(e, n), this.lineTransforms.posY.setTargetPosition(t, n), this.lineTransforms.scale.setTargetPosition(r), this.blur !== Math.min(32, a) && (this.blur = Math.min(32, a), this.element.style.filter = `blur(${Math.min(32, a)}px)`));
  }
  update(e = 0) {
    this.lyricPlayer.getEnableSpring() && (this.lineTransforms.posX.update(e), this.lineTransforms.posY.update(e), this.lineTransforms.scale.update(e), this.isInSight ? this.show() : this.hide());
  }
  get isInSight() {
    const e = this.lineTransforms.posX.getCurrentPosition(), t = this.lineTransforms.posY.getCurrentPosition(), r = e + this.lineSize[0], i = t + this.lineSize[1], a = this.lyricPlayer.pos[0], s = this.lyricPlayer.pos[1], n = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0], l = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
    return !(e > n || t > l || r < a || i < s);
  }
  dispose() {
    this.element.remove();
  }
}
const J = B(k());
class le extends EventTarget {
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
    const r = getComputedStyle(e[0].target), i = this.element.clientWidth - parseFloat(r.paddingLeft) - parseFloat(r.paddingRight), a = this.element.clientHeight - parseFloat(r.paddingTop) - parseFloat(r.paddingBottom);
    this.innerSize[0] = i, this.innerSize[1] = a, this.rebuildStyle(), this.calcLayout(!0, !0), this.lyricLinesEl.forEach((s) => s.updateMaskImage());
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
  style = J.createStyleSheet({
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
        height: "clamp(0.5em,1vh,3em)",
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
    super(), this.interludeDots = new j(this), this.bottomLine = new G(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.disableSpring && this.element.classList.add(this.style.classes.disableSpring), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.element.appendChild(this.bottomLine.getElement()), this.style.attach(), this.interludeDots.setTransform(0, 200), window.addEventListener("pageshow", this.onPageShow), this.element.addEventListener("wheel", (e) => {
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
      (i) => i.words.reduce((a, s) => a + s.word.trim().length, 0) > 0
    ).map((i, a, s) => {
      if (i.isBG)
        return {
          ...i
        };
      {
        const n = s[a - 1], l = s[a - 2];
        if (n?.isBG && l) {
          if (l.endTime < i.startTime)
            return {
              ...i,
              startTime: Math.max(l.endTime, i.startTime - t) || i.startTime
            };
        } else if (n?.endTime && n.endTime < i.startTime)
          return {
            ...i,
            startTime: Math.max(n?.endTime, i.startTime - t) || i.startTime
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
    this.processedLines.forEach((i, a, s) => {
      const n = s[a + 1], l = i.words[i.words.length - 1];
      l && M(l) && (n ? n.startTime > i.endTime && (i.endTime = Math.min(i.endTime + 1500, n.startTime)) : i.endTime = i.endTime + 1500);
    }), this.processedLines.forEach((i, a, s) => {
      if (i.isBG)
        return;
      const n = s[a + 1];
      n?.isBG && (n.startTime = Math.min(n.startTime, i.startTime));
    });
    const r = this.lyricLinesEl;
    for (this.lyricLinesEl = this.processedLines.map((i, a) => this.lyricLinesEl[a] ?? new U(this, i)); r.length > this.processedLines.length; )
      r.pop()?.dispose();
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
    const r = this.getCurrentInterlude();
    let i = -this.scrollOffset, a = this.scrollToIndex, s = 0;
    r ? (s = r[1] - r[0], s >= 5e3 && this.lyricLinesEl[r[2] + 1] && (a = r[2] + 1)) : this.interludeDots.setInterlude(void 0);
    const n = 0.95, l = this.lyricLinesEl.slice(0, a).reduce(
      (m, p) => m + (p.getLine().isBG ? 0 : this.lyricLinesSize.get(p)?.[1] ?? 0),
      0
    );
    i -= l, i += this.size[1] * this.alignPosition;
    const o = this.lyricLinesEl[a];
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
      const T = this.bufferedLines.has(p), b = T || p >= this.scrollToIndex && p < c, P = m.getLine();
      P.isDuet && this.size[0] - (this.lyricLinesSize.get(m)?.[0] ?? 0), !f && s >= 5e3 && (p === this.scrollToIndex && r?.[2] === -2 || p === this.scrollToIndex + 1) && (f = !0, this.interludeDots.setTransform(32, i), r && this.interludeDots.setInterlude([r[0], r[1]]), i += this.interludeDotsSize[1]), m.setTransform(
        0,
        i,
        b ? 1 : n,
        T ? 1 : 1 / 3,
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
    const r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
    this.hotLines.forEach((s) => {
      const n = this.processedLines[s];
      if (n) {
        if (n.isBG)
          return;
        const l = this.processedLines[s + 1];
        if (l?.isBG) {
          const o = Math.min(n.startTime, l?.startTime), c = Math.max(n.endTime, l?.endTime);
          (o > e || c <= e) && (this.hotLines.delete(s), r.add(s), this.hotLines.delete(s + 1), r.add(s + 1), t && (this.lyricLinesEl[s].disable(), this.lyricLinesEl[s + 1].disable()));
        } else
          (n.startTime > e || n.endTime <= e) && (this.hotLines.delete(s), r.add(s), t && this.lyricLinesEl[s].disable());
      } else
        this.hotLines.delete(s), r.add(s), t && this.lyricLinesEl[s].disable();
    }), this.processedLines.forEach((s, n, l) => {
      !s.isBG && s.startTime <= e && s.endTime > e && (this.hotLines.has(n) || (this.hotLines.add(n), a.add(n), t && this.lyricLinesEl[n].enable(), l[n + 1]?.isBG && (this.hotLines.add(n + 1), a.add(n + 1), t && this.lyricLinesEl[n + 1].enable())));
    }), this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (i.add(s), t && this.lyricLinesEl[s].disable());
    }), t ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (s) => s.startTime >= e
    ), this.bufferedLines.clear(), this.hotLines.forEach((s) => this.bufferedLines.add(s)), this.calcLayout(!0)) : (i.size > 0 || a.size > 0) && (i.size === 0 && a.size > 0 ? (a.forEach((s) => {
      this.bufferedLines.add(s), this.lyricLinesEl[s].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : a.size === 0 && i.size > 0 ? X(i, this.bufferedLines) && this.bufferedLines.forEach((s) => {
      this.hotLines.has(s) || (this.bufferedLines.delete(s), this.lyricLinesEl[s].disable());
    }) : (a.forEach((s) => {
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
    this.interludeDots.update(e), this.bottomLine.update(t), this.lyricLinesEl.forEach((r) => r.update(t));
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
  ae as BackgroundRender,
  le as LyricPlayer,
  ne as ttml
};
//# sourceMappingURL=amll-core.mjs.map
