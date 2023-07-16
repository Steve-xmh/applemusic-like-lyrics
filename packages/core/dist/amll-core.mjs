var lt = Object.defineProperty;
var ut = (n, t, r) => t in n ? lt(n, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : n[t] = r;
var p = (n, t, r) => (ut(n, typeof t != "symbol" ? t + "" : t, r), r);
import { Application as ft, ColorMatrixFilter as Q, BlurFilter as S, Texture as ct, Sprite as U, Container as dt } from "pixi.js";
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
        const [r, e, i, s] = this.curContainer.children;
        r.position.set(this.app.screen.width / 2, this.app.screen.height / 2), e.position.set(
          this.app.screen.width / 2.5,
          this.app.screen.height / 2.5
        ), i.position.set(this.app.screen.width / 2, this.app.screen.height / 2), s.position.set(this.app.screen.width / 2, this.app.screen.height / 2), r.width = this.app.screen.width * 1.25, r.height = r.width, e.width = this.app.screen.width * 0.8, e.height = e.width, i.width = this.app.screen.width * 0.5, i.height = i.width, s.width = this.app.screen.width * 0.25, s.height = s.width, this.curContainer.time += t, r.rotation += t / 1e3, e.rotation -= t / 500, i.rotation += t / 1e3, s.rotation -= t / 750, i.x = this.app.screen.width / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), i.y = this.app.screen.height / 2 + this.app.screen.width / 4 * Math.cos(this.curContainer.time / 1e3 * 0.75), s.x = this.app.screen.width / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75), s.y = this.app.screen.height / 2 + this.app.screen.width / 4 * 0.1 + Math.cos(this.curContainer.time * 6e-3 * 0.75);
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
    const t = Math.min(this.canvas.width, this.canvas.height), r = new Q();
    r.saturate(1.2, !1);
    const e = new Q();
    e.brightness(0.6, !1);
    const i = new Q();
    i.contrast(0.3, !0), this.app.stage.filters = [], this.app.stage.filters.push(new S(5, 1)), this.app.stage.filters.push(new S(10, 1)), this.app.stage.filters.push(new S(20, 2)), this.app.stage.filters.push(new S(40, 2)), this.app.stage.filters.push(new S(80, 2)), t > 768 && this.app.stage.filters.push(new S(160, 4)), t > 768 * 2 && this.app.stage.filters.push(new S(320, 4)), this.app.stage.filters.push(r, e, i), this.app.stage.filters.push(new S(5, 1));
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
    const r = await ct.fromURL(t), e = new ht(), i = new U(r), s = new U(r), o = new U(r), a = new U(r);
    i.anchor.set(0.5, 0.5), s.anchor.set(0.5, 0.5), o.anchor.set(0.5, 0.5), a.anchor.set(0.5, 0.5), i.rotation = Math.random() * Math.PI * 2, s.rotation = Math.random() * Math.PI * 2, o.rotation = Math.random() * Math.PI * 2, a.rotation = Math.random() * Math.PI * 2, e.addChild(i, s, o, a), this.curContainer && this.lastContainer.add(this.curContainer), this.curContainer = e, this.app.stage.addChild(this.curContainer), this.curContainer.alpha = 0;
  }
  dispose() {
    this.observer.disconnect(), this.app.ticker.remove(this.onTick);
  }
}
class En extends pt {
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
class gt {
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
    this.lyricPlayer = t, this.lyricLine = r, this.element.setAttribute("class", this.lyricPlayer.style.classes.lyricLine), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.element.appendChild(document.createElement("div")), this.rebuildElement(), this.rebuildStyle();
  }
  setLine(t) {
    this.lyricLine = t, this.rebuildElement(), this.rebuildStyle();
  }
  rebuildStyle() {
    let t = `transform:translate(${this.left}px,${this.top}px) scale(${this.scale});`;
    this.element.setAttribute("style", t);
  }
  rebuildElement() {
    const t = this.element.children[0], r = this.element.children[1], e = this.element.children[2];
    for (; this.lyricLine.words.length > t.childElementCount; )
      t.appendChild(document.createElement("span"));
    for (let i = 0; i < Math.max(t.childElementCount, this.lyricLine.words.length); i++) {
      const s = this.lyricLine.words[i], o = t.children[i];
      s ? o.innerText = s.word : o.innerText = "";
    }
    r.innerText = this.lyricLine.translatedLyric, e.innerText = this.lyricLine.romanLyric;
  }
  getElement() {
    return this.element;
  }
  setTransform(t = this.left, r = this.top, e = this.scale) {
    this.left = t, this.top = r, this.scale = e, this.rebuildStyle();
  }
  update() {
  }
  /**
   * 设置当前播放进度，单位为毫秒，此时将会更新内部的歌词进度信息
   *
   * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
   * @param time 当前播放进度，单位为毫秒
   */
  setCurrentTime(t) {
    this.currentTime = t;
  }
  dispose() {
    this.element.remove();
  }
}
function b() {
  return b = Object.assign ? Object.assign.bind() : function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (n[e] = r[e]);
    }
    return n;
  }, b.apply(this, arguments);
}
var Ee = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(n) {
  return typeof n;
} : function(n) {
  return n && typeof Symbol == "function" && n.constructor === Symbol && n !== Symbol.prototype ? "symbol" : typeof n;
}, W = (typeof window > "u" ? "undefined" : Ee(window)) === "object" && (typeof document > "u" ? "undefined" : Ee(document)) === "object" && document.nodeType === 9, vt = process.env.NODE_ENV === "production";
function y(n, t) {
  if (!vt) {
    if (n)
      return;
    var r = "Warning: " + t;
    typeof console < "u" && console.warn(r);
    try {
      throw Error(r);
    } catch {
    }
  }
}
function D(n) {
  "@babel/helpers - typeof";
  return D = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, D(n);
}
function yt(n, t) {
  if (D(n) !== "object" || n === null)
    return n;
  var r = n[Symbol.toPrimitive];
  if (r !== void 0) {
    var e = r.call(n, t || "default");
    if (D(e) !== "object")
      return e;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(n);
}
function mt(n) {
  var t = yt(n, "string");
  return D(t) === "symbol" ? t : String(t);
}
function je(n, t) {
  for (var r = 0; r < t.length; r++) {
    var e = t[r];
    e.enumerable = e.enumerable || !1, e.configurable = !0, "value" in e && (e.writable = !0), Object.defineProperty(n, mt(e.key), e);
  }
}
function Ge(n, t, r) {
  return t && je(n.prototype, t), r && je(n, r), Object.defineProperty(n, "prototype", {
    writable: !1
  }), n;
}
function ce(n, t) {
  return ce = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, i) {
    return e.__proto__ = i, e;
  }, ce(n, t);
}
function qe(n, t) {
  n.prototype = Object.create(t.prototype), n.prototype.constructor = n, ce(n, t);
}
function Ae(n) {
  if (n === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return n;
}
function bt(n, t) {
  if (n == null)
    return {};
  var r = {}, e = Object.keys(n), i, s;
  for (s = 0; s < e.length; s++)
    i = e[s], !(t.indexOf(i) >= 0) && (r[i] = n[i]);
  return r;
}
var wt = {}.constructor;
function de(n) {
  if (n == null || typeof n != "object")
    return n;
  if (Array.isArray(n))
    return n.map(de);
  if (n.constructor !== wt)
    return n;
  var t = {};
  for (var r in n)
    t[r] = de(n[r]);
  return t;
}
function H(n, t, r) {
  n === void 0 && (n = "unnamed");
  var e = r.jss, i = de(t), s = e.plugins.onCreateRule(n, i, r);
  return s || (n[0] === "@" && process.env.NODE_ENV !== "production" && y(!1, "[JSS] Unknown rule " + n), null);
}
var _e = function(t, r) {
  for (var e = "", i = 0; i < t.length && t[i] !== "!important"; i++)
    e && (e += r), e += t[i];
  return e;
}, O = function(t) {
  if (!Array.isArray(t))
    return t;
  var r = "";
  if (Array.isArray(t[0]))
    for (var e = 0; e < t.length && t[e] !== "!important"; e++)
      r && (r += ", "), r += _e(t[e], " ");
  else
    r = _e(t, ", ");
  return t[t.length - 1] === "!important" && (r += " !important"), r;
};
function T(n) {
  return n && n.format === !1 ? {
    linebreak: "",
    space: ""
  } : {
    linebreak: `
`,
    space: " "
  };
}
function I(n, t) {
  for (var r = "", e = 0; e < t; e++)
    r += "  ";
  return r + n;
}
function $(n, t, r) {
  r === void 0 && (r = {});
  var e = "";
  if (!t)
    return e;
  var i = r, s = i.indent, o = s === void 0 ? 0 : s, a = t.fallbacks;
  r.format === !1 && (o = -1 / 0);
  var u = T(r), f = u.linebreak, d = u.space;
  if (n && o++, a)
    if (Array.isArray(a))
      for (var c = 0; c < a.length; c++) {
        var m = a[c];
        for (var g in m) {
          var v = m[g];
          v != null && (e && (e += f), e += I(g + ":" + d + O(v) + ";", o));
        }
      }
    else
      for (var w in a) {
        var F = a[w];
        F != null && (e && (e += f), e += I(w + ":" + d + O(F) + ";", o));
      }
  for (var Z in t) {
    var Oe = t[Z];
    Oe != null && Z !== "fallbacks" && (e && (e += f), e += I(Z + ":" + d + O(Oe) + ";", o));
  }
  return !e && !r.allowEmpty || !n ? e : (o--, e && (e = "" + f + e + f), I("" + n + d + "{" + e, o) + I("}", o));
}
var St = /([[\].#*$><+~=|^:(),"'`\s])/g, Ne = typeof CSS < "u" && CSS.escape, Pe = function(n) {
  return Ne ? Ne(n) : n.replace(St, "\\$1");
}, Ke = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "style", this.isProcessed = !1;
    var s = i.sheet, o = i.Renderer;
    this.key = r, this.options = i, this.style = e, s ? this.renderer = s.renderer : o && (this.renderer = new o());
  }
  var t = n.prototype;
  return t.prop = function(e, i, s) {
    if (i === void 0)
      return this.style[e];
    var o = s ? s.force : !1;
    if (!o && this.style[e] === i)
      return this;
    var a = i;
    (!s || s.process !== !1) && (a = this.options.jss.plugins.onChangeValue(i, e, this));
    var u = a == null || a === !1, f = e in this.style;
    if (u && !f && !o)
      return this;
    var d = u && f;
    if (d ? delete this.style[e] : this.style[e] = a, this.renderable && this.renderer)
      return d ? this.renderer.removeProperty(this.renderable, e) : this.renderer.setProperty(this.renderable, e, a), this;
    var c = this.options.sheet;
    return c && c.attached && process.env.NODE_ENV !== "production" && y(!1, '[JSS] Rule is not linked. Missing sheet option "link: true".'), this;
  }, n;
}(), he = /* @__PURE__ */ function(n) {
  qe(t, n);
  function t(e, i, s) {
    var o;
    o = n.call(this, e, i, s) || this;
    var a = s.selector, u = s.scoped, f = s.sheet, d = s.generateId;
    return a ? o.selectorText = a : u !== !1 && (o.id = d(Ae(Ae(o)), f), o.selectorText = "." + Pe(o.id)), o;
  }
  var r = t.prototype;
  return r.applyTo = function(i) {
    var s = this.renderer;
    if (s) {
      var o = this.toJSON();
      for (var a in o)
        s.setProperty(i, a, o[a]);
    }
    return this;
  }, r.toJSON = function() {
    var i = {};
    for (var s in this.style) {
      var o = this.style[s];
      typeof o != "object" ? i[s] = o : Array.isArray(o) && (i[s] = O(o));
    }
    return i;
  }, r.toString = function(i) {
    var s = this.options.sheet, o = s ? s.options.link : !1, a = o ? b({}, i, {
      allowEmpty: !0
    }) : i;
    return $(this.selectorText, this.style, a);
  }, Ge(t, [{
    key: "selector",
    set: function(i) {
      if (i !== this.selectorText) {
        this.selectorText = i;
        var s = this.renderer, o = this.renderable;
        if (!(!o || !s)) {
          var a = s.setSelector(o, i);
          a || s.replaceRule(o, this);
        }
      }
    },
    get: function() {
      return this.selectorText;
    }
  }]), t;
}(Ke), Rt = {
  onCreateRule: function(t, r, e) {
    return t[0] === "@" || e.parent && e.parent.type === "keyframes" ? null : new he(t, r, e);
  }
}, X = {
  indent: 1,
  children: !0
}, xt = /@([\w-]+)/, Pt = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "conditional", this.isProcessed = !1, this.key = r;
    var s = r.match(xt);
    this.at = s ? s[1] : "unknown", this.query = i.name || "@" + this.at, this.options = i, this.rules = new Y(b({}, i, {
      parent: this
    }));
    for (var o in e)
      this.rules.add(o, e[o]);
    this.rules.process();
  }
  var t = n.prototype;
  return t.getRule = function(e) {
    return this.rules.get(e);
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.addRule = function(e, i, s) {
    var o = this.rules.add(e, i, s);
    return o ? (this.options.jss.plugins.onProcessRule(o), o) : null;
  }, t.replaceRule = function(e, i, s) {
    var o = this.rules.replace(e, i, s);
    return o && this.options.jss.plugins.onProcessRule(o), o;
  }, t.toString = function(e) {
    e === void 0 && (e = X);
    var i = T(e), s = i.linebreak;
    if (e.indent == null && (e.indent = X.indent), e.children == null && (e.children = X.children), e.children === !1)
      return this.query + " {}";
    var o = this.rules.toString(e);
    return o ? this.query + " {" + s + o + s + "}" : "";
  }, n;
}(), kt = /@container|@media|@supports\s+/, Ct = {
  onCreateRule: function(t, r, e) {
    return kt.test(t) ? new Pt(t, r, e) : null;
  }
}, ee = {
  indent: 1,
  children: !0
}, Ot = /@keyframes\s+([\w-]+)/, pe = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "keyframes", this.at = "@keyframes", this.isProcessed = !1;
    var s = r.match(Ot);
    s && s[1] ? this.name = s[1] : (this.name = "noname", process.env.NODE_ENV !== "production" && y(!1, "[JSS] Bad keyframes name " + r)), this.key = this.type + "-" + this.name, this.options = i;
    var o = i.scoped, a = i.sheet, u = i.generateId;
    this.id = o === !1 ? this.name : Pe(u(this, a)), this.rules = new Y(b({}, i, {
      parent: this
    }));
    for (var f in e)
      this.rules.add(f, e[f], b({}, i, {
        parent: this
      }));
    this.rules.process();
  }
  var t = n.prototype;
  return t.toString = function(e) {
    e === void 0 && (e = ee);
    var i = T(e), s = i.linebreak;
    if (e.indent == null && (e.indent = ee.indent), e.children == null && (e.children = ee.children), e.children === !1)
      return this.at + " " + this.id + " {}";
    var o = this.rules.toString(e);
    return o && (o = "" + s + o + s), this.at + " " + this.id + " {" + o + "}";
  }, n;
}(), Et = /@keyframes\s+/, jt = /\$([\w-]+)/g, ge = function(t, r) {
  return typeof t == "string" ? t.replace(jt, function(e, i) {
    return i in r ? r[i] : (process.env.NODE_ENV !== "production" && y(!1, '[JSS] Referenced keyframes rule "' + i + '" is not defined.'), e);
  }) : t;
}, Te = function(t, r, e) {
  var i = t[r], s = ge(i, e);
  s !== i && (t[r] = s);
}, At = {
  onCreateRule: function(t, r, e) {
    return typeof t == "string" && Et.test(t) ? new pe(t, r, e) : null;
  },
  // Animation name ref replacer.
  onProcessStyle: function(t, r, e) {
    return r.type !== "style" || !e || ("animation-name" in t && Te(t, "animation-name", e.keyframes), "animation" in t && Te(t, "animation", e.keyframes)), t;
  },
  onChangeValue: function(t, r, e) {
    var i = e.options.sheet;
    if (!i)
      return t;
    switch (r) {
      case "animation":
        return ge(t, i.keyframes);
      case "animation-name":
        return ge(t, i.keyframes);
      default:
        return t;
    }
  }
}, _t = /* @__PURE__ */ function(n) {
  qe(t, n);
  function t() {
    return n.apply(this, arguments) || this;
  }
  var r = t.prototype;
  return r.toString = function(i) {
    var s = this.options.sheet, o = s ? s.options.link : !1, a = o ? b({}, i, {
      allowEmpty: !0
    }) : i;
    return $(this.key, this.style, a);
  }, t;
}(Ke), Nt = {
  onCreateRule: function(t, r, e) {
    return e.parent && e.parent.type === "keyframes" ? new _t(t, r, e) : null;
  }
}, Tt = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "font-face", this.at = "@font-face", this.isProcessed = !1, this.key = r, this.style = e, this.options = i;
  }
  var t = n.prototype;
  return t.toString = function(e) {
    var i = T(e), s = i.linebreak;
    if (Array.isArray(this.style)) {
      for (var o = "", a = 0; a < this.style.length; a++)
        o += $(this.at, this.style[a]), this.style[a + 1] && (o += s);
      return o;
    }
    return $(this.at, this.style, e);
  }, n;
}(), It = /@font-face/, Vt = {
  onCreateRule: function(t, r, e) {
    return It.test(t) ? new Tt(t, r, e) : null;
  }
}, Mt = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "viewport", this.at = "@viewport", this.isProcessed = !1, this.key = r, this.style = e, this.options = i;
  }
  var t = n.prototype;
  return t.toString = function(e) {
    return $(this.key, this.style, e);
  }, n;
}(), Lt = {
  onCreateRule: function(t, r, e) {
    return t === "@viewport" || t === "@-ms-viewport" ? new Mt(t, r, e) : null;
  }
}, zt = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "simple", this.isProcessed = !1, this.key = r, this.value = e, this.options = i;
  }
  var t = n.prototype;
  return t.toString = function(e) {
    if (Array.isArray(this.value)) {
      for (var i = "", s = 0; s < this.value.length; s++)
        i += this.key + " " + this.value[s] + ";", this.value[s + 1] && (i += `
`);
      return i;
    }
    return this.key + " " + this.value + ";";
  }, n;
}(), Dt = {
  "@charset": !0,
  "@import": !0,
  "@namespace": !0
}, $t = {
  onCreateRule: function(t, r, e) {
    return t in Dt ? new zt(t, r, e) : null;
  }
}, Ie = [Rt, Ct, At, Nt, Vt, Lt, $t], Jt = {
  process: !0
}, Ve = {
  force: !0,
  process: !0
  /**
   * Contains rules objects and allows adding/removing etc.
   * Is used for e.g. by `StyleSheet` or `ConditionalRule`.
   */
}, Y = /* @__PURE__ */ function() {
  function n(r) {
    this.map = {}, this.raw = {}, this.index = [], this.counter = 0, this.options = r, this.classes = r.classes, this.keyframes = r.keyframes;
  }
  var t = n.prototype;
  return t.add = function(e, i, s) {
    var o = this.options, a = o.parent, u = o.sheet, f = o.jss, d = o.Renderer, c = o.generateId, m = o.scoped, g = b({
      classes: this.classes,
      parent: a,
      sheet: u,
      jss: f,
      Renderer: d,
      generateId: c,
      scoped: m,
      name: e,
      keyframes: this.keyframes,
      selector: void 0
    }, s), v = e;
    e in this.raw && (v = e + "-d" + this.counter++), this.raw[v] = i, v in this.classes && (g.selector = "." + Pe(this.classes[v]));
    var w = H(v, i, g);
    if (!w)
      return null;
    this.register(w);
    var F = g.index === void 0 ? this.index.length : g.index;
    return this.index.splice(F, 0, w), w;
  }, t.replace = function(e, i, s) {
    var o = this.get(e), a = this.index.indexOf(o);
    o && this.remove(o);
    var u = s;
    return a !== -1 && (u = b({}, s, {
      index: a
    })), this.add(e, i, u);
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
    var e, i, s;
    if (typeof (arguments.length <= 0 ? void 0 : arguments[0]) == "string" ? (e = arguments.length <= 0 ? void 0 : arguments[0], i = arguments.length <= 1 ? void 0 : arguments[1], s = arguments.length <= 2 ? void 0 : arguments[2]) : (i = arguments.length <= 0 ? void 0 : arguments[0], s = arguments.length <= 1 ? void 0 : arguments[1], e = null), e)
      this.updateOne(this.get(e), i, s);
    else
      for (var o = 0; o < this.index.length; o++)
        this.updateOne(this.index[o], i, s);
  }, t.updateOne = function(e, i, s) {
    s === void 0 && (s = Jt);
    var o = this.options, a = o.jss.plugins, u = o.sheet;
    if (e.rules instanceof n) {
      e.rules.update(i, s);
      return;
    }
    var f = e.style;
    if (a.onUpdate(i, e, u, s), s.process && f && f !== e.style) {
      a.onProcessStyle(e.style, e, u);
      for (var d in e.style) {
        var c = e.style[d], m = f[d];
        c !== m && e.prop(d, c, Ve);
      }
      for (var g in f) {
        var v = e.style[g], w = f[g];
        v == null && v !== w && e.prop(g, null, Ve);
      }
    }
  }, t.toString = function(e) {
    for (var i = "", s = this.options.sheet, o = s ? s.options.link : !1, a = T(e), u = a.linebreak, f = 0; f < this.index.length; f++) {
      var d = this.index[f], c = d.toString(e);
      !c && !o || (i && (i += u), i += c);
    }
    return i;
  }, n;
}(), Be = /* @__PURE__ */ function() {
  function n(r, e) {
    this.attached = !1, this.deployed = !1, this.classes = {}, this.keyframes = {}, this.options = b({}, e, {
      sheet: this,
      parent: this,
      classes: this.classes,
      keyframes: this.keyframes
    }), e.Renderer && (this.renderer = new e.Renderer(this)), this.rules = new Y(this.options);
    for (var i in r)
      this.rules.add(i, r[i]);
    this.rules.process();
  }
  var t = n.prototype;
  return t.attach = function() {
    return this.attached ? this : (this.renderer && this.renderer.attach(), this.attached = !0, this.deployed || this.deploy(), this);
  }, t.detach = function() {
    return this.attached ? (this.renderer && this.renderer.detach(), this.attached = !1, this) : this;
  }, t.addRule = function(e, i, s) {
    var o = this.queue;
    this.attached && !o && (this.queue = []);
    var a = this.rules.add(e, i, s);
    return a ? (this.options.jss.plugins.onProcessRule(a), this.attached ? (this.deployed && (o ? o.push(a) : (this.insertRule(a), this.queue && (this.queue.forEach(this.insertRule, this), this.queue = void 0))), a) : (this.deployed = !1, a)) : null;
  }, t.replaceRule = function(e, i, s) {
    var o = this.rules.get(e);
    if (!o)
      return this.addRule(e, i, s);
    var a = this.rules.replace(e, i, s);
    return a && this.options.jss.plugins.onProcessRule(a), this.attached ? (this.deployed && this.renderer && (a ? o.renderable && this.renderer.replaceRule(o.renderable, a) : this.renderer.deleteRule(o)), a) : (this.deployed = !1, a);
  }, t.insertRule = function(e) {
    this.renderer && this.renderer.insertRule(e);
  }, t.addRules = function(e, i) {
    var s = [];
    for (var o in e) {
      var a = this.addRule(o, e[o], i);
      a && s.push(a);
    }
    return s;
  }, t.getRule = function(e) {
    return this.rules.get(e);
  }, t.deleteRule = function(e) {
    var i = typeof e == "object" ? e : this.rules.get(e);
    return !i || // Style sheet was created without link: true and attached, in this case we
    // won't be able to remove the CSS rule from the DOM.
    this.attached && !i.renderable ? !1 : (this.rules.remove(i), this.attached && i.renderable && this.renderer ? this.renderer.deleteRule(i.renderable) : !0);
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.deploy = function() {
    return this.renderer && this.renderer.deploy(), this.deployed = !0, this;
  }, t.update = function() {
    var e;
    return (e = this.rules).update.apply(e, arguments), this;
  }, t.updateOne = function(e, i, s) {
    return this.rules.updateOne(e, i, s), this;
  }, t.toString = function(e) {
    return this.rules.toString(e);
  }, n;
}(), Wt = /* @__PURE__ */ function() {
  function n() {
    this.plugins = {
      internal: [],
      external: []
    }, this.registry = {};
  }
  var t = n.prototype;
  return t.onCreateRule = function(e, i, s) {
    for (var o = 0; o < this.registry.onCreateRule.length; o++) {
      var a = this.registry.onCreateRule[o](e, i, s);
      if (a)
        return a;
    }
    return null;
  }, t.onProcessRule = function(e) {
    if (!e.isProcessed) {
      for (var i = e.options.sheet, s = 0; s < this.registry.onProcessRule.length; s++)
        this.registry.onProcessRule[s](e, i);
      e.style && this.onProcessStyle(e.style, e, i), e.isProcessed = !0;
    }
  }, t.onProcessStyle = function(e, i, s) {
    for (var o = 0; o < this.registry.onProcessStyle.length; o++)
      i.style = this.registry.onProcessStyle[o](i.style, i, s);
  }, t.onProcessSheet = function(e) {
    for (var i = 0; i < this.registry.onProcessSheet.length; i++)
      this.registry.onProcessSheet[i](e);
  }, t.onUpdate = function(e, i, s, o) {
    for (var a = 0; a < this.registry.onUpdate.length; a++)
      this.registry.onUpdate[a](e, i, s, o);
  }, t.onChangeValue = function(e, i, s) {
    for (var o = e, a = 0; a < this.registry.onChangeValue.length; a++)
      o = this.registry.onChangeValue[a](o, i, s);
    return o;
  }, t.use = function(e, i) {
    i === void 0 && (i = {
      queue: "external"
    });
    var s = this.plugins[i.queue];
    s.indexOf(e) === -1 && (s.push(e), this.registry = [].concat(this.plugins.external, this.plugins.internal).reduce(function(o, a) {
      for (var u in a)
        u in o ? o[u].push(a[u]) : process.env.NODE_ENV !== "production" && y(!1, '[JSS] Unknown hook "' + u + '".');
      return o;
    }, {
      onCreateRule: [],
      onProcessRule: [],
      onProcessStyle: [],
      onProcessSheet: [],
      onChangeValue: [],
      onUpdate: []
    }));
  }, n;
}(), Ft = /* @__PURE__ */ function() {
  function n() {
    this.registry = [];
  }
  var t = n.prototype;
  return t.add = function(e) {
    var i = this.registry, s = e.options.index;
    if (i.indexOf(e) === -1) {
      if (i.length === 0 || s >= this.index) {
        i.push(e);
        return;
      }
      for (var o = 0; o < i.length; o++)
        if (i[o].options.index > s) {
          i.splice(o, 0, e);
          return;
        }
    }
  }, t.reset = function() {
    this.registry = [];
  }, t.remove = function(e) {
    var i = this.registry.indexOf(e);
    this.registry.splice(i, 1);
  }, t.toString = function(e) {
    for (var i = e === void 0 ? {} : e, s = i.attached, o = bt(i, ["attached"]), a = T(o), u = a.linebreak, f = "", d = 0; d < this.registry.length; d++) {
      var c = this.registry[d];
      s != null && c.attached !== s || (f && (f += u), f += c.toString(o));
    }
    return f;
  }, Ge(n, [{
    key: "index",
    /**
     * Current highest index number.
     */
    get: function() {
      return this.registry.length === 0 ? 0 : this.registry[this.registry.length - 1].options.index;
    }
  }]), n;
}(), L = new Ft(), ve = typeof globalThis < "u" ? globalThis : typeof window < "u" && window.Math === Math ? window : typeof self < "u" && self.Math === Math ? self : Function("return this")(), ye = "2f1acc6c3a606b082e5eef5e54414ffb";
ve[ye] == null && (ve[ye] = 0);
var Me = ve[ye]++, Ut = 1e10, Le = function(t) {
  t === void 0 && (t = {});
  var r = 0, e = function(s, o) {
    r += 1, r > Ut && process.env.NODE_ENV !== "production" && y(!1, "[JSS] You might have a memory leak. Rule counter is at " + r + ".");
    var a = "", u = "";
    return o && (o.options.classNamePrefix && (u = o.options.classNamePrefix), o.options.jss.id != null && (a = String(o.options.jss.id))), t.minify ? "" + (u || "c") + Me + a + r : u + s.key + "-" + Me + (a ? "-" + a : "") + "-" + r;
  };
  return e;
}, He = function(t) {
  var r;
  return function() {
    return r || (r = t()), r;
  };
}, Gt = function(t, r) {
  try {
    return t.attributeStyleMap ? t.attributeStyleMap.get(r) : t.style.getPropertyValue(r);
  } catch {
    return "";
  }
}, qt = function(t, r, e) {
  try {
    var i = e;
    if (Array.isArray(e) && (i = O(e)), t.attributeStyleMap)
      t.attributeStyleMap.set(r, i);
    else {
      var s = i ? i.indexOf("!important") : -1, o = s > -1 ? i.substr(0, s - 1) : i;
      t.style.setProperty(r, o, s > -1 ? "important" : "");
    }
  } catch {
    return !1;
  }
  return !0;
}, Kt = function(t, r) {
  try {
    t.attributeStyleMap ? t.attributeStyleMap.delete(r) : t.style.removeProperty(r);
  } catch (e) {
    process.env.NODE_ENV !== "production" && y(!1, '[JSS] DOMException "' + e.message + '" was thrown. Tried to remove property "' + r + '".');
  }
}, Bt = function(t, r) {
  return t.selectorText = r, t.selectorText === r;
}, Ye = He(function() {
  return document.querySelector("head");
});
function Ht(n, t) {
  for (var r = 0; r < n.length; r++) {
    var e = n[r];
    if (e.attached && e.options.index > t.index && e.options.insertionPoint === t.insertionPoint)
      return e;
  }
  return null;
}
function Yt(n, t) {
  for (var r = n.length - 1; r >= 0; r--) {
    var e = n[r];
    if (e.attached && e.options.insertionPoint === t.insertionPoint)
      return e;
  }
  return null;
}
function Zt(n) {
  for (var t = Ye(), r = 0; r < t.childNodes.length; r++) {
    var e = t.childNodes[r];
    if (e.nodeType === 8 && e.nodeValue.trim() === n)
      return e;
  }
  return null;
}
function Qt(n) {
  var t = L.registry;
  if (t.length > 0) {
    var r = Ht(t, n);
    if (r && r.renderer)
      return {
        parent: r.renderer.element.parentNode,
        node: r.renderer.element
      };
    if (r = Yt(t, n), r && r.renderer)
      return {
        parent: r.renderer.element.parentNode,
        node: r.renderer.element.nextSibling
      };
  }
  var e = n.insertionPoint;
  if (e && typeof e == "string") {
    var i = Zt(e);
    if (i)
      return {
        parent: i.parentNode,
        node: i.nextSibling
      };
    process.env.NODE_ENV !== "production" && y(!1, '[JSS] Insertion point "' + e + '" not found.');
  }
  return !1;
}
function Xt(n, t) {
  var r = t.insertionPoint, e = Qt(t);
  if (e !== !1 && e.parent) {
    e.parent.insertBefore(n, e.node);
    return;
  }
  if (r && typeof r.nodeType == "number") {
    var i = r, s = i.parentNode;
    s ? s.insertBefore(n, i.nextSibling) : process.env.NODE_ENV !== "production" && y(!1, "[JSS] Insertion point is not in the DOM.");
    return;
  }
  Ye().appendChild(n);
}
var er = He(function() {
  var n = document.querySelector('meta[property="csp-nonce"]');
  return n ? n.getAttribute("content") : null;
}), ze = function(t, r, e) {
  try {
    "insertRule" in t ? t.insertRule(r, e) : "appendRule" in t && t.appendRule(r);
  } catch (i) {
    return process.env.NODE_ENV !== "production" && y(!1, "[JSS] " + i.message), !1;
  }
  return t.cssRules[e];
}, De = function(t, r) {
  var e = t.cssRules.length;
  return r === void 0 || r > e ? e : r;
}, tr = function() {
  var t = document.createElement("style");
  return t.textContent = `
`, t;
}, rr = /* @__PURE__ */ function() {
  function n(r) {
    this.getPropertyValue = Gt, this.setProperty = qt, this.removeProperty = Kt, this.setSelector = Bt, this.hasInsertedRules = !1, this.cssRules = [], r && L.add(r), this.sheet = r;
    var e = this.sheet ? this.sheet.options : {}, i = e.media, s = e.meta, o = e.element;
    this.element = o || tr(), this.element.setAttribute("data-jss", ""), i && this.element.setAttribute("media", i), s && this.element.setAttribute("data-meta", s);
    var a = er();
    a && this.element.setAttribute("nonce", a);
  }
  var t = n.prototype;
  return t.attach = function() {
    if (!(this.element.parentNode || !this.sheet)) {
      Xt(this.element, this.sheet.options);
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
  }, t.insertRules = function(e, i) {
    for (var s = 0; s < e.index.length; s++)
      this.insertRule(e.index[s], s, i);
  }, t.insertRule = function(e, i, s) {
    if (s === void 0 && (s = this.element.sheet), e.rules) {
      var o = e, a = s;
      if (e.type === "conditional" || e.type === "keyframes") {
        var u = De(s, i);
        if (a = ze(s, o.toString({
          children: !1
        }), u), a === !1)
          return !1;
        this.refCssRule(e, u, a);
      }
      return this.insertRules(o.rules, a), a;
    }
    var f = e.toString();
    if (!f)
      return !1;
    var d = De(s, i), c = ze(s, f, d);
    return c === !1 ? !1 : (this.hasInsertedRules = !0, this.refCssRule(e, d, c), c);
  }, t.refCssRule = function(e, i, s) {
    e.renderable = s, e.options.parent instanceof Be && this.cssRules.splice(i, 0, s);
  }, t.deleteRule = function(e) {
    var i = this.element.sheet, s = this.indexOf(e);
    return s === -1 ? !1 : (i.deleteRule(s), this.cssRules.splice(s, 1), !0);
  }, t.indexOf = function(e) {
    return this.cssRules.indexOf(e);
  }, t.replaceRule = function(e, i) {
    var s = this.indexOf(e);
    return s === -1 ? !1 : (this.element.sheet.deleteRule(s), this.cssRules.splice(s, 1), this.insertRule(i, s));
  }, t.getRules = function() {
    return this.element.sheet.cssRules;
  }, n;
}(), nr = 0, ir = /* @__PURE__ */ function() {
  function n(r) {
    this.id = nr++, this.version = "10.10.0", this.plugins = new Wt(), this.options = {
      id: {
        minify: !1
      },
      createGenerateId: Le,
      Renderer: W ? rr : null,
      plugins: []
    }, this.generateId = Le({
      minify: !1
    });
    for (var e = 0; e < Ie.length; e++)
      this.plugins.use(Ie[e], {
        queue: "internal"
      });
    this.setup(r);
  }
  var t = n.prototype;
  return t.setup = function(e) {
    return e === void 0 && (e = {}), e.createGenerateId && (this.options.createGenerateId = e.createGenerateId), e.id && (this.options.id = b({}, this.options.id, e.id)), (e.createGenerateId || e.id) && (this.generateId = this.options.createGenerateId(this.options.id)), e.insertionPoint != null && (this.options.insertionPoint = e.insertionPoint), "Renderer" in e && (this.options.Renderer = e.Renderer), e.plugins && this.use.apply(this, e.plugins), this;
  }, t.createStyleSheet = function(e, i) {
    i === void 0 && (i = {});
    var s = i, o = s.index;
    typeof o != "number" && (o = L.index === 0 ? 0 : L.index + 1);
    var a = new Be(e, b({}, i, {
      jss: this,
      generateId: i.generateId || this.generateId,
      insertionPoint: this.options.insertionPoint,
      Renderer: this.options.Renderer,
      index: o
    }));
    return this.plugins.onProcessSheet(a), a;
  }, t.removeStyleSheet = function(e) {
    return e.detach(), L.remove(e), this;
  }, t.createRule = function(e, i, s) {
    if (i === void 0 && (i = {}), s === void 0 && (s = {}), typeof e == "object")
      return this.createRule(void 0, e, i);
    var o = b({}, s, {
      name: e,
      jss: this,
      Renderer: this.options.Renderer
    });
    o.generateId || (o.generateId = this.generateId), o.classes || (o.classes = {}), o.keyframes || (o.keyframes = {});
    var a = H(e, i, o);
    return a && this.plugins.onProcessRule(a), a;
  }, t.use = function() {
    for (var e = this, i = arguments.length, s = new Array(i), o = 0; o < i; o++)
      s[o] = arguments[o];
    return s.forEach(function(a) {
      e.plugins.use(a);
    }), this;
  }, n;
}(), sr = function(t) {
  return new ir(t);
}, ke = typeof CSS == "object" && CSS != null && "number" in CSS;
/**
 * A better abstraction over CSS.
 *
 * @copyright Oleg Isonen (Slobodskoi) / Isonen 2014-present
 * @website https://github.com/cssinjs/jss
 * @license MIT
 */
var or = sr();
const Ze = or;
var Qe = Date.now(), te = "fnValues" + Qe, re = "fnStyle" + ++Qe, ar = function() {
  return {
    onCreateRule: function(r, e, i) {
      if (typeof e != "function")
        return null;
      var s = H(r, {}, i);
      return s[re] = e, s;
    },
    onProcessStyle: function(r, e) {
      if (te in e || re in e)
        return r;
      var i = {};
      for (var s in r) {
        var o = r[s];
        typeof o == "function" && (delete r[s], i[s] = o);
      }
      return e[te] = i, r;
    },
    onUpdate: function(r, e, i, s) {
      var o = e, a = o[re];
      if (a && (o.style = a(r) || {}, process.env.NODE_ENV === "development")) {
        for (var u in o.style)
          if (typeof o.style[u] == "function") {
            process.env.NODE_ENV !== "production" && y(!1, "[JSS] Function values inside function rules are not supported.");
            break;
          }
      }
      var f = o[te];
      if (f)
        for (var d in f)
          o.prop(d, f[d](r), s);
    }
  };
};
const lr = ar;
function ur(n) {
  var t, r = n.Symbol;
  return typeof r == "function" ? r.observable ? t = r.observable : (t = r("observable"), r.observable = t) : t = "@@observable", t;
}
var A;
typeof self < "u" ? A = self : typeof window < "u" ? A = window : typeof global < "u" ? A = global : typeof module < "u" ? A = module : A = Function("return this")();
var $e = ur(A), Je = function(t) {
  return t && t[$e] && t === t[$e]();
}, fr = function(t) {
  return {
    onCreateRule: function(e, i, s) {
      if (!Je(i))
        return null;
      var o = i, a = H(e, {}, s);
      return o.subscribe(function(u) {
        for (var f in u)
          a.prop(f, u[f], t);
      }), a;
    },
    onProcessRule: function(e) {
      if (!(e && e.type !== "style")) {
        var i = e, s = i.style, o = function(d) {
          var c = s[d];
          if (!Je(c))
            return "continue";
          delete s[d], c.subscribe({
            next: function(g) {
              i.prop(d, g, t);
            }
          });
        };
        for (var a in s)
          var u = o(a);
      }
    }
  };
};
const cr = fr;
var dr = /;\n/, hr = function(t) {
  for (var r = {}, e = t.split(dr), i = 0; i < e.length; i++) {
    var s = (e[i] || "").trim();
    if (s) {
      var o = s.indexOf(":");
      if (o === -1) {
        process.env.NODE_ENV !== "production" && y(!1, '[JSS] Malformed CSS string "' + s + '"');
        continue;
      }
      var a = s.substr(0, o).trim(), u = s.substr(o + 1).trim();
      r[a] = u;
    }
  }
  return r;
}, pr = function(t) {
  typeof t.style == "string" && (t.style = hr(t.style));
};
function gr() {
  return {
    onProcessRule: pr
  };
}
function N() {
  return N = Object.assign ? Object.assign.bind() : function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (n[e] = r[e]);
    }
    return n;
  }, N.apply(this, arguments);
}
var x = "@global", me = "@global ", vr = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "global", this.at = x, this.isProcessed = !1, this.key = r, this.options = i, this.rules = new Y(N({}, i, {
      parent: this
    }));
    for (var s in e)
      this.rules.add(s, e[s]);
    this.rules.process();
  }
  var t = n.prototype;
  return t.getRule = function(e) {
    return this.rules.get(e);
  }, t.addRule = function(e, i, s) {
    var o = this.rules.add(e, i, s);
    return o && this.options.jss.plugins.onProcessRule(o), o;
  }, t.replaceRule = function(e, i, s) {
    var o = this.rules.replace(e, i, s);
    return o && this.options.jss.plugins.onProcessRule(o), o;
  }, t.indexOf = function(e) {
    return this.rules.indexOf(e);
  }, t.toString = function(e) {
    return this.rules.toString(e);
  }, n;
}(), yr = /* @__PURE__ */ function() {
  function n(r, e, i) {
    this.type = "global", this.at = x, this.isProcessed = !1, this.key = r, this.options = i;
    var s = r.substr(me.length);
    this.rule = i.jss.createRule(s, e, N({}, i, {
      parent: this
    }));
  }
  var t = n.prototype;
  return t.toString = function(e) {
    return this.rule ? this.rule.toString(e) : "";
  }, n;
}(), mr = /\s*,\s*/g;
function Xe(n, t) {
  for (var r = n.split(mr), e = "", i = 0; i < r.length; i++)
    e += t + " " + r[i].trim(), r[i + 1] && (e += ", ");
  return e;
}
function br(n, t) {
  var r = n.options, e = n.style, i = e ? e[x] : null;
  if (i) {
    for (var s in i)
      t.addRule(s, i[s], N({}, r, {
        selector: Xe(s, n.selector)
      }));
    delete e[x];
  }
}
function wr(n, t) {
  var r = n.options, e = n.style;
  for (var i in e)
    if (!(i[0] !== "@" || i.substr(0, x.length) !== x)) {
      var s = Xe(i.substr(x.length), n.selector);
      t.addRule(s, e[i], N({}, r, {
        selector: s
      })), delete e[i];
    }
}
function Sr() {
  function n(r, e, i) {
    if (!r)
      return null;
    if (r === x)
      return new vr(r, e, i);
    if (r[0] === "@" && r.substr(0, me.length) === me)
      return new yr(r, e, i);
    var s = i.parent;
    return s && (s.type === "global" || s.options.parent && s.options.parent.type === "global") && (i.scoped = !1), !i.selector && i.scoped === !1 && (i.selector = r), null;
  }
  function t(r, e) {
    r.type !== "style" || !e || (br(r, e), wr(r, e));
  }
  return {
    onCreateRule: n,
    onProcessRule: t
  };
}
function be() {
  return be = Object.assign ? Object.assign.bind() : function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (n[e] = r[e]);
    }
    return n;
  }, be.apply(this, arguments);
}
var K = function(t) {
  return t && typeof t == "object" && !Array.isArray(t);
}, ne = "extendCurrValue" + Date.now();
function Rr(n, t, r, e) {
  var i = typeof n.extend;
  if (i === "string") {
    if (!r)
      return;
    var s = r.getRule(n.extend);
    if (!s)
      return;
    if (s === t) {
      process.env.NODE_ENV !== "production" && y(!1, `[JSS] A rule tries to extend itself 
` + t.toString());
      return;
    }
    var o = s.options.parent;
    if (o) {
      var a = o.rules.raw[n.extend];
      C(a, t, r, e);
    }
    return;
  }
  if (Array.isArray(n.extend)) {
    for (var u = 0; u < n.extend.length; u++) {
      var f = n.extend[u], d = typeof f == "string" ? be({}, n, {
        extend: f
      }) : n.extend[u];
      C(d, t, r, e);
    }
    return;
  }
  for (var c in n.extend) {
    if (c === "extend") {
      C(n.extend.extend, t, r, e);
      continue;
    }
    if (K(n.extend[c])) {
      c in e || (e[c] = {}), C(n.extend[c], t, r, e[c]);
      continue;
    }
    e[c] = n.extend[c];
  }
}
function xr(n, t, r, e) {
  for (var i in n)
    if (i !== "extend") {
      if (K(e[i]) && K(n[i])) {
        C(n[i], t, r, e[i]);
        continue;
      }
      if (K(n[i])) {
        e[i] = C(n[i], t, r);
        continue;
      }
      e[i] = n[i];
    }
}
function C(n, t, r, e) {
  return e === void 0 && (e = {}), Rr(n, t, r, e), xr(n, t, r, e), e;
}
function Pr() {
  function n(r, e, i) {
    return "extend" in r ? C(r, e, i) : r;
  }
  function t(r, e, i) {
    if (e !== "extend")
      return r;
    if (r == null || r === !1) {
      for (var s in i[ne])
        i.prop(s, null);
      return i[ne] = null, null;
    }
    if (typeof r == "object") {
      for (var o in r)
        i.prop(o, r[o]);
      i[ne] = r;
    }
    return null;
  }
  return {
    onProcessStyle: n,
    onChangeValue: t
  };
}
function _() {
  return _ = Object.assign ? Object.assign.bind() : function(n) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var e in r)
        Object.prototype.hasOwnProperty.call(r, e) && (n[e] = r[e]);
    }
    return n;
  }, _.apply(this, arguments);
}
var We = /\s*,\s*/g, kr = /&/g, Cr = /\$([\w-]+)/g;
function Or() {
  function n(i, s) {
    return function(o, a) {
      var u = i.getRule(a) || s && s.getRule(a);
      return u ? u.selector : (process.env.NODE_ENV !== "production" && y(!1, '[JSS] Could not find the referenced rule "' + a + '" in "' + (i.options.meta || i.toString()) + '".'), a);
    };
  }
  function t(i, s) {
    for (var o = s.split(We), a = i.split(We), u = "", f = 0; f < o.length; f++)
      for (var d = o[f], c = 0; c < a.length; c++) {
        var m = a[c];
        u && (u += ", "), u += m.indexOf("&") !== -1 ? m.replace(kr, d) : d + " " + m;
      }
    return u;
  }
  function r(i, s, o) {
    if (o)
      return _({}, o, {
        index: o.index + 1
      });
    var a = i.options.nestingLevel;
    a = a === void 0 ? 1 : a + 1;
    var u = _({}, i.options, {
      nestingLevel: a,
      index: s.indexOf(i) + 1
      // We don't need the parent name to be set options for chlid.
    });
    return delete u.name, u;
  }
  function e(i, s, o) {
    if (s.type !== "style")
      return i;
    var a = s, u = a.options.parent, f, d;
    for (var c in i) {
      var m = c.indexOf("&") !== -1, g = c[0] === "@";
      if (!(!m && !g)) {
        if (f = r(a, u, f), m) {
          var v = t(c, a.selector);
          d || (d = n(u, o)), v = v.replace(Cr, d);
          var w = a.key + "-" + c;
          "replaceRule" in u ? u.replaceRule(w, i[c], _({}, f, {
            selector: v
          })) : u.addRule(w, i[c], _({}, f, {
            selector: v
          }));
        } else
          g && u.addRule(c, {}, f).addRule(a.key, i[c], {
            selector: a.selector
          });
        delete i[c];
      }
    }
    return i;
  }
  return {
    onProcessStyle: e
  };
}
function we(n, t) {
  if (!t)
    return !0;
  if (Array.isArray(t)) {
    for (var r = 0; r < t.length; r++) {
      var e = we(n, t[r]);
      if (!e)
        return !1;
    }
    return !0;
  }
  if (t.indexOf(" ") > -1)
    return we(n, t.split(" "));
  var i = n.options.parent;
  if (t[0] === "$") {
    var s = i.getRule(t.substr(1));
    return s ? s === n ? (process.env.NODE_ENV !== "production" && y(!1, `[JSS] Cyclic composition detected. 
` + n.toString()), !1) : (i.classes[n.key] += " " + i.classes[s.key], !0) : (process.env.NODE_ENV !== "production" && y(!1, `[JSS] Referenced rule is not defined. 
` + n.toString()), !1);
  }
  return i.classes[n.key] += " " + t, !0;
}
function Er() {
  function n(t, r) {
    return "composes" in t && (we(r, t.composes), delete t.composes), t;
  }
  return {
    onProcessStyle: n
  };
}
var jr = /[A-Z]/g, Ar = /^ms-/, ie = {};
function _r(n) {
  return "-" + n.toLowerCase();
}
function et(n) {
  if (ie.hasOwnProperty(n))
    return ie[n];
  var t = n.replace(jr, _r);
  return ie[n] = Ar.test(t) ? "-" + t : t;
}
function B(n) {
  var t = {};
  for (var r in n) {
    var e = r.indexOf("--") === 0 ? r : et(r);
    t[e] = n[r];
  }
  return n.fallbacks && (Array.isArray(n.fallbacks) ? t.fallbacks = n.fallbacks.map(B) : t.fallbacks = B(n.fallbacks)), t;
}
function Nr() {
  function n(r) {
    if (Array.isArray(r)) {
      for (var e = 0; e < r.length; e++)
        r[e] = B(r[e]);
      return r;
    }
    return B(r);
  }
  function t(r, e, i) {
    if (e.indexOf("--") === 0)
      return r;
    var s = et(e);
    return e === s ? r : (i.prop(s, r), null);
  }
  return {
    onProcessStyle: n,
    onChangeValue: t
  };
}
var l = ke && CSS ? CSS.px : "px", G = ke && CSS ? CSS.ms : "ms", E = ke && CSS ? CSS.percent : "%", Tr = {
  // Animation properties
  "animation-delay": G,
  "animation-duration": G,
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
  "perspective-origin-x": E,
  "perspective-origin-y": E,
  // Transform properties
  "transform-origin": E,
  "transform-origin-x": E,
  "transform-origin-y": E,
  "transform-origin-z": E,
  // Transition properties
  "transition-delay": G,
  "transition-duration": G,
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
function tt(n) {
  var t = /(-[a-z])/g, r = function(o) {
    return o[1].toUpperCase();
  }, e = {};
  for (var i in n)
    e[i] = n[i], e[i.replace(t, r)] = n[i];
  return e;
}
var Ir = tt(Tr);
function z(n, t, r) {
  if (t == null)
    return t;
  if (Array.isArray(t))
    for (var e = 0; e < t.length; e++)
      t[e] = z(n, t[e], r);
  else if (typeof t == "object")
    if (n === "fallbacks")
      for (var i in t)
        t[i] = z(i, t[i], r);
    else
      for (var s in t)
        t[s] = z(n + "-" + s, t[s], r);
  else if (typeof t == "number" && isNaN(t) === !1) {
    var o = r[n] || Ir[n];
    return o && !(t === 0 && o === l) ? typeof o == "function" ? o(t).toString() : "" + t + o : t.toString();
  }
  return t;
}
function Vr(n) {
  n === void 0 && (n = {});
  var t = tt(n);
  function r(i, s) {
    if (s.type !== "style")
      return i;
    for (var o in i)
      i[o] = z(o, i[o], t);
    return i;
  }
  function e(i, s) {
    return z(s, i, t);
  }
  return {
    onProcessStyle: r,
    onChangeValue: e
  };
}
var Mr = {
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
}, Lr = {
  position: !0,
  // background-position
  size: !0
  // background-size
  /**
   * A scheme for parsing and building correct styles from passed objects.
   */
}, q = {
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
function zr(n, t, r) {
  return n.map(function(e) {
    return nt(e, t, r, !1, !0);
  });
}
function rt(n, t, r, e) {
  return r[t] == null ? n : n.length === 0 ? [] : Array.isArray(n[0]) ? rt(n[0], t, r, e) : typeof n[0] == "object" ? zr(n, t, e) : [n];
}
function nt(n, t, r, e, i) {
  if (!(q[t] || se[t]))
    return [];
  var s = [];
  if (se[t] && (n = Dr(n, r, se[t], e)), Object.keys(n).length)
    for (var o in q[t]) {
      if (n[o]) {
        Array.isArray(n[o]) ? s.push(Lr[o] === null ? n[o] : n[o].join(" ")) : s.push(n[o]);
        continue;
      }
      q[t][o] != null && s.push(q[t][o]);
    }
  return !s.length || i ? s : [s];
}
function Dr(n, t, r, e) {
  for (var i in r) {
    var s = r[i];
    if (typeof n[i] < "u" && (e || !t.prop(s))) {
      var o, a = J((o = {}, o[s] = n[i], o), t)[s];
      e ? t.style.fallbacks[s] = a : t.style[s] = a;
    }
    delete n[i];
  }
  return n;
}
function J(n, t, r) {
  for (var e in n) {
    var i = n[e];
    if (Array.isArray(i)) {
      if (!Array.isArray(i[0])) {
        if (e === "fallbacks") {
          for (var s = 0; s < n.fallbacks.length; s++)
            n.fallbacks[s] = J(n.fallbacks[s], t, !0);
          continue;
        }
        n[e] = rt(i, e, Mr, t), n[e].length || delete n[e];
      }
    } else if (typeof i == "object") {
      if (e === "fallbacks") {
        n.fallbacks = J(n.fallbacks, t, !0);
        continue;
      }
      n[e] = nt(i, e, t, r), n[e].length || delete n[e];
    } else
      n[e] === "" && delete n[e];
  }
  return n;
}
function $r() {
  function n(t, r) {
    if (!t || r.type !== "style")
      return t;
    if (Array.isArray(t)) {
      for (var e = 0; e < t.length; e++)
        t[e] = J(t[e], r);
      return t;
    }
    return J(t, r);
  }
  return {
    onProcessStyle: n
  };
}
function Se(n, t) {
  (t == null || t > n.length) && (t = n.length);
  for (var r = 0, e = new Array(t); r < t; r++)
    e[r] = n[r];
  return e;
}
function Jr(n) {
  if (Array.isArray(n))
    return Se(n);
}
function Wr(n) {
  if (typeof Symbol < "u" && n[Symbol.iterator] != null || n["@@iterator"] != null)
    return Array.from(n);
}
function Fr(n, t) {
  if (n) {
    if (typeof n == "string")
      return Se(n, t);
    var r = Object.prototype.toString.call(n).slice(8, -1);
    if (r === "Object" && n.constructor && (r = n.constructor.name), r === "Map" || r === "Set")
      return Array.from(n);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))
      return Se(n, t);
  }
}
function Ur() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Gr(n) {
  return Jr(n) || Wr(n) || Fr(n) || Ur();
}
var V = "", Re = "", it = "", st = "", qr = W && "ontouchstart" in document.documentElement;
if (W) {
  var oe = {
    Moz: "-moz-",
    ms: "-ms-",
    O: "-o-",
    Webkit: "-webkit-"
  }, Kr = document.createElement("p"), ae = Kr.style, Br = "Transform";
  for (var le in oe)
    if (le + Br in ae) {
      V = le, Re = oe[le];
      break;
    }
  V === "Webkit" && "msHyphens" in ae && (V = "ms", Re = oe.ms, st = "edge"), V === "Webkit" && "-apple-trailing-word" in ae && (it = "apple");
}
var h = {
  js: V,
  css: Re,
  vendor: it,
  browser: st,
  isTouch: qr
};
function Hr(n) {
  return n[1] === "-" || h.js === "ms" ? n : "@" + h.css + "keyframes" + n.substr(10);
}
var Yr = {
  noPrefill: ["appearance"],
  supportedProperty: function(t) {
    return t !== "appearance" ? !1 : h.js === "ms" ? "-webkit-" + t : h.css + t;
  }
}, Zr = {
  noPrefill: ["color-adjust"],
  supportedProperty: function(t) {
    return t !== "color-adjust" ? !1 : h.js === "Webkit" ? h.css + "print-" + t : t;
  }
}, Qr = /[-\s]+(.)?/g;
function Xr(n, t) {
  return t ? t.toUpperCase() : "";
}
function Ce(n) {
  return n.replace(Qr, Xr);
}
function P(n) {
  return Ce("-" + n);
}
var en = {
  noPrefill: ["mask"],
  supportedProperty: function(t, r) {
    if (!/^mask/.test(t))
      return !1;
    if (h.js === "Webkit") {
      var e = "mask-image";
      if (Ce(e) in r)
        return t;
      if (h.js + P(e) in r)
        return h.css + t;
    }
    return t;
  }
}, tn = {
  noPrefill: ["text-orientation"],
  supportedProperty: function(t) {
    return t !== "text-orientation" ? !1 : h.vendor === "apple" && !h.isTouch ? h.css + t : t;
  }
}, rn = {
  noPrefill: ["transform"],
  supportedProperty: function(t, r, e) {
    return t !== "transform" ? !1 : e.transform ? t : h.css + t;
  }
}, nn = {
  noPrefill: ["transition"],
  supportedProperty: function(t, r, e) {
    return t !== "transition" ? !1 : e.transition ? t : h.css + t;
  }
}, sn = {
  noPrefill: ["writing-mode"],
  supportedProperty: function(t) {
    return t !== "writing-mode" ? !1 : h.js === "Webkit" || h.js === "ms" && h.browser !== "edge" ? h.css + t : t;
  }
}, on = {
  noPrefill: ["user-select"],
  supportedProperty: function(t) {
    return t !== "user-select" ? !1 : h.js === "Moz" || h.js === "ms" || h.vendor === "apple" ? h.css + t : t;
  }
}, an = {
  supportedProperty: function(t, r) {
    if (!/^break-/.test(t))
      return !1;
    if (h.js === "Webkit") {
      var e = "WebkitColumn" + P(t);
      return e in r ? h.css + "column-" + t : !1;
    }
    if (h.js === "Moz") {
      var i = "page" + P(t);
      return i in r ? "page-" + t : !1;
    }
    return !1;
  }
}, ln = {
  supportedProperty: function(t, r) {
    if (!/^(border|margin|padding)-inline/.test(t))
      return !1;
    if (h.js === "Moz")
      return t;
    var e = t.replace("-inline", "");
    return h.js + P(e) in r ? h.css + e : !1;
  }
}, un = {
  supportedProperty: function(t, r) {
    return Ce(t) in r ? t : !1;
  }
}, fn = {
  supportedProperty: function(t, r) {
    var e = P(t);
    return t[0] === "-" || t[0] === "-" && t[1] === "-" ? t : h.js + e in r ? h.css + t : h.js !== "Webkit" && "Webkit" + e in r ? "-webkit-" + t : !1;
  }
}, cn = {
  supportedProperty: function(t) {
    return t.substring(0, 11) !== "scroll-snap" ? !1 : h.js === "ms" ? "" + h.css + t : t;
  }
}, dn = {
  supportedProperty: function(t) {
    return t !== "overscroll-behavior" ? !1 : h.js === "ms" ? h.css + "scroll-chaining" : t;
  }
}, hn = {
  "flex-grow": "flex-positive",
  "flex-shrink": "flex-negative",
  "flex-basis": "flex-preferred-size",
  "justify-content": "flex-pack",
  order: "flex-order",
  "align-items": "flex-align",
  "align-content": "flex-line-pack"
  // 'align-self' is handled by 'align-self' plugin.
}, pn = {
  supportedProperty: function(t, r) {
    var e = hn[t];
    return e && h.js + P(e) in r ? h.css + e : !1;
  }
}, ot = {
  flex: "box-flex",
  "flex-grow": "box-flex",
  "flex-direction": ["box-orient", "box-direction"],
  order: "box-ordinal-group",
  "align-items": "box-align",
  "flex-flow": ["box-orient", "box-direction"],
  "justify-content": "box-pack"
}, gn = Object.keys(ot), vn = function(t) {
  return h.css + t;
}, yn = {
  supportedProperty: function(t, r, e) {
    var i = e.multiple;
    if (gn.indexOf(t) > -1) {
      var s = ot[t];
      if (!Array.isArray(s))
        return h.js + P(s) in r ? h.css + s : !1;
      if (!i)
        return !1;
      for (var o = 0; o < s.length; o++)
        if (!(h.js + P(s[0]) in r))
          return !1;
      return s.map(vn);
    }
    return !1;
  }
}, at = [Yr, Zr, en, tn, rn, nn, sn, on, an, ln, un, fn, cn, dn, pn, yn], Fe = at.filter(function(n) {
  return n.supportedProperty;
}).map(function(n) {
  return n.supportedProperty;
}), mn = at.filter(function(n) {
  return n.noPrefill;
}).reduce(function(n, t) {
  return n.push.apply(n, Gr(t.noPrefill)), n;
}, []), M, k = {};
if (W) {
  M = document.createElement("p");
  var ue = window.getComputedStyle(document.documentElement, "");
  for (var fe in ue)
    isNaN(fe) || (k[ue[fe]] = ue[fe]);
  mn.forEach(function(n) {
    return delete k[n];
  });
}
function xe(n, t) {
  if (t === void 0 && (t = {}), !M)
    return n;
  if (process.env.NODE_ENV !== "benchmark" && k[n] != null)
    return k[n];
  (n === "transition" || n === "transform") && (t[n] = n in M.style);
  for (var r = 0; r < Fe.length && (k[n] = Fe[r](n, M.style, t), !k[n]); r++)
    ;
  try {
    M.style[n] = "";
  } catch {
    return !1;
  }
  return k[n];
}
var j = {}, bn = {
  transition: 1,
  "transition-property": 1,
  "-webkit-transition": 1,
  "-webkit-transition-property": 1
}, wn = /(^\s*[\w-]+)|, (\s*[\w-]+)(?![^()]*\))/g, R;
function Sn(n, t, r) {
  if (t === "var")
    return "var";
  if (t === "all")
    return "all";
  if (r === "all")
    return ", all";
  var e = t ? xe(t) : ", " + xe(r);
  return e || t || r;
}
W && (R = document.createElement("p"));
function Ue(n, t) {
  var r = t;
  if (!R || n === "content")
    return t;
  if (typeof r != "string" || !isNaN(parseInt(r, 10)))
    return r;
  var e = n + r;
  if (process.env.NODE_ENV !== "benchmark" && j[e] != null)
    return j[e];
  try {
    R.style[n] = r;
  } catch {
    return j[e] = !1, !1;
  }
  if (bn[n])
    r = r.replace(wn, Sn);
  else if (R.style[n] === "" && (r = h.css + r, r === "-ms-flex" && (R.style[n] = "-ms-flexbox"), R.style[n] = r, R.style[n] === ""))
    return j[e] = !1, !1;
  return R.style[n] = "", j[e] = r, j[e];
}
function Rn() {
  function n(i) {
    if (i.type === "keyframes") {
      var s = i;
      s.at = Hr(s.at);
    }
  }
  function t(i) {
    for (var s in i) {
      var o = i[s];
      if (s === "fallbacks" && Array.isArray(o)) {
        i[s] = o.map(t);
        continue;
      }
      var a = !1, u = xe(s);
      u && u !== s && (a = !0);
      var f = !1, d = Ue(u, O(o));
      d && d !== o && (f = !0), (a || f) && (a && delete i[s], i[u || s] = d || o);
    }
    return i;
  }
  function r(i, s) {
    return s.type !== "style" ? i : t(i);
  }
  function e(i, s) {
    return Ue(s, O(i)) || i;
  }
  return {
    onProcessRule: n,
    onProcessStyle: r,
    onChangeValue: e
  };
}
function xn() {
  var n = function(r, e) {
    return r.length === e.length ? r > e ? 1 : -1 : r.length - e.length;
  };
  return {
    onProcessStyle: function(r, e) {
      if (e.type !== "style")
        return r;
      for (var i = {}, s = Object.keys(r).sort(n), o = 0; o < s.length; o++)
        i[s[o]] = r[s[o]];
      return i;
    }
  };
}
var Pn = function(t) {
  return t === void 0 && (t = {}), {
    plugins: [lr(), cr(t.observable), gr(), Sr(), Pr(), Or(), Er(), Nr(), Vr(t.defaultUnit), $r(), Rn(), xn()]
  };
};
const kn = Pn;
Ze.setup(kn());
class jn extends EventTarget {
  constructor() {
    super();
    p(this, "element", document.createElement("div"));
    p(this, "currentTime", 0);
    p(this, "lyricLines", []);
    p(this, "lyricLinesEl", []);
    p(this, "lyricLinesSize", /* @__PURE__ */ new Map());
    p(this, "resizeObserver", new ResizeObserver(() => {
      this.rebuildStyle();
    }));
    p(this, "style", Ze.createStyleSheet({
      lyricPlayer: {
        padding: "1rem",
        "box-sizing": "border-box",
        "font-size": "5vh",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        "max-width": "100%",
        "max-height": "100%",
        color: "var(--amll-lyric-line-color)"
      },
      lyricLine: {
        position: "absolute",
        "transform-origin": "top left"
      }
    }));
    this.rebuildStyle(), this.resizeObserver.observe(this.element), this.style.attach();
  }
  rebuildStyle() {
    let r = "";
    r += "--amll-lyric-player-width:", r += this.element.clientWidth, r += "px;", r += "--amll-lyric-player-height:", r += this.element.clientHeight, r += "px;", r += "--amll-lyric-line-color:", r += "#FFFFFF;", this.element.setAttribute("style", r), this.element.setAttribute("class", this.style.classes.lyricPlayer);
  }
  setLyricLines(r) {
    this.lyricLines = r, this.lyricLinesEl.forEach((e) => e.dispose()), this.lyricLinesEl = r.map((e) => new gt(this, e)), this.lyricLinesEl.forEach(
      (e) => this.element.appendChild(e.getElement())
    ), this.calcLayout();
  }
  calcLayout() {
    this.lyricLinesEl.forEach((e) => {
      this.lyricLinesSize.set(e, [
        e.getElement().clientWidth,
        e.getElement().clientHeight
      ]);
    });
    let r = 0;
    this.lyricLinesEl.forEach((e) => {
      e.setTransform(0, r, 0.5), r += this.lyricLinesSize.get(e)[1];
    });
  }
  getElement() {
    return this.element;
  }
  /**
   * 设置当前播放进度，单位为毫秒，此时将会更新内部的歌词进度信息
   *
   * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
   * @param time 当前播放进度，单位为毫秒
   */
  setCurrentTime(r) {
    this.currentTime = r;
  }
  dispose() {
    this.element.remove(), this.resizeObserver.disconnect(), this.style.detach(), this.lyricLinesEl.forEach((r) => r.dispose());
  }
}
export {
  En as BackgroundRender,
  jn as LyricPlayer
};
