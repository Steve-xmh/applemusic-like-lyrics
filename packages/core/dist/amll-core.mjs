var lt = Object.defineProperty;
var ut = (i, t, r) => t in i ? lt(i, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : i[t] = r;
var p = (i, t, r) => (ut(i, typeof t != "symbol" ? t + "" : t, r), r);
import { Application as ft, ColorMatrixFilter as Z, BlurFilter as S, Texture as ct, Sprite as J, Container as dt } from "pixi.js";
class ht extends dt {
  constructor() {
    super(...arguments);
    p(this, "time", 0);
  }
}
class pt {
  constructor(t) {
    p(this, "observer");
    p(this, "app");
    p(this, "curContainer");
    p(this, "lastContainer", /* @__PURE__ */ new Set());
    p(this, "onTick", (t) => {
      for (const r of this.lastContainer)
        r.alpha = Math.max(0, r.alpha - t / 60), r.alpha <= 0 && (this.app.stage.removeChild(r), this.lastContainer.delete(r));
      if (this.curContainer) {
        this.curContainer.alpha = Math.min(
          1,
          this.curContainer.alpha + t / 60
        );
        const [r, e, n, s] = this.curContainer.children, a = Math.max(this.app.screen.width, this.app.screen.height);
        r.position.set(this.app.screen.width / 2, this.app.screen.height / 2), e.position.set(
          this.app.screen.width / 2.5,
          this.app.screen.height / 2.5
        ), n.position.set(this.app.screen.width / 2, this.app.screen.height / 2), s.position.set(this.app.screen.width / 2, this.app.screen.height / 2), r.width = a * Math.sqrt(2), r.height = r.width, e.width = a * 0.8, e.height = e.width, n.width = a * 0.5, n.height = n.width, s.width = a * 0.25, s.height = s.width, this.curContainer.time += t, r.rotation += t / 1e3, e.rotation -= t / 500, n.rotation += t / 1e3, s.rotation -= t / 750, n.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), n.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), s.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), s.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
      }
    });
    this.canvas = t;
    const r = t.getBoundingClientRect();
    this.canvas.width = r.width, this.canvas.height = r.height, this.observer = new ResizeObserver(() => {
      const e = t.getBoundingClientRect();
      this.canvas.width = Math.max(1, e.width), this.canvas.height = Math.max(1, e.height), this.app.renderer.resize(this.canvas.width, this.canvas.height), this.rebuildFilters();
    }), this.observer.observe(t), this.app = new ft({
      view: t,
      resizeTo: this.canvas,
      powerPreference: "low-power",
      backgroundAlpha: 0
    }), this.rebuildFilters(), this.app.ticker.add(this.onTick), this.app.ticker.start();
  }
  rebuildFilters() {
    const t = Math.min(this.canvas.width, this.canvas.height), r = new Z();
    r.saturate(1.2, !1);
    const e = new Z();
    e.brightness(0.6, !1);
    const n = new Z();
    n.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new S(5, 1)), this.app.stage.filters.push(new S(10, 1)), this.app.stage.filters.push(new S(20, 2)), this.app.stage.filters.push(new S(40, 2)), this.app.stage.filters.push(new S(80, 2)), t > 768 && this.app.stage.filters.push(new S(160, 4)), t > 768 * 2 && this.app.stage.filters.push(new S(320, 4)), this.app.stage.filters.push(r, e, n), this.app.stage.filters.push(new S(5, 1));
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
    const r = await ct.fromURL(t), e = new ht(), n = new J(r), s = new J(r), a = new J(r), o = new J(r);
    n.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), o.anchor.set(0.5, 0.5), n.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, o.rotation = Math.random() * Math.PI * 2, e.addChild(n, s, a, o), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = e, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class An extends pt {
  constructor() {
    const r = document.createElement("canvas");
    super(r);
    p(this, "element");
    this.element = r, r.style.pointerEvents = "none", r.style.zIndex = "-1";
  }
  getElement() {
    return this.element;
  }
  dispose() {
    super.dispose(), this.element.remove();
  }
}
const gt = (i, t) => i.size === t.size && [...i].every((r) => t.has(r));
class mt {
  constructor(t) {
    p(this, "element", document.createElement("div"));
    p(this, "dot0", document.createElement("div"));
    p(this, "dot1", document.createElement("div"));
    p(this, "dot2", document.createElement("div"));
    this.lyricPlayer = t, this.element.className = t.style.classes.interludeDots, this.element.appendChild(this.dot0), this.element.appendChild(this.dot1), this.element.appendChild(this.dot2);
  }
  getElement() {
    return this.element;
  }
  dispose() {
    this.element.remove();
  }
}
const yt = /^([\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?)+$/u;
function vt(i, t = "rgba(0,0,0,1)", r = "rgba(0,0,0,0.5)") {
  const e = 2 + i, n = i / e, s = (1 - n) / 2;
  return [
    `linear-gradient(to right,${t} ${s * 100}%,${r} ${(s + n) * 100}%)`,
    n,
    e
  ];
}
class bt {
  constructor(t, r = {
    words: [],
    translatedLyric: "",
    romanLyric: "",
    startTime: 0,
    endTime: 0,
    isBG: !1,
    isDuet: !1
  }) {
    p(this, "element", document.createElement("div"));
    p(this, "currentTime", 0);
    p(this, "left", 0);
    p(this, "top", 0);
    p(this, "scale", 1);
    p(this, "shouldInstant", !0);
    p(this, "splittedWords", []);
    this.lyricPlayer = t, this.lyricLine = r, this.element.setAttribute(
      "class",
      this.lyricPlayer.style.classes.lyricLine
    ), this.lyricLine.isBG && this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine), this.lyricLine.isDuet && this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div"));
    const e = this.element.children[0], n = this.element.children[1], s = this.element.children[2];
    e.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine), n.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), s.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine), this.rebuildElement(), this.rebuildStyle();
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
  rebuildStyle() {
    let t = `transform:translate(${this.left}px,${this.top}px) scale(${this.scale});`;
    this.element.setAttribute("style", t);
  }
  rebuildElement() {
    const t = this.element.children[0], r = this.element.children[1], e = this.element.children[2];
    for (this.splittedWords = [], this.lyricLine.words.forEach((n) => {
      yt.test(n.word) ? this.splittedWords = this.splittedWords.concat(
        n.word.split("").map((s, a, o) => ({
          word: s,
          startTime: n.startTime + a * (n.endTime - n.startTime) / o.length,
          endTime: n.startTime + (a + 1) * (n.endTime - n.startTime) / o.length,
          width: 0,
          height: 0
        }))
      ) : this.splittedWords.push({
        ...n,
        width: 0,
        height: 0
      });
    }); this.splittedWords.length > t.childElementCount; )
      t.appendChild(document.createElement("span"));
    for (let n = 0; n < Math.max(t.childElementCount, this.splittedWords.length); n++) {
      const s = this.splittedWords[n], a = t.children[n];
      s ? a.innerText = s.word : a.innerText = "";
    }
    r.innerText = this.lyricLine.translatedLyric, e.innerText = this.lyricLine.romanLyric;
  }
  updateMaskImage() {
    var r, e;
    const t = this.element.children[0];
    for (let n = 0; n < Math.max(t.childElementCount, this.splittedWords.length); n++) {
      const s = this.splittedWords[n], a = t.children[n];
      if (((e = (r = s == null ? void 0 : s.word) == null ? void 0 : r.trim()) == null ? void 0 : e.length) > 0) {
        s.width = a.clientWidth, s.height = a.clientHeight;
        const [o, u, f] = vt(
          16 / s.width,
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.25)"
        ), d = `${f * 100}% 100%`;
        this.lyricPlayer.supportMaskImage ? (a.style.maskImage = o, a.style.maskOrigin = "left", a.style.maskSize = d) : (a.style.webkitMaskImage = o, a.style.webkitMaskOrigin = "left", a.style.webkitMaskSize = d);
        const c = s.width + 16, g = `clamp(${-c}px,calc(${-c}px + (var(--amll-player-time) - ${s.startTime})*${c / Math.abs(s.endTime - s.startTime)}px),0px) 0px, left top`;
        a.style.maskPosition = g, a.style.webkitMaskPosition = g;
      }
    }
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, r = this.top, e = this.scale, n = !1) {
    this.left = t, this.top = r, this.scale = e, this.rebuildStyle();
  }
  update(t = 0) {
  }
  dispose() {
    this.element.remove();
  }
}
function b() {
  return b = Object.assign ? Object.assign.bind() : function(i) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (i[e] = r[e]);
    }
    return i;
  }, b.apply(this, arguments);
}
var Le = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(i) {
  return typeof i;
} : function(i) {
  return i && typeof Symbol == "function" && i.constructor === Symbol && i !== Symbol.prototype ? "symbol" : typeof i;
}, G = (typeof window > "u" ? "undefined" : Le(window)) === "object" && (typeof document > "u" ? "undefined" : Le(document)) === "object" && document.nodeType === 9, wt = process.env.NODE_ENV === "production";
function v(i, t) {
  if (!wt) {
    if (i)
      return;
    var r = "Warning: " + t;
    typeof console < "u" && console.warn(r);
    try {
      throw Error(r);
    } catch {
    }
  }
}
function D(i) {
  "@babel/helpers - typeof";
  return D = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, D(i);
}
function St(i, t) {
  if (D(i) !== "object" || i === null)
    return i;
  var r = i[Symbol.toPrimitive];
  if (r !== void 0) {
    var e = r.call(i, t || "default");
    if (D(e) !== "object")
      return e;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(i);
}
function xt(i) {
  var t = St(i, "string");
  return D(t) === "symbol" ? t : String(t);
}
function Oe(i, t) {
  for (var r = 0; r < t.length; r++) {
    var e = t[r];
    e.enumerable = e.enumerable || !1, e.configurable = !0, "value" in e && (e.writable = !0), Object.defineProperty(i, xt(e.key), e);
  }
}
function Fe(i, t, r) {
  return t && Oe(i.prototype, t), r && Oe(i, r), Object.defineProperty(i, "prototype", {
    writable: !1
  }), i;
}
function ce(i, t) {
  return ce = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, n) {
    return e.__proto__ = n, e;
  }, ce(i, t);
}
function Ue(i, t) {
  i.prototype = Object.create(t.prototype), i.prototype.constructor = i, ce(i, t);
}
function Te(i) {
  if (i === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return i;
}
function Rt(i, t) {
  if (i == null)
    return {};
  var r = {}, e = Object.keys(i), n, s;
  for (s = 0; s < e.length; s++)
    n = e[s], !(t.indexOf(n) >= 0) && (r[n] = i[n]);
  return r;
}
var Pt = {}.constructor;
function de(i) {
  if (i == null || typeof i != "object")
    return i;
  if (Array.isArray(i))
    return i.map(de);
  if (i.constructor !== Pt)
    return i;
  var t = {};
  for (var r in i)
    t[r] = de(i[r]);
  return t;
}
function H(i, t, r) {
  i === void 0 && (i = "unnamed");
  var e = r.jss, n = de(t), s = e.plugins.onCreateRule(i, n, r);
  return s || (i[0] === "@" && process.env.NODE_ENV !== "production" && v(!1, "[JSS] Unknown rule " + i), null);
}
var je = function(t, r) {
  for (var e = "", n = 0; n < t.length && t[n] !== "!important"; n++)
    e && (e += r), e += t[n];
  return e;
}, C = function(t) {
  if (!Array.isArray(t))
    return t;
  var r = "";
  if (Array.isArray(t[0]))
    for (var e = 0; e < t.length && t[e] !== "!important"; e++)
      r && (r += ", "), r += je(t[e], " ");
  else
    r = je(t, ", ");
  return t[t.length - 1] === "!important" && (r += " !important"), r;
};
function M(i) {
  return i && i.format === !1 ? {
    linebreak: "",
    space: ""
  } : {
    linebreak: `
`,
    space: " "
  };
}
function z(i, t) {
  for (var r = "", e = 0; e < t; e++)
    r += "  ";
  return r + i;
}
function W(i, t, r) {
  r === void 0 && (r = {});
  var e = "";
  if (!t)
    return e;
  var n = r, s = n.indent, a = s === void 0 ? 0 : s, o = t.fallbacks;
  r.format === !1 && (a = -1 / 0);
  var u = M(r), f = u.linebreak, d = u.space;
  if (i && a++, o)
    if (Array.isArray(o))
      for (var c = 0; c < o.length; c++) {
        var g = o[c];
        for (var m in g) {
          var y = g[m];
          y != null && (e && (e += f), e += z(m + ":" + d + C(y) + ";", a));
        }
      }
    else
      for (var w in o) {
        var B = o[w];
        B != null && (e && (e += f), e += z(w + ":" + d + C(B) + ";", a));
      }
  for (var Y in t) {
    var Ce = t[Y];
    Ce != null && Y !== "fallbacks" && (e && (e += f), e += z(Y + ":" + d + C(Ce) + ";", a));
  }
  return !e && !r.allowEmpty || !i ? e : (a--, e && (e = "" + f + e + f), z("" + i + d + "{" + e, a) + z("}", a));
}
var kt = /([[\].#*$><+~=|^:(),"'`\s])/g, Ae = typeof CSS < "u" && CSS.escape, Pe = function(i) {
  return Ae ? Ae(i) : i.replace(kt, "\\$1");
}, qe = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "style", this.isProcessed = !1;
    var s = n.sheet, a = n.Renderer;
    this.key = r, this.options = n, this.style = e, s ? this.renderer = s.renderer : a && (this.renderer = new a());
  }
  var t = i.prototype;
  return t.prop = function(e, n, s) {
    if (n === void 0)
      return this.style[e];
    var a = s ? s.force : !1;
    if (!a && this.style[e] === n)
      return this;
    var o = n;
    (!s || s.process !== !1) && (o = this.options.jss.plugins.onChangeValue(n, e, this));
    var u = o == null || o === !1, f = e in this.style;
    if (u && !f && !a)
      return this;
    var d = u && f;
    if (d ? delete this.style[e] : this.style[e] = o, this.renderable && this.renderer)
      return d ? this.renderer.removeProperty(this.renderable, e) : this.renderer.setProperty(this.renderable, e, o), this;
    var c = this.options.sheet;
    return c && c.attached && process.env.NODE_ENV !== "production" && v(!1, '[JSS] Rule is not linked. Missing sheet option "link: true".'), this;
  }, i;
}(), he = /* @__PURE__ */ function(i) {
  Ue(t, i);
  function t(e, n, s) {
    var a;
    a = i.call(this, e, n, s) || this;
    var o = s.selector, u = s.scoped, f = s.sheet, d = s.generateId;
    return o ? a.selectorText = o : u !== !1 && (a.id = d(Te(Te(a)), f), a.selectorText = "." + Pe(a.id)), a;
  }
  var r = t.prototype;
  return r.applyTo = function(n) {
    var s = this.renderer;
    if (s) {
      var a = this.toJSON();
      for (var o in a)
        s.setProperty(n, o, a[o]);
    }
    return this;
  }, r.toJSON = function() {
    var n = {};
    for (var s in this.style) {
      var a = this.style[s];
      typeof a != "object" ? n[s] = a : Array.isArray(a) && (n[s] = C(a));
    }
    return n;
  }, r.toString = function(n) {
    var s = this.options.sheet, a = s ? s.options.link : !1, o = a ? b({}, n, {
      allowEmpty: !0
    }) : n;
    return W(this.selectorText, this.style, o);
  }, Fe(t, [{
    key: "selector",
    set: function(n) {
      if (n !== this.selectorText) {
        this.selectorText = n;
        var s = this.renderer, a = this.renderable;
        if (!(!a || !s)) {
          var o = s.setSelector(a, n);
          o || s.replaceRule(a, this);
        }
      }
    },
    get: function() {
      return this.selectorText;
    }
  }]), t;
}(qe), Et = {
  onCreateRule: function(t, r, e) {
    return t[0] === "@" || e.parent && e.parent.type === "keyframes" ? null : new he(t, r, e);
  }
}, Q = {
  indent: 1,
  children: !0
}, Ct = /@([\w-]+)/, Lt = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "conditional", this.isProcessed = !1, this.key = r;
    var s = r.match(Ct);
    this.at = s ? s[1] : "unknown", this.query = n.name || "@" + this.at, this.options = n, this.rules = new X(b({}, n, {
      parent: this
    }));
    for (var a in e)
      this.rules.add(a, e[a]);
    this.rules.process();
  }
  var t = i.prototype;
  return t.getRule = function(e) {
    return this.rules.get(e);
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.addRule = function(e, n, s) {
    var a = this.rules.add(e, n, s);
    return a ? (this.options.jss.plugins.onProcessRule(a), a) : null;
  }, t.replaceRule = function(e, n, s) {
    var a = this.rules.replace(e, n, s);
    return a && this.options.jss.plugins.onProcessRule(a), a;
  }, t.toString = function(e) {
    e === void 0 && (e = Q);
    var n = M(e), s = n.linebreak;
    if (e.indent == null && (e.indent = Q.indent), e.children == null && (e.children = Q.children), e.children === !1)
      return this.query + " {}";
    var a = this.rules.toString(e);
    return a ? this.query + " {" + s + a + s + "}" : "";
  }, i;
}(), Ot = /@container|@media|@supports\s+/, Tt = {
  onCreateRule: function(t, r, e) {
    return Ot.test(t) ? new Lt(t, r, e) : null;
  }
}, ee = {
  indent: 1,
  children: !0
}, jt = /@keyframes\s+([\w-]+)/, pe = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "keyframes", this.at = "@keyframes", this.isProcessed = !1;
    var s = r.match(jt);
    s && s[1] ? this.name = s[1] : (this.name = "noname", process.env.NODE_ENV !== "production" && v(!1, "[JSS] Bad keyframes name " + r)), this.key = this.type + "-" + this.name, this.options = n;
    var a = n.scoped, o = n.sheet, u = n.generateId;
    this.id = a === !1 ? this.name : Pe(u(this, o)), this.rules = new X(b({}, n, {
      parent: this
    }));
    for (var f in e)
      this.rules.add(f, e[f], b({}, n, {
        parent: this
      }));
    this.rules.process();
  }
  var t = i.prototype;
  return t.toString = function(e) {
    e === void 0 && (e = ee);
    var n = M(e), s = n.linebreak;
    if (e.indent == null && (e.indent = ee.indent), e.children == null && (e.children = ee.children), e.children === !1)
      return this.at + " " + this.id + " {}";
    var a = this.rules.toString(e);
    return a && (a = "" + s + a + s), this.at + " " + this.id + " {" + a + "}";
  }, i;
}(), At = /@keyframes\s+/, Mt = /\$([\w-]+)/g, ge = function(t, r) {
  return typeof t == "string" ? t.replace(Mt, function(e, n) {
    return n in r ? r[n] : (process.env.NODE_ENV !== "production" && v(!1, '[JSS] Referenced keyframes rule "' + n + '" is not defined.'), e);
  }) : t;
}, Me = function(t, r, e) {
  var n = t[r], s = ge(n, e);
  s !== n && (t[r] = s);
}, zt = {
  onCreateRule: function(t, r, e) {
    return typeof t == "string" && At.test(t) ? new pe(t, r, e) : null;
  },
  // Animation name ref replacer.
  onProcessStyle: function(t, r, e) {
    return r.type !== "style" || !e || ("animation-name" in t && Me(t, "animation-name", e.keyframes), "animation" in t && Me(t, "animation", e.keyframes)), t;
  },
  onChangeValue: function(t, r, e) {
    var n = e.options.sheet;
    if (!n)
      return t;
    switch (r) {
      case "animation":
        return ge(t, n.keyframes);
      case "animation-name":
        return ge(t, n.keyframes);
      default:
        return t;
    }
  }
}, It = /* @__PURE__ */ function(i) {
  Ue(t, i);
  function t() {
    return i.apply(this, arguments) || this;
  }
  var r = t.prototype;
  return r.toString = function(n) {
    var s = this.options.sheet, a = s ? s.options.link : !1, o = a ? b({}, n, {
      allowEmpty: !0
    }) : n;
    return W(this.key, this.style, o);
  }, t;
}(qe), _t = {
  onCreateRule: function(t, r, e) {
    return e.parent && e.parent.type === "keyframes" ? new It(t, r, e) : null;
  }
}, Nt = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "font-face", this.at = "@font-face", this.isProcessed = !1, this.key = r, this.style = e, this.options = n;
  }
  var t = i.prototype;
  return t.toString = function(e) {
    var n = M(e), s = n.linebreak;
    if (Array.isArray(this.style)) {
      for (var a = "", o = 0; o < this.style.length; o++)
        a += W(this.at, this.style[o]), this.style[o + 1] && (a += s);
      return a;
    }
    return W(this.at, this.style, e);
  }, i;
}(), Vt = /@font-face/, Dt = {
  onCreateRule: function(t, r, e) {
    return Vt.test(t) ? new Nt(t, r, e) : null;
  }
}, Wt = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "viewport", this.at = "@viewport", this.isProcessed = !1, this.key = r, this.style = e, this.options = n;
  }
  var t = i.prototype;
  return t.toString = function(e) {
    return W(this.key, this.style, e);
  }, i;
}(), $t = {
  onCreateRule: function(t, r, e) {
    return t === "@viewport" || t === "@-ms-viewport" ? new Wt(t, r, e) : null;
  }
}, Gt = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "simple", this.isProcessed = !1, this.key = r, this.value = e, this.options = n;
  }
  var t = i.prototype;
  return t.toString = function(e) {
    if (Array.isArray(this.value)) {
      for (var n = "", s = 0; s < this.value.length; s++)
        n += this.key + " " + this.value[s] + ";", this.value[s + 1] && (n += `
`);
      return n;
    }
    return this.key + " " + this.value + ";";
  }, i;
}(), Bt = {
  "@charset": !0,
  "@import": !0,
  "@namespace": !0
}, Jt = {
  onCreateRule: function(t, r, e) {
    return t in Bt ? new Gt(t, r, e) : null;
  }
}, ze = [Et, Tt, zt, _t, Dt, $t, Jt], Ft = {
  process: !0
}, Ie = {
  force: !0,
  process: !0
  /**
   * Contains rules objects and allows adding/removing etc.
   * Is used for e.g. by `StyleSheet` or `ConditionalRule`.
   */
}, X = /* @__PURE__ */ function() {
  function i(r) {
    this.map = {}, this.raw = {}, this.index = [], this.counter = 0, this.options = r, this.classes = r.classes, this.keyframes = r.keyframes;
  }
  var t = i.prototype;
  return t.add = function(e, n, s) {
    var a = this.options, o = a.parent, u = a.sheet, f = a.jss, d = a.Renderer, c = a.generateId, g = a.scoped, m = b({
      classes: this.classes,
      parent: o,
      sheet: u,
      jss: f,
      Renderer: d,
      generateId: c,
      scoped: g,
      name: e,
      keyframes: this.keyframes,
      selector: void 0
    }, s), y = e;
    e in this.raw && (y = e + "-d" + this.counter++), this.raw[y] = n, y in this.classes && (m.selector = "." + Pe(this.classes[y]));
    var w = H(y, n, m);
    if (!w)
      return null;
    this.register(w);
    var B = m.index === void 0 ? this.index.length : m.index;
    return this.index.splice(B, 0, w), w;
  }, t.replace = function(e, n, s) {
    var a = this.get(e), o = this.index.indexOf(a);
    a && this.remove(a);
    var u = s;
    return o !== -1 && (u = b({}, s, {
      index: o
    })), this.add(e, n, u);
  }, t.get = function(e) {
    return this.map[e];
  }, t.remove = function(e) {
    this.unregister(e), delete this.raw[e.key], this.index.splice(this.index.indexOf(e), 1);
  }, t.indexOf = function(e) {
    return this.index.indexOf(e);
  }, t.process = function() {
    var e = this.options.jss.plugins;
    this.index.slice(0).forEach(e.onProcessRule, e);
  }, t.register = function(e) {
    this.map[e.key] = e, e instanceof he ? (this.map[e.selector] = e, e.id && (this.classes[e.key] = e.id)) : e instanceof pe && this.keyframes && (this.keyframes[e.name] = e.id);
  }, t.unregister = function(e) {
    delete this.map[e.key], e instanceof he ? (delete this.map[e.selector], delete this.classes[e.key]) : e instanceof pe && delete this.keyframes[e.name];
  }, t.update = function() {
    var e, n, s;
    if (typeof (arguments.length <= 0 ? void 0 : arguments[0]) == "string" ? (e = arguments.length <= 0 ? void 0 : arguments[0], n = arguments.length <= 1 ? void 0 : arguments[1], s = arguments.length <= 2 ? void 0 : arguments[2]) : (n = arguments.length <= 0 ? void 0 : arguments[0], s = arguments.length <= 1 ? void 0 : arguments[1], e = null), e)
      this.updateOne(this.get(e), n, s);
    else
      for (var a = 0; a < this.index.length; a++)
        this.updateOne(this.index[a], n, s);
  }, t.updateOne = function(e, n, s) {
    s === void 0 && (s = Ft);
    var a = this.options, o = a.jss.plugins, u = a.sheet;
    if (e.rules instanceof i) {
      e.rules.update(n, s);
      return;
    }
    var f = e.style;
    if (o.onUpdate(n, e, u, s), s.process && f && f !== e.style) {
      o.onProcessStyle(e.style, e, u);
      for (var d in e.style) {
        var c = e.style[d], g = f[d];
        c !== g && e.prop(d, c, Ie);
      }
      for (var m in f) {
        var y = e.style[m], w = f[m];
        y == null && y !== w && e.prop(m, null, Ie);
      }
    }
  }, t.toString = function(e) {
    for (var n = "", s = this.options.sheet, a = s ? s.options.link : !1, o = M(e), u = o.linebreak, f = 0; f < this.index.length; f++) {
      var d = this.index[f], c = d.toString(e);
      !c && !a || (n && (n += u), n += c);
    }
    return n;
  }, i;
}(), Ke = /* @__PURE__ */ function() {
  function i(r, e) {
    this.attached = !1, this.deployed = !1, this.classes = {}, this.keyframes = {}, this.options = b({}, e, {
      sheet: this,
      parent: this,
      classes: this.classes,
      keyframes: this.keyframes
    }), e.Renderer && (this.renderer = new e.Renderer(this)), this.rules = new X(this.options);
    for (var n in r)
      this.rules.add(n, r[n]);
    this.rules.process();
  }
  var t = i.prototype;
  return t.attach = function() {
    return this.attached ? this : (this.renderer && this.renderer.attach(), this.attached = !0, this.deployed || this.deploy(), this);
  }, t.detach = function() {
    return this.attached ? (this.renderer && this.renderer.detach(), this.attached = !1, this) : this;
  }, t.addRule = function(e, n, s) {
    var a = this.queue;
    this.attached && !a && (this.queue = []);
    var o = this.rules.add(e, n, s);
    return o ? (this.options.jss.plugins.onProcessRule(o), this.attached ? (this.deployed && (a ? a.push(o) : (this.insertRule(o), this.queue && (this.queue.forEach(this.insertRule, this), this.queue = void 0))), o) : (this.deployed = !1, o)) : null;
  }, t.replaceRule = function(e, n, s) {
    var a = this.rules.get(e);
    if (!a)
      return this.addRule(e, n, s);
    var o = this.rules.replace(e, n, s);
    return o && this.options.jss.plugins.onProcessRule(o), this.attached ? (this.deployed && this.renderer && (o ? a.renderable && this.renderer.replaceRule(a.renderable, o) : this.renderer.deleteRule(a)), o) : (this.deployed = !1, o);
  }, t.insertRule = function(e) {
    this.renderer && this.renderer.insertRule(e);
  }, t.addRules = function(e, n) {
    var s = [];
    for (var a in e) {
      var o = this.addRule(a, e[a], n);
      o && s.push(o);
    }
    return s;
  }, t.getRule = function(e) {
    return this.rules.get(e);
  }, t.deleteRule = function(e) {
    var n = typeof e == "object" ? e : this.rules.get(e);
    return !n || // Style sheet was created without link: true and attached, in this case we
    // won't be able to remove the CSS rule from the DOM.
    this.attached && !n.renderable ? !1 : (this.rules.remove(n), this.attached && n.renderable && this.renderer ? this.renderer.deleteRule(n.renderable) : !0);
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.deploy = function() {
    return this.renderer && this.renderer.deploy(), this.deployed = !0, this;
  }, t.update = function() {
    var e;
    return (e = this.rules).update.apply(e, arguments), this;
  }, t.updateOne = function(e, n, s) {
    return this.rules.updateOne(e, n, s), this;
  }, t.toString = function(e) {
    return this.rules.toString(e);
  }, i;
}(), Ut = /* @__PURE__ */ function() {
  function i() {
    this.plugins = {
      internal: [],
      external: []
    }, this.registry = {};
  }
  var t = i.prototype;
  return t.onCreateRule = function(e, n, s) {
    for (var a = 0; a < this.registry.onCreateRule.length; a++) {
      var o = this.registry.onCreateRule[a](e, n, s);
      if (o)
        return o;
    }
    return null;
  }, t.onProcessRule = function(e) {
    if (!e.isProcessed) {
      for (var n = e.options.sheet, s = 0; s < this.registry.onProcessRule.length; s++)
        this.registry.onProcessRule[s](e, n);
      e.style && this.onProcessStyle(e.style, e, n), e.isProcessed = !0;
    }
  }, t.onProcessStyle = function(e, n, s) {
    for (var a = 0; a < this.registry.onProcessStyle.length; a++)
      n.style = this.registry.onProcessStyle[a](n.style, n, s);
  }, t.onProcessSheet = function(e) {
    for (var n = 0; n < this.registry.onProcessSheet.length; n++)
      this.registry.onProcessSheet[n](e);
  }, t.onUpdate = function(e, n, s, a) {
    for (var o = 0; o < this.registry.onUpdate.length; o++)
      this.registry.onUpdate[o](e, n, s, a);
  }, t.onChangeValue = function(e, n, s) {
    for (var a = e, o = 0; o < this.registry.onChangeValue.length; o++)
      a = this.registry.onChangeValue[o](a, n, s);
    return a;
  }, t.use = function(e, n) {
    n === void 0 && (n = {
      queue: "external"
    });
    var s = this.plugins[n.queue];
    s.indexOf(e) === -1 && (s.push(e), this.registry = [].concat(this.plugins.external, this.plugins.internal).reduce(function(a, o) {
      for (var u in o)
        u in a ? a[u].push(o[u]) : process.env.NODE_ENV !== "production" && v(!1, '[JSS] Unknown hook "' + u + '".');
      return a;
    }, {
      onCreateRule: [],
      onProcessRule: [],
      onProcessStyle: [],
      onProcessSheet: [],
      onChangeValue: [],
      onUpdate: []
    }));
  }, i;
}(), qt = /* @__PURE__ */ function() {
  function i() {
    this.registry = [];
  }
  var t = i.prototype;
  return t.add = function(e) {
    var n = this.registry, s = e.options.index;
    if (n.indexOf(e) === -1) {
      if (n.length === 0 || s >= this.index) {
        n.push(e);
        return;
      }
      for (var a = 0; a < n.length; a++)
        if (n[a].options.index > s) {
          n.splice(a, 0, e);
          return;
        }
    }
  }, t.reset = function() {
    this.registry = [];
  }, t.remove = function(e) {
    var n = this.registry.indexOf(e);
    this.registry.splice(n, 1);
  }, t.toString = function(e) {
    for (var n = e === void 0 ? {} : e, s = n.attached, a = Rt(n, ["attached"]), o = M(a), u = o.linebreak, f = "", d = 0; d < this.registry.length; d++) {
      var c = this.registry[d];
      s != null && c.attached !== s || (f && (f += u), f += c.toString(a));
    }
    return f;
  }, Fe(i, [{
    key: "index",
    /**
     * Current highest index number.
     */
    get: function() {
      return this.registry.length === 0 ? 0 : this.registry[this.registry.length - 1].options.index;
    }
  }]), i;
}(), N = new qt(), me = typeof globalThis < "u" ? globalThis : typeof window < "u" && window.Math === Math ? window : typeof self < "u" && self.Math === Math ? self : Function("return this")(), ye = "2f1acc6c3a606b082e5eef5e54414ffb";
me[ye] == null && (me[ye] = 0);
var _e = me[ye]++, Kt = 1e10, Ne = function(t) {
  t === void 0 && (t = {});
  var r = 0, e = function(s, a) {
    r += 1, r > Kt && process.env.NODE_ENV !== "production" && v(!1, "[JSS] You might have a memory leak. Rule counter is at " + r + ".");
    var o = "", u = "";
    return a && (a.options.classNamePrefix && (u = a.options.classNamePrefix), a.options.jss.id != null && (o = String(a.options.jss.id))), t.minify ? "" + (u || "c") + _e + o + r : u + s.key + "-" + _e + (o ? "-" + o : "") + "-" + r;
  };
  return e;
}, He = function(t) {
  var r;
  return function() {
    return r || (r = t()), r;
  };
}, Ht = function(t, r) {
  try {
    return t.attributeStyleMap ? t.attributeStyleMap.get(r) : t.style.getPropertyValue(r);
  } catch {
    return "";
  }
}, Xt = function(t, r, e) {
  try {
    var n = e;
    if (Array.isArray(e) && (n = C(e)), t.attributeStyleMap)
      t.attributeStyleMap.set(r, n);
    else {
      var s = n ? n.indexOf("!important") : -1, a = s > -1 ? n.substr(0, s - 1) : n;
      t.style.setProperty(r, a, s > -1 ? "important" : "");
    }
  } catch {
    return !1;
  }
  return !0;
}, Yt = function(t, r) {
  try {
    t.attributeStyleMap ? t.attributeStyleMap.delete(r) : t.style.removeProperty(r);
  } catch (e) {
    process.env.NODE_ENV !== "production" && v(!1, '[JSS] DOMException "' + e.message + '" was thrown. Tried to remove property "' + r + '".');
  }
}, Zt = function(t, r) {
  return t.selectorText = r, t.selectorText === r;
}, Xe = He(function() {
  return document.querySelector("head");
});
function Qt(i, t) {
  for (var r = 0; r < i.length; r++) {
    var e = i[r];
    if (e.attached && e.options.index > t.index && e.options.insertionPoint === t.insertionPoint)
      return e;
  }
  return null;
}
function er(i, t) {
  for (var r = i.length - 1; r >= 0; r--) {
    var e = i[r];
    if (e.attached && e.options.insertionPoint === t.insertionPoint)
      return e;
  }
  return null;
}
function tr(i) {
  for (var t = Xe(), r = 0; r < t.childNodes.length; r++) {
    var e = t.childNodes[r];
    if (e.nodeType === 8 && e.nodeValue.trim() === i)
      return e;
  }
  return null;
}
function rr(i) {
  var t = N.registry;
  if (t.length > 0) {
    var r = Qt(t, i);
    if (r && r.renderer)
      return {
        parent: r.renderer.element.parentNode,
        node: r.renderer.element
      };
    if (r = er(t, i), r && r.renderer)
      return {
        parent: r.renderer.element.parentNode,
        node: r.renderer.element.nextSibling
      };
  }
  var e = i.insertionPoint;
  if (e && typeof e == "string") {
    var n = tr(e);
    if (n)
      return {
        parent: n.parentNode,
        node: n.nextSibling
      };
    process.env.NODE_ENV !== "production" && v(!1, '[JSS] Insertion point "' + e + '" not found.');
  }
  return !1;
}
function nr(i, t) {
  var r = t.insertionPoint, e = rr(t);
  if (e !== !1 && e.parent) {
    e.parent.insertBefore(i, e.node);
    return;
  }
  if (r && typeof r.nodeType == "number") {
    var n = r, s = n.parentNode;
    s ? s.insertBefore(i, n.nextSibling) : process.env.NODE_ENV !== "production" && v(!1, "[JSS] Insertion point is not in the DOM.");
    return;
  }
  Xe().appendChild(i);
}
var ir = He(function() {
  var i = document.querySelector('meta[property="csp-nonce"]');
  return i ? i.getAttribute("content") : null;
}), Ve = function(t, r, e) {
  try {
    "insertRule" in t ? t.insertRule(r, e) : "appendRule" in t && t.appendRule(r);
  } catch (n) {
    return process.env.NODE_ENV !== "production" && v(!1, "[JSS] " + n.message), !1;
  }
  return t.cssRules[e];
}, De = function(t, r) {
  var e = t.cssRules.length;
  return r === void 0 || r > e ? e : r;
}, sr = function() {
  var t = document.createElement("style");
  return t.textContent = `
`, t;
}, ar = /* @__PURE__ */ function() {
  function i(r) {
    this.getPropertyValue = Ht, this.setProperty = Xt, this.removeProperty = Yt, this.setSelector = Zt, this.hasInsertedRules = !1, this.cssRules = [], r && N.add(r), this.sheet = r;
    var e = this.sheet ? this.sheet.options : {}, n = e.media, s = e.meta, a = e.element;
    this.element = a || sr(), this.element.setAttribute("data-jss", ""), n && this.element.setAttribute("media", n), s && this.element.setAttribute("data-meta", s);
    var o = ir();
    o && this.element.setAttribute("nonce", o);
  }
  var t = i.prototype;
  return t.attach = function() {
    if (!(this.element.parentNode || !this.sheet)) {
      nr(this.element, this.sheet.options);
      var e = !!(this.sheet && this.sheet.deployed);
      this.hasInsertedRules && e && (this.hasInsertedRules = !1, this.deploy());
    }
  }, t.detach = function() {
    if (this.sheet) {
      var e = this.element.parentNode;
      e && e.removeChild(this.element), this.sheet.options.link && (this.cssRules = [], this.element.textContent = `
`);
    }
  }, t.deploy = function() {
    var e = this.sheet;
    if (e) {
      if (e.options.link) {
        this.insertRules(e.rules);
        return;
      }
      this.element.textContent = `
` + e.toString() + `
`;
    }
  }, t.insertRules = function(e, n) {
    for (var s = 0; s < e.index.length; s++)
      this.insertRule(e.index[s], s, n);
  }, t.insertRule = function(e, n, s) {
    if (s === void 0 && (s = this.element.sheet), e.rules) {
      var a = e, o = s;
      if (e.type === "conditional" || e.type === "keyframes") {
        var u = De(s, n);
        if (o = Ve(s, a.toString({
          children: !1
        }), u), o === !1)
          return !1;
        this.refCssRule(e, u, o);
      }
      return this.insertRules(a.rules, o), o;
    }
    var f = e.toString();
    if (!f)
      return !1;
    var d = De(s, n), c = Ve(s, f, d);
    return c === !1 ? !1 : (this.hasInsertedRules = !0, this.refCssRule(e, d, c), c);
  }, t.refCssRule = function(e, n, s) {
    e.renderable = s, e.options.parent instanceof Ke && this.cssRules.splice(n, 0, s);
  }, t.deleteRule = function(e) {
    var n = this.element.sheet, s = this.indexOf(e);
    return s === -1 ? !1 : (n.deleteRule(s), this.cssRules.splice(s, 1), !0);
  }, t.indexOf = function(e) {
    return this.cssRules.indexOf(e);
  }, t.replaceRule = function(e, n) {
    var s = this.indexOf(e);
    return s === -1 ? !1 : (this.element.sheet.deleteRule(s), this.cssRules.splice(s, 1), this.insertRule(n, s));
  }, t.getRules = function() {
    return this.element.sheet.cssRules;
  }, i;
}(), or = 0, lr = /* @__PURE__ */ function() {
  function i(r) {
    this.id = or++, this.version = "10.10.0", this.plugins = new Ut(), this.options = {
      id: {
        minify: !1
      },
      createGenerateId: Ne,
      Renderer: G ? ar : null,
      plugins: []
    }, this.generateId = Ne({
      minify: !1
    });
    for (var e = 0; e < ze.length; e++)
      this.plugins.use(ze[e], {
        queue: "internal"
      });
    this.setup(r);
  }
  var t = i.prototype;
  return t.setup = function(e) {
    return e === void 0 && (e = {}), e.createGenerateId && (this.options.createGenerateId = e.createGenerateId), e.id && (this.options.id = b({}, this.options.id, e.id)), (e.createGenerateId || e.id) && (this.generateId = this.options.createGenerateId(this.options.id)), e.insertionPoint != null && (this.options.insertionPoint = e.insertionPoint), "Renderer" in e && (this.options.Renderer = e.Renderer), e.plugins && this.use.apply(this, e.plugins), this;
  }, t.createStyleSheet = function(e, n) {
    n === void 0 && (n = {});
    var s = n, a = s.index;
    typeof a != "number" && (a = N.index === 0 ? 0 : N.index + 1);
    var o = new Ke(e, b({}, n, {
      jss: this,
      generateId: n.generateId || this.generateId,
      insertionPoint: this.options.insertionPoint,
      Renderer: this.options.Renderer,
      index: a
    }));
    return this.plugins.onProcessSheet(o), o;
  }, t.removeStyleSheet = function(e) {
    return e.detach(), N.remove(e), this;
  }, t.createRule = function(e, n, s) {
    if (n === void 0 && (n = {}), s === void 0 && (s = {}), typeof e == "object")
      return this.createRule(void 0, e, n);
    var a = b({}, s, {
      name: e,
      jss: this,
      Renderer: this.options.Renderer
    });
    a.generateId || (a.generateId = this.generateId), a.classes || (a.classes = {}), a.keyframes || (a.keyframes = {});
    var o = H(e, n, a);
    return o && this.plugins.onProcessRule(o), o;
  }, t.use = function() {
    for (var e = this, n = arguments.length, s = new Array(n), a = 0; a < n; a++)
      s[a] = arguments[a];
    return s.forEach(function(o) {
      e.plugins.use(o);
    }), this;
  }, i;
}(), ur = function(t) {
  return new lr(t);
}, ke = typeof CSS == "object" && CSS != null && "number" in CSS;
/**
 * A better abstraction over CSS.
 *
 * @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
 * @website https://github.com/cssinjs/jss
 * @license MIT
 */
var fr = ur();
const Ye = fr;
var Ze = Date.now(), te = "fnValues" + Ze, re = "fnStyle" + ++Ze, cr = function() {
  return {
    onCreateRule: function(r, e, n) {
      if (typeof e != "function")
        return null;
      var s = H(r, {}, n);
      return s[re] = e, s;
    },
    onProcessStyle: function(r, e) {
      if (te in e || re in e)
        return r;
      var n = {};
      for (var s in r) {
        var a = r[s];
        typeof a == "function" && (delete r[s], n[s] = a);
      }
      return e[te] = n, r;
    },
    onUpdate: function(r, e, n, s) {
      var a = e, o = a[re];
      if (o && (a.style = o(r) || {}, process.env.NODE_ENV === "development")) {
        for (var u in a.style)
          if (typeof a.style[u] == "function") {
            process.env.NODE_ENV !== "production" && v(!1, "[JSS] Function values inside function rules are not supported.");
            break;
          }
      }
      var f = a[te];
      if (f)
        for (var d in f)
          a.prop(d, f[d](r), s);
    }
  };
};
const dr = cr;
function hr(i) {
  var t, r = i.Symbol;
  return typeof r == "function" ? r.observable ? t = r.observable : (t = r("observable"), r.observable = t) : t = "@@observable", t;
}
var T;
typeof self < "u" ? T = self : typeof window < "u" ? T = window : typeof global < "u" ? T = global : typeof module < "u" ? T = module : T = Function("return this")();
var We = hr(T), $e = function(t) {
  return t && t[We] && t === t[We]();
}, pr = function(t) {
  return {
    onCreateRule: function(e, n, s) {
      if (!$e(n))
        return null;
      var a = n, o = H(e, {}, s);
      return a.subscribe(function(u) {
        for (var f in u)
          o.prop(f, u[f], t);
      }), o;
    },
    onProcessRule: function(e) {
      if (!(e && e.type !== "style")) {
        var n = e, s = n.style, a = function(d) {
          var c = s[d];
          if (!$e(c))
            return "continue";
          delete s[d], c.subscribe({
            next: function(m) {
              n.prop(d, m, t);
            }
          });
        };
        for (var o in s)
          var u = a(o);
      }
    }
  };
};
const gr = pr;
var mr = /;\n/, yr = function(t) {
  for (var r = {}, e = t.split(mr), n = 0; n < e.length; n++) {
    var s = (e[n] || "").trim();
    if (s) {
      var a = s.indexOf(":");
      if (a === -1) {
        process.env.NODE_ENV !== "production" && v(!1, '[JSS] Malformed CSS string "' + s + '"');
        continue;
      }
      var o = s.substr(0, a).trim(), u = s.substr(a + 1).trim();
      r[o] = u;
    }
  }
  return r;
}, vr = function(t) {
  typeof t.style == "string" && (t.style = yr(t.style));
};
function br() {
  return {
    onProcessRule: vr
  };
}
function A() {
  return A = Object.assign ? Object.assign.bind() : function(i) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (i[e] = r[e]);
    }
    return i;
  }, A.apply(this, arguments);
}
var R = "@global", ve = "@global ", wr = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "global", this.at = R, this.isProcessed = !1, this.key = r, this.options = n, this.rules = new X(A({}, n, {
      parent: this
    }));
    for (var s in e)
      this.rules.add(s, e[s]);
    this.rules.process();
  }
  var t = i.prototype;
  return t.getRule = function(e) {
    return this.rules.get(e);
  }, t.addRule = function(e, n, s) {
    var a = this.rules.add(e, n, s);
    return a && this.options.jss.plugins.onProcessRule(a), a;
  }, t.replaceRule = function(e, n, s) {
    var a = this.rules.replace(e, n, s);
    return a && this.options.jss.plugins.onProcessRule(a), a;
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.toString = function(e) {
    return this.rules.toString(e);
  }, i;
}(), Sr = /* @__PURE__ */ function() {
  function i(r, e, n) {
    this.type = "global", this.at = R, this.isProcessed = !1, this.key = r, this.options = n;
    var s = r.substr(ve.length);
    this.rule = n.jss.createRule(s, e, A({}, n, {
      parent: this
    }));
  }
  var t = i.prototype;
  return t.toString = function(e) {
    return this.rule ? this.rule.toString(e) : "";
  }, i;
}(), xr = /\s*,\s*/g;
function Qe(i, t) {
  for (var r = i.split(xr), e = "", n = 0; n < r.length; n++)
    e += t + " " + r[n].trim(), r[n + 1] && (e += ", ");
  return e;
}
function Rr(i, t) {
  var r = i.options, e = i.style, n = e ? e[R] : null;
  if (n) {
    for (var s in n)
      t.addRule(s, n[s], A({}, r, {
        selector: Qe(s, i.selector)
      }));
    delete e[R];
  }
}
function Pr(i, t) {
  var r = i.options, e = i.style;
  for (var n in e)
    if (!(n[0] !== "@" || n.substr(0, R.length) !== R)) {
      var s = Qe(n.substr(R.length), i.selector);
      t.addRule(s, e[n], A({}, r, {
        selector: s
      })), delete e[n];
    }
}
function kr() {
  function i(r, e, n) {
    if (!r)
      return null;
    if (r === R)
      return new wr(r, e, n);
    if (r[0] === "@" && r.substr(0, ve.length) === ve)
      return new Sr(r, e, n);
    var s = n.parent;
    return s && (s.type === "global" || s.options.parent && s.options.parent.type === "global") && (n.scoped = !1), !n.selector && n.scoped === !1 && (n.selector = r), null;
  }
  function t(r, e) {
    r.type !== "style" || !e || (Rr(r, e), Pr(r, e));
  }
  return {
    onCreateRule: i,
    onProcessRule: t
  };
}
function be() {
  return be = Object.assign ? Object.assign.bind() : function(i) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (i[e] = r[e]);
    }
    return i;
  }, be.apply(this, arguments);
}
var q = function(t) {
  return t && typeof t == "object" && !Array.isArray(t);
}, ne = "extendCurrValue" + Date.now();
function Er(i, t, r, e) {
  var n = typeof i.extend;
  if (n === "string") {
    if (!r)
      return;
    var s = r.getRule(i.extend);
    if (!s)
      return;
    if (s === t) {
      process.env.NODE_ENV !== "production" && v(!1, `[JSS] A rule tries to extend itself 
` + t.toString());
      return;
    }
    var a = s.options.parent;
    if (a) {
      var o = a.rules.raw[i.extend];
      E(o, t, r, e);
    }
    return;
  }
  if (Array.isArray(i.extend)) {
    for (var u = 0; u < i.extend.length; u++) {
      var f = i.extend[u], d = typeof f == "string" ? be({}, i, {
        extend: f
      }) : i.extend[u];
      E(d, t, r, e);
    }
    return;
  }
  for (var c in i.extend) {
    if (c === "extend") {
      E(i.extend.extend, t, r, e);
      continue;
    }
    if (q(i.extend[c])) {
      c in e || (e[c] = {}), E(i.extend[c], t, r, e[c]);
      continue;
    }
    e[c] = i.extend[c];
  }
}
function Cr(i, t, r, e) {
  for (var n in i)
    if (n !== "extend") {
      if (q(e[n]) && q(i[n])) {
        E(i[n], t, r, e[n]);
        continue;
      }
      if (q(i[n])) {
        e[n] = E(i[n], t, r);
        continue;
      }
      e[n] = i[n];
    }
}
function E(i, t, r, e) {
  return e === void 0 && (e = {}), Er(i, t, r, e), Cr(i, t, r, e), e;
}
function Lr() {
  function i(r, e, n) {
    return "extend" in r ? E(r, e, n) : r;
  }
  function t(r, e, n) {
    if (e !== "extend")
      return r;
    if (r == null || r === !1) {
      for (var s in n[ne])
        n.prop(s, null);
      return n[ne] = null, null;
    }
    if (typeof r == "object") {
      for (var a in r)
        n.prop(a, r[a]);
      n[ne] = r;
    }
    return null;
  }
  return {
    onProcessStyle: i,
    onChangeValue: t
  };
}
function j() {
  return j = Object.assign ? Object.assign.bind() : function(i) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (i[e] = r[e]);
    }
    return i;
  }, j.apply(this, arguments);
}
var Ge = /\s*,\s*/g, Or = /&/g, Tr = /\$([\w-]+)/g;
function jr() {
  function i(n, s) {
    return function(a, o) {
      var u = n.getRule(o) || s && s.getRule(o);
      return u ? u.selector : (process.env.NODE_ENV !== "production" && v(!1, '[JSS] Could not find the referenced rule "' + o + '" in "' + (n.options.meta || n.toString()) + '".'), o);
    };
  }
  function t(n, s) {
    for (var a = s.split(Ge), o = n.split(Ge), u = "", f = 0; f < a.length; f++)
      for (var d = a[f], c = 0; c < o.length; c++) {
        var g = o[c];
        u && (u += ", "), u += g.indexOf("&") !== -1 ? g.replace(Or, d) : d + " " + g;
      }
    return u;
  }
  function r(n, s, a) {
    if (a)
      return j({}, a, {
        index: a.index + 1
      });
    var o = n.options.nestingLevel;
    o = o === void 0 ? 1 : o + 1;
    var u = j({}, n.options, {
      nestingLevel: o,
      index: s.indexOf(n) + 1
      // We don't need the parent name to be set options for chlid.
    });
    return delete u.name, u;
  }
  function e(n, s, a) {
    if (s.type !== "style")
      return n;
    var o = s, u = o.options.parent, f, d;
    for (var c in n) {
      var g = c.indexOf("&") !== -1, m = c[0] === "@";
      if (!(!g && !m)) {
        if (f = r(o, u, f), g) {
          var y = t(c, o.selector);
          d || (d = i(u, a)), y = y.replace(Tr, d);
          var w = o.key + "-" + c;
          "replaceRule" in u ? u.replaceRule(w, n[c], j({}, f, {
            selector: y
          })) : u.addRule(w, n[c], j({}, f, {
            selector: y
          }));
        } else
          m && u.addRule(c, {}, f).addRule(o.key, n[c], {
            selector: o.selector
          });
        delete n[c];
      }
    }
    return n;
  }
  return {
    onProcessStyle: e
  };
}
function we(i, t) {
  if (!t)
    return !0;
  if (Array.isArray(t)) {
    for (var r = 0; r < t.length; r++) {
      var e = we(i, t[r]);
      if (!e)
        return !1;
    }
    return !0;
  }
  if (t.indexOf(" ") > -1)
    return we(i, t.split(" "));
  var n = i.options.parent;
  if (t[0] === "$") {
    var s = n.getRule(t.substr(1));
    return s ? s === i ? (process.env.NODE_ENV !== "production" && v(!1, `[JSS] Cyclic composition detected. 
` + i.toString()), !1) : (n.classes[i.key] += " " + n.classes[s.key], !0) : (process.env.NODE_ENV !== "production" && v(!1, `[JSS] Referenced rule is not defined. 
` + i.toString()), !1);
  }
  return n.classes[i.key] += " " + t, !0;
}
function Ar() {
  function i(t, r) {
    return "composes" in t && (we(r, t.composes), delete t.composes), t;
  }
  return {
    onProcessStyle: i
  };
}
var Mr = /[A-Z]/g, zr = /^ms-/, ie = {};
function Ir(i) {
  return "-" + i.toLowerCase();
}
function et(i) {
  if (ie.hasOwnProperty(i))
    return ie[i];
  var t = i.replace(Mr, Ir);
  return ie[i] = zr.test(t) ? "-" + t : t;
}
function K(i) {
  var t = {};
  for (var r in i) {
    var e = r.indexOf("--") === 0 ? r : et(r);
    t[e] = i[r];
  }
  return i.fallbacks && (Array.isArray(i.fallbacks) ? t.fallbacks = i.fallbacks.map(K) : t.fallbacks = K(i.fallbacks)), t;
}
function _r() {
  function i(r) {
    if (Array.isArray(r)) {
      for (var e = 0; e < r.length; e++)
        r[e] = K(r[e]);
      return r;
    }
    return K(r);
  }
  function t(r, e, n) {
    if (e.indexOf("--") === 0)
      return r;
    var s = et(e);
    return e === s ? r : (n.prop(s, r), null);
  }
  return {
    onProcessStyle: i,
    onChangeValue: t
  };
}
var l = ke && CSS ? CSS.px : "px", F = ke && CSS ? CSS.ms : "ms", L = ke && CSS ? CSS.percent : "%", Nr = {
  // Animation properties
  "animation-delay": F,
  "animation-duration": F,
  // Background properties
  "background-position": l,
  "background-position-x": l,
  "background-position-y": l,
  "background-size": l,
  // Border Properties
  border: l,
  "border-bottom": l,
  "border-bottom-left-radius": l,
  "border-bottom-right-radius": l,
  "border-bottom-width": l,
  "border-left": l,
  "border-left-width": l,
  "border-radius": l,
  "border-right": l,
  "border-right-width": l,
  "border-top": l,
  "border-top-left-radius": l,
  "border-top-right-radius": l,
  "border-top-width": l,
  "border-width": l,
  "border-block": l,
  "border-block-end": l,
  "border-block-end-width": l,
  "border-block-start": l,
  "border-block-start-width": l,
  "border-block-width": l,
  "border-inline": l,
  "border-inline-end": l,
  "border-inline-end-width": l,
  "border-inline-start": l,
  "border-inline-start-width": l,
  "border-inline-width": l,
  "border-start-start-radius": l,
  "border-start-end-radius": l,
  "border-end-start-radius": l,
  "border-end-end-radius": l,
  // Margin properties
  margin: l,
  "margin-bottom": l,
  "margin-left": l,
  "margin-right": l,
  "margin-top": l,
  "margin-block": l,
  "margin-block-end": l,
  "margin-block-start": l,
  "margin-inline": l,
  "margin-inline-end": l,
  "margin-inline-start": l,
  // Padding properties
  padding: l,
  "padding-bottom": l,
  "padding-left": l,
  "padding-right": l,
  "padding-top": l,
  "padding-block": l,
  "padding-block-end": l,
  "padding-block-start": l,
  "padding-inline": l,
  "padding-inline-end": l,
  "padding-inline-start": l,
  // Mask properties
  "mask-position-x": l,
  "mask-position-y": l,
  "mask-size": l,
  // Width and height properties
  height: l,
  width: l,
  "min-height": l,
  "max-height": l,
  "min-width": l,
  "max-width": l,
  // Position properties
  bottom: l,
  left: l,
  top: l,
  right: l,
  inset: l,
  "inset-block": l,
  "inset-block-end": l,
  "inset-block-start": l,
  "inset-inline": l,
  "inset-inline-end": l,
  "inset-inline-start": l,
  // Shadow properties
  "box-shadow": l,
  "text-shadow": l,
  // Column properties
  "column-gap": l,
  "column-rule": l,
  "column-rule-width": l,
  "column-width": l,
  // Font and text properties
  "font-size": l,
  "font-size-delta": l,
  "letter-spacing": l,
  "text-decoration-thickness": l,
  "text-indent": l,
  "text-stroke": l,
  "text-stroke-width": l,
  "word-spacing": l,
  // Motion properties
  motion: l,
  "motion-offset": l,
  // Outline properties
  outline: l,
  "outline-offset": l,
  "outline-width": l,
  // Perspective properties
  perspective: l,
  "perspective-origin-x": L,
  "perspective-origin-y": L,
  // Transform properties
  "transform-origin": L,
  "transform-origin-x": L,
  "transform-origin-y": L,
  "transform-origin-z": L,
  // Transition properties
  "transition-delay": F,
  "transition-duration": F,
  // Alignment properties
  "vertical-align": l,
  "flex-basis": l,
  // Some random properties
  "shape-margin": l,
  size: l,
  gap: l,
  // Grid properties
  grid: l,
  "grid-gap": l,
  "row-gap": l,
  "grid-row-gap": l,
  "grid-column-gap": l,
  "grid-template-rows": l,
  "grid-template-columns": l,
  "grid-auto-rows": l,
  "grid-auto-columns": l,
  // Not existing properties.
  // Used to avoid issues with jss-plugin-expand integration.
  "box-shadow-x": l,
  "box-shadow-y": l,
  "box-shadow-blur": l,
  "box-shadow-spread": l,
  "font-line-height": l,
  "text-shadow-x": l,
  "text-shadow-y": l,
  "text-shadow-blur": l
};
function tt(i) {
  var t = /(-[a-z])/g, r = function(a) {
    return a[1].toUpperCase();
  }, e = {};
  for (var n in i)
    e[n] = i[n], e[n.replace(t, r)] = i[n];
  return e;
}
var Vr = tt(Nr);
function V(i, t, r) {
  if (t == null)
    return t;
  if (Array.isArray(t))
    for (var e = 0; e < t.length; e++)
      t[e] = V(i, t[e], r);
  else if (typeof t == "object")
    if (i === "fallbacks")
      for (var n in t)
        t[n] = V(n, t[n], r);
    else
      for (var s in t)
        t[s] = V(i + "-" + s, t[s], r);
  else if (typeof t == "number" && isNaN(t) === !1) {
    var a = r[i] || Vr[i];
    return a && !(t === 0 && a === l) ? typeof a == "function" ? a(t).toString() : "" + t + a : t.toString();
  }
  return t;
}
function Dr(i) {
  i === void 0 && (i = {});
  var t = tt(i);
  function r(n, s) {
    if (s.type !== "style")
      return n;
    for (var a in n)
      n[a] = V(a, n[a], t);
    return n;
  }
  function e(n, s) {
    return V(s, n, t);
  }
  return {
    onProcessStyle: r,
    onChangeValue: e
  };
}
var Wr = {
  "background-size": !0,
  "background-position": !0,
  border: !0,
  "border-bottom": !0,
  "border-left": !0,
  "border-top": !0,
  "border-right": !0,
  "border-radius": !0,
  "border-image": !0,
  "border-width": !0,
  "border-style": !0,
  "border-color": !0,
  "box-shadow": !0,
  flex: !0,
  margin: !0,
  padding: !0,
  outline: !0,
  "transform-origin": !0,
  transform: !0,
  transition: !0
  /**
   * A scheme for converting arrays to regular styles inside of objects.
   * For e.g.: "{position: [0, 0]}" => "background-position: 0 0;".
   */
}, $r = {
  position: !0,
  // background-position
  size: !0
  // background-size
  /**
   * A scheme for parsing and building correct styles from passed objects.
   */
}, U = {
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  background: {
    attachment: null,
    color: null,
    image: null,
    position: null,
    repeat: null
  },
  border: {
    width: null,
    style: null,
    color: null
  },
  "border-top": {
    width: null,
    style: null,
    color: null
  },
  "border-right": {
    width: null,
    style: null,
    color: null
  },
  "border-bottom": {
    width: null,
    style: null,
    color: null
  },
  "border-left": {
    width: null,
    style: null,
    color: null
  },
  outline: {
    width: null,
    style: null,
    color: null
  },
  "list-style": {
    type: null,
    position: null,
    image: null
  },
  transition: {
    property: null,
    duration: null,
    "timing-function": null,
    timingFunction: null,
    // Needed for avoiding comilation issues with jss-plugin-camel-case
    delay: null
  },
  animation: {
    name: null,
    duration: null,
    "timing-function": null,
    timingFunction: null,
    // Needed to avoid compilation issues with jss-plugin-camel-case
    delay: null,
    "iteration-count": null,
    iterationCount: null,
    // Needed to avoid compilation issues with jss-plugin-camel-case
    direction: null,
    "fill-mode": null,
    fillMode: null,
    // Needed to avoid compilation issues with jss-plugin-camel-case
    "play-state": null,
    playState: null
    // Needed to avoid compilation issues with jss-plugin-camel-case
  },
  "box-shadow": {
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: null,
    inset: null
  },
  "text-shadow": {
    x: 0,
    y: 0,
    blur: null,
    color: null
  }
  /**
   * A scheme for converting non-standart properties inside object.
   * For e.g.: include 'border-radius' property inside 'border' object.
   */
}, se = {
  border: {
    radius: "border-radius",
    image: "border-image",
    width: "border-width",
    style: "border-style",
    color: "border-color"
  },
  "border-bottom": {
    width: "border-bottom-width",
    style: "border-bottom-style",
    color: "border-bottom-color"
  },
  "border-top": {
    width: "border-top-width",
    style: "border-top-style",
    color: "border-top-color"
  },
  "border-left": {
    width: "border-left-width",
    style: "border-left-style",
    color: "border-left-color"
  },
  "border-right": {
    width: "border-right-width",
    style: "border-right-style",
    color: "border-right-color"
  },
  background: {
    size: "background-size",
    image: "background-image"
  },
  font: {
    style: "font-style",
    variant: "font-variant",
    weight: "font-weight",
    stretch: "font-stretch",
    size: "font-size",
    family: "font-family",
    lineHeight: "line-height",
    // Needed to avoid compilation issues with jss-plugin-camel-case
    "line-height": "line-height"
  },
  flex: {
    grow: "flex-grow",
    basis: "flex-basis",
    direction: "flex-direction",
    wrap: "flex-wrap",
    flow: "flex-flow",
    shrink: "flex-shrink"
  },
  align: {
    self: "align-self",
    items: "align-items",
    content: "align-content"
  },
  grid: {
    "template-columns": "grid-template-columns",
    templateColumns: "grid-template-columns",
    "template-rows": "grid-template-rows",
    templateRows: "grid-template-rows",
    "template-areas": "grid-template-areas",
    templateAreas: "grid-template-areas",
    template: "grid-template",
    "auto-columns": "grid-auto-columns",
    autoColumns: "grid-auto-columns",
    "auto-rows": "grid-auto-rows",
    autoRows: "grid-auto-rows",
    "auto-flow": "grid-auto-flow",
    autoFlow: "grid-auto-flow",
    row: "grid-row",
    column: "grid-column",
    "row-start": "grid-row-start",
    rowStart: "grid-row-start",
    "row-end": "grid-row-end",
    rowEnd: "grid-row-end",
    "column-start": "grid-column-start",
    columnStart: "grid-column-start",
    "column-end": "grid-column-end",
    columnEnd: "grid-column-end",
    area: "grid-area",
    gap: "grid-gap",
    "row-gap": "grid-row-gap",
    rowGap: "grid-row-gap",
    "column-gap": "grid-column-gap",
    columnGap: "grid-column-gap"
  }
};
function Gr(i, t, r) {
  return i.map(function(e) {
    return nt(e, t, r, !1, !0);
  });
}
function rt(i, t, r, e) {
  return r[t] == null ? i : i.length === 0 ? [] : Array.isArray(i[0]) ? rt(i[0], t, r, e) : typeof i[0] == "object" ? Gr(i, t, e) : [i];
}
function nt(i, t, r, e, n) {
  if (!(U[t] || se[t]))
    return [];
  var s = [];
  if (se[t] && (i = Br(i, r, se[t], e)), Object.keys(i).length)
    for (var a in U[t]) {
      if (i[a]) {
        Array.isArray(i[a]) ? s.push($r[a] === null ? i[a] : i[a].join(" ")) : s.push(i[a]);
        continue;
      }
      U[t][a] != null && s.push(U[t][a]);
    }
  return !s.length || n ? s : [s];
}
function Br(i, t, r, e) {
  for (var n in r) {
    var s = r[n];
    if (typeof i[n] < "u" && (e || !t.prop(s))) {
      var a, o = $((a = {}, a[s] = i[n], a), t)[s];
      e ? t.style.fallbacks[s] = o : t.style[s] = o;
    }
    delete i[n];
  }
  return i;
}
function $(i, t, r) {
  for (var e in i) {
    var n = i[e];
    if (Array.isArray(n)) {
      if (!Array.isArray(n[0])) {
        if (e === "fallbacks") {
          for (var s = 0; s < i.fallbacks.length; s++)
            i.fallbacks[s] = $(i.fallbacks[s], t, !0);
          continue;
        }
        i[e] = rt(n, e, Wr, t), i[e].length || delete i[e];
      }
    } else if (typeof n == "object") {
      if (e === "fallbacks") {
        i.fallbacks = $(i.fallbacks, t, !0);
        continue;
      }
      i[e] = nt(n, e, t, r), i[e].length || delete i[e];
    } else
      i[e] === "" && delete i[e];
  }
  return i;
}
function Jr() {
  function i(t, r) {
    if (!t || r.type !== "style")
      return t;
    if (Array.isArray(t)) {
      for (var e = 0; e < t.length; e++)
        t[e] = $(t[e], r);
      return t;
    }
    return $(t, r);
  }
  return {
    onProcessStyle: i
  };
}
function Se(i, t) {
  (t == null || t > i.length) && (t = i.length);
  for (var r = 0, e = new Array(t); r < t; r++)
    e[r] = i[r];
  return e;
}
function Fr(i) {
  if (Array.isArray(i))
    return Se(i);
}
function Ur(i) {
  if (typeof Symbol < "u" && i[Symbol.iterator] != null || i["@@iterator"] != null)
    return Array.from(i);
}
function qr(i, t) {
  if (i) {
    if (typeof i == "string")
      return Se(i, t);
    var r = Object.prototype.toString.call(i).slice(8, -1);
    if (r === "Object" && i.constructor && (r = i.constructor.name), r === "Map" || r === "Set")
      return Array.from(i);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
      return Se(i, t);
  }
}
function Kr() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Hr(i) {
  return Fr(i) || Ur(i) || qr(i) || Kr();
}
var I = "", xe = "", it = "", st = "", Xr = G && "ontouchstart" in document.documentElement;
if (G) {
  var ae = {
    Moz: "-moz-",
    ms: "-ms-",
    O: "-o-",
    Webkit: "-webkit-"
  }, Yr = document.createElement("p"), oe = Yr.style, Zr = "Transform";
  for (var le in ae)
    if (le + Zr in oe) {
      I = le, xe = ae[le];
      break;
    }
  I === "Webkit" && "msHyphens" in oe && (I = "ms", xe = ae.ms, st = "edge"), I === "Webkit" && "-apple-trailing-word" in oe && (it = "apple");
}
var h = {
  js: I,
  css: xe,
  vendor: it,
  browser: st,
  isTouch: Xr
};
function Qr(i) {
  return i[1] === "-" || h.js === "ms" ? i : "@" + h.css + "keyframes" + i.substr(10);
}
var en = {
  noPrefill: ["appearance"],
  supportedProperty: function(t) {
    return t !== "appearance" ? !1 : h.js === "ms" ? "-webkit-" + t : h.css + t;
  }
}, tn = {
  noPrefill: ["color-adjust"],
  supportedProperty: function(t) {
    return t !== "color-adjust" ? !1 : h.js === "Webkit" ? h.css + "print-" + t : t;
  }
}, rn = /[-\s]+(.)?/g;
function nn(i, t) {
  return t ? t.toUpperCase() : "";
}
function Ee(i) {
  return i.replace(rn, nn);
}
function P(i) {
  return Ee("-" + i);
}
var sn = {
  noPrefill: ["mask"],
  supportedProperty: function(t, r) {
    if (!/^mask/.test(t))
      return !1;
    if (h.js === "Webkit") {
      var e = "mask-image";
      if (Ee(e) in r)
        return t;
      if (h.js + P(e) in r)
        return h.css + t;
    }
    return t;
  }
}, an = {
  noPrefill: ["text-orientation"],
  supportedProperty: function(t) {
    return t !== "text-orientation" ? !1 : h.vendor === "apple" && !h.isTouch ? h.css + t : t;
  }
}, on = {
  noPrefill: ["transform"],
  supportedProperty: function(t, r, e) {
    return t !== "transform" ? !1 : e.transform ? t : h.css + t;
  }
}, ln = {
  noPrefill: ["transition"],
  supportedProperty: function(t, r, e) {
    return t !== "transition" ? !1 : e.transition ? t : h.css + t;
  }
}, un = {
  noPrefill: ["writing-mode"],
  supportedProperty: function(t) {
    return t !== "writing-mode" ? !1 : h.js === "Webkit" || h.js === "ms" && h.browser !== "edge" ? h.css + t : t;
  }
}, fn = {
  noPrefill: ["user-select"],
  supportedProperty: function(t) {
    return t !== "user-select" ? !1 : h.js === "Moz" || h.js === "ms" || h.vendor === "apple" ? h.css + t : t;
  }
}, cn = {
  supportedProperty: function(t, r) {
    if (!/^break-/.test(t))
      return !1;
    if (h.js === "Webkit") {
      var e = "WebkitColumn" + P(t);
      return e in r ? h.css + "column-" + t : !1;
    }
    if (h.js === "Moz") {
      var n = "page" + P(t);
      return n in r ? "page-" + t : !1;
    }
    return !1;
  }
}, dn = {
  supportedProperty: function(t, r) {
    if (!/^(border|margin|padding)-inline/.test(t))
      return !1;
    if (h.js === "Moz")
      return t;
    var e = t.replace("-inline", "");
    return h.js + P(e) in r ? h.css + e : !1;
  }
}, hn = {
  supportedProperty: function(t, r) {
    return Ee(t) in r ? t : !1;
  }
}, pn = {
  supportedProperty: function(t, r) {
    var e = P(t);
    return t[0] === "-" || t[0] === "-" && t[1] === "-" ? t : h.js + e in r ? h.css + t : h.js !== "Webkit" && "Webkit" + e in r ? "-webkit-" + t : !1;
  }
}, gn = {
  supportedProperty: function(t) {
    return t.substring(0, 11) !== "scroll-snap" ? !1 : h.js === "ms" ? "" + h.css + t : t;
  }
}, mn = {
  supportedProperty: function(t) {
    return t !== "overscroll-behavior" ? !1 : h.js === "ms" ? h.css + "scroll-chaining" : t;
  }
}, yn = {
  "flex-grow": "flex-positive",
  "flex-shrink": "flex-negative",
  "flex-basis": "flex-preferred-size",
  "justify-content": "flex-pack",
  order: "flex-order",
  "align-items": "flex-align",
  "align-content": "flex-line-pack"
  // 'align-self' is handled by 'align-self' plugin.
}, vn = {
  supportedProperty: function(t, r) {
    var e = yn[t];
    return e && h.js + P(e) in r ? h.css + e : !1;
  }
}, at = {
  flex: "box-flex",
  "flex-grow": "box-flex",
  "flex-direction": ["box-orient", "box-direction"],
  order: "box-ordinal-group",
  "align-items": "box-align",
  "flex-flow": ["box-orient", "box-direction"],
  "justify-content": "box-pack"
}, bn = Object.keys(at), wn = function(t) {
  return h.css + t;
}, Sn = {
  supportedProperty: function(t, r, e) {
    var n = e.multiple;
    if (bn.indexOf(t) > -1) {
      var s = at[t];
      if (!Array.isArray(s))
        return h.js + P(s) in r ? h.css + s : !1;
      if (!n)
        return !1;
      for (var a = 0; a < s.length; a++)
        if (!(h.js + P(s[0]) in r))
          return !1;
      return s.map(wn);
    }
    return !1;
  }
}, ot = [en, tn, sn, an, on, ln, un, fn, cn, dn, hn, pn, gn, mn, vn, Sn], Be = ot.filter(function(i) {
  return i.supportedProperty;
}).map(function(i) {
  return i.supportedProperty;
}), xn = ot.filter(function(i) {
  return i.noPrefill;
}).reduce(function(i, t) {
  return i.push.apply(i, Hr(t.noPrefill)), i;
}, []), _, k = {};
if (G) {
  _ = document.createElement("p");
  var ue = window.getComputedStyle(document.documentElement, "");
  for (var fe in ue)
    isNaN(fe) || (k[ue[fe]] = ue[fe]);
  xn.forEach(function(i) {
    return delete k[i];
  });
}
function Re(i, t) {
  if (t === void 0 && (t = {}), !_)
    return i;
  if (process.env.NODE_ENV !== "benchmark" && k[i] != null)
    return k[i];
  (i === "transition" || i === "transform") && (t[i] = i in _.style);
  for (var r = 0; r < Be.length && (k[i] = Be[r](i, _.style, t), !k[i]); r++)
    ;
  try {
    _.style[i] = "";
  } catch {
    return !1;
  }
  return k[i];
}
var O = {}, Rn = {
  transition: 1,
  "transition-property": 1,
  "-webkit-transition": 1,
  "-webkit-transition-property": 1
}, Pn = /(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g, x;
function kn(i, t, r) {
  if (t === "var")
    return "var";
  if (t === "all")
    return "all";
  if (r === "all")
    return ", all";
  var e = t ? Re(t) : ", " + Re(r);
  return e || t || r;
}
G && (x = document.createElement("p"));
function Je(i, t) {
  var r = t;
  if (!x || i === "content")
    return t;
  if (typeof r != "string" || !isNaN(parseInt(r, 10)))
    return r;
  var e = i + r;
  if (process.env.NODE_ENV !== "benchmark" && O[e] != null)
    return O[e];
  try {
    x.style[i] = r;
  } catch {
    return O[e] = !1, !1;
  }
  if (Rn[i])
    r = r.replace(Pn, kn);
  else if (x.style[i] === "" && (r = h.css + r, r === "-ms-flex" && (x.style[i] = "-ms-flexbox"), x.style[i] = r, x.style[i] === ""))
    return O[e] = !1, !1;
  return x.style[i] = "", O[e] = r, O[e];
}
function En() {
  function i(n) {
    if (n.type === "keyframes") {
      var s = n;
      s.at = Qr(s.at);
    }
  }
  function t(n) {
    for (var s in n) {
      var a = n[s];
      if (s === "fallbacks" && Array.isArray(a)) {
        n[s] = a.map(t);
        continue;
      }
      var o = !1, u = Re(s);
      u && u !== s && (o = !0);
      var f = !1, d = Je(u, C(a));
      d && d !== a && (f = !0), (o || f) && (o && delete n[s], n[u || s] = d || a);
    }
    return n;
  }
  function r(n, s) {
    return s.type !== "style" ? n : t(n);
  }
  function e(n, s) {
    return Je(s, C(n)) || n;
  }
  return {
    onProcessRule: i,
    onProcessStyle: r,
    onChangeValue: e
  };
}
function Cn() {
  var i = function(r, e) {
    return r.length === e.length ? r > e ? 1 : -1 : r.length - e.length;
  };
  return {
    onProcessStyle: function(r, e) {
      if (e.type !== "style")
        return r;
      for (var n = {}, s = Object.keys(r).sort(i), a = 0; a < s.length; a++)
        n[s[a]] = r[s[a]];
      return n;
    }
  };
}
var Ln = function(t) {
  return t === void 0 && (t = {}), {
    plugins: [dr(), gr(t.observable), br(), kr(), Lr(), jr(), Ar(), _r(), Dr(t.defaultUnit), Jr(), En(), Cn()]
  };
};
const On = Ln;
Ye.setup(On());
class Mn extends EventTarget {
  constructor() {
    super();
    p(this, "element", document.createElement("div"));
    p(this, "currentTime", 0);
    p(this, "lyricLines", []);
    p(this, "processedLines", []);
    p(this, "lyricLinesEl", []);
    p(this, "lyricLinesSize", /* @__PURE__ */ new Map());
    p(this, "hotLines", /* @__PURE__ */ new Set());
    p(this, "bufferedLines", /* @__PURE__ */ new Set());
    p(this, "scrollToIndex", 0);
    p(this, "resizeObserver", new ResizeObserver(() => {
      this.size = [this.element.clientWidth, this.element.clientHeight], this.rebuildStyle(), this.calcLayout(!0), this.lyricLinesEl.forEach((r) => r.updateMaskImage());
    }));
    p(this, "alignCenter", !1);
    p(this, "size", [0, 0]);
    p(this, "interludeDots");
    p(this, "supportPlusLighter", CSS.supports("mix-blend-mode", "plus-lighter"));
    p(this, "supportMaskImage", CSS.supports("mask-image", "none"));
    p(this, "style", Ye.createStyleSheet({
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
        mixBlendMode: "plus-lighter"
      },
      lyricLine: {
        position: "absolute",
        transformOrigin: "left",
        transition: "transform 0.5s",
        maxWidth: "65%",
        padding: "2vh"
      },
      lyricDuetLine: {
        textAlign: "right",
        transformOrigin: "right"
      },
      lyricBgLine: {
        opacity: 0,
        fontSize: "max(50%, 10px)",
        transition: "transform 0.5s, opacity 0.25s",
        "&.active": {
          transition: "transform 0.5s, opacity 0.25s 0.25s",
          opacity: 1
        }
      },
      lyricMainLine: {
        // opacity: 0.15,
        // transition: "opacity 0.3s 0.25s",
        // "&.active": {
        // 	opacity: 1,
        // },
        "& > *": {
          display: "inline-block",
          whiteSpace: "pre-wrap"
        }
      },
      lyricSubLine: {
        fontSize: "max(50%, 10px)",
        opacity: 0.5
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
      }
    }));
    this.interludeDots = new mt(this), this.element.setAttribute("class", this.style.classes.lyricPlayer), this.rebuildStyle(), this.resizeObserver.observe(this.element), this.element.appendChild(this.interludeDots.getElement()), this.style.attach();
  }
  rebuildStyle() {
    let r = "";
    r += "--amll-lyric-player-width:", r += this.element.clientWidth, r += "px;", r += "--amll-lyric-player-height:", r += this.element.clientHeight, r += "px;", r += "--amll-lyric-line-color:", r += "#FFFFFF;", r += "--amll-player-time:", r += this.currentTime, r += ";", this.element.setAttribute("style", r);
  }
  /**
   * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
   * @param lines 歌词数组
   */
  setLyricLines(r) {
    this.lyricLines = r;
    const e = 750;
    this.processedLines = r.map((n, s, a) => {
      if (n.isBG)
        return {
          ...n
        };
      {
        const o = a[s - 1], u = a[s - 2];
        if (o != null && o.isBG && u) {
          if (u.endTime < n.startTime)
            return {
              ...n,
              startTime: Math.max(u.endTime, n.startTime - e) || n.startTime
            };
        } else if (o != null && o.endTime && o.endTime < n.startTime)
          return {
            ...n,
            startTime: Math.max(o == null ? void 0 : o.endTime, n.startTime - e) || n.startTime
          };
        return {
          ...n
        };
      }
    }), this.lyricLinesEl.forEach((n) => n.dispose()), this.lyricLinesEl = this.processedLines.map(
      (n) => new bt(this, n)
    ), this.lyricLinesEl.forEach(
      (n) => (this.element.appendChild(n.getElement()), n.updateMaskImage())
    ), this.calcLayout(!0);
  }
  calcLayout(r = !1) {
    r && this.lyricLinesEl.forEach((a) => {
      this.lyricLinesSize.set(a, [
        a.getElement().clientWidth,
        a.getElement().clientHeight
      ]);
    });
    const e = 0.95;
    let s = -this.lyricLinesEl.slice(0, this.scrollToIndex).reduce(
      (a, o) => a + (o.getLine().isBG ? 0 : this.lyricLinesSize.get(o)[1]),
      0
    );
    if (this.alignCenter) {
      s += this.element.clientHeight / 2;
      const a = this.lyricLinesEl[this.scrollToIndex];
      if (a) {
        const o = this.lyricLinesSize.get(a)[1];
        s -= o / 2;
      }
    }
    this.lyricLinesEl.forEach((a, o) => {
      const u = this.bufferedLines.has(o), f = a.getLine();
      let d = 0;
      f.isDuet && (d = this.size[0] - this.lyricLinesSize.get(a)[0]), a.setTransform(d, s, u ? 1 : e, r), f.isBG && u ? s += this.lyricLinesSize.get(a)[1] : f.isBG || (s += this.lyricLinesSize.get(a)[1]);
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
  setCurrentTime(r, e = !1) {
    this.currentTime = r, this.element.style.setProperty("--amll-player-time", `${r}`);
    const n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
    this.hotLines.forEach((a) => {
      var u;
      const o = this.processedLines[a];
      if (o) {
        if (o.startTime > r || o.endTime <= r)
          if (o.isBG)
            this.hotLines.delete(a - 1), n.add(a - 1), e && ((u = this.lyricLinesEl[a - 1]) == null || u.disable()), this.hotLines.delete(a), n.add(a), e && this.lyricLinesEl[a].disable();
          else {
            const f = this.processedLines[a + 1];
            f != null && f.isBG || (this.hotLines.delete(a), n.add(a), e && this.lyricLinesEl[a].disable());
          }
      } else
        this.hotLines.delete(a), n.add(a), e && this.lyricLinesEl[a].disable();
    }), this.processedLines.forEach((a, o, u) => {
      var f;
      !a.isBG && a.startTime <= r && a.endTime > r && (this.hotLines.has(o) || (this.hotLines.add(o), s.add(o), e && this.lyricLinesEl[o].enable(), (f = u[o + 1]) != null && f.isBG && (this.hotLines.add(o + 1), s.add(o + 1), e && this.lyricLinesEl[o + 1].enable())));
    }), e ? (this.bufferedLines.size > 0 ? this.scrollToIndex = Math.min(...this.bufferedLines) : this.scrollToIndex = this.processedLines.findIndex(
      (a) => a.startTime >= r
    ), this.bufferedLines.clear(), this.hotLines.forEach((a) => this.bufferedLines.add(a)), this.calcLayout(!0)) : (n.size > 0 || s.size > 0) && (n.size === 0 && s.size > 0 ? (s.forEach((a) => {
      this.bufferedLines.add(a), this.lyricLinesEl[a].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : s.size === 0 && n.size > 0 ? gt(n, this.bufferedLines) && this.bufferedLines.forEach((a) => {
      this.hotLines.has(a) || (this.bufferedLines.delete(a), this.lyricLinesEl[a].disable());
    }) : s.size === 1 && n.size === 1 ? (this.bufferedLines.clear(), s.forEach((a) => {
      this.bufferedLines.add(a), this.lyricLinesEl[a].enable();
    }), this.scrollToIndex = Math.min(...this.bufferedLines)) : (s.forEach((a) => {
      this.bufferedLines.add(a), this.lyricLinesEl[a].enable();
    }), n.forEach((a) => {
      this.bufferedLines.delete(a), this.lyricLinesEl[a].disable();
    }), this.bufferedLines.size > 0 && (this.scrollToIndex = Math.min(...this.bufferedLines))), this.calcLayout());
  }
  /**
   * 更新动画，这个函数应该逐帧调用
   * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
   */
  update(r = 0) {
    this.bufferedLines.forEach((e) => {
      var n;
      (n = this.lyricLinesEl[e]) == null || n.update(r);
    });
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((r) => r.dispose());
  }
}
export {
  An as BackgroundRender,
  Mn as LyricPlayer
};
