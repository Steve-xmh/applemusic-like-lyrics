import { defineComponent as S, ref as c, onMounted as y, onUnmounted as b, watchEffect as i, openBlock as v, createElementBlock as L, Fragment as B, createElementVNode as E, mergeProps as w, createBlock as h, Teleport as k, createCommentVNode as R } from "vue";
import { LyricPlayer as _, BackgroundRender as F, PixiRenderer as x } from "@applemusic-like-lyrics/core";
const q = /* @__PURE__ */ S({
  inheritAttrs: !1,
  __name: "LyricPlayer",
  props: {
    disabled: { type: Boolean },
    alignAnchor: {},
    alignPosition: {},
    enableSpring: { type: Boolean },
    enableBlur: { type: Boolean },
    enableScale: { type: Boolean },
    hidePassedLines: { type: Boolean },
    lyricLines: {},
    currentTime: {},
    linePosXSpringParams: {},
    linePosYSpringParams: {},
    lineScaleSpringParams: {},
    bottomLine: {}
  },
  emits: ["line-click", "line-contextmenu"],
  setup(p, { expose: m, emit: t }) {
    const l = p, r = t, a = c(), n = c(), f = (e) => r("line-click", e), g = (e) => r("line-contextmenu", e);
    return y(() => {
      a.value && (n.value = new _(), a.value.appendChild(n.value.getElement()), n.value.addEventListener("line-click", f), n.value.addEventListener("line-contextmenu", g));
    }), b(() => {
      n.value && (n.value.removeEventListener("line-click", f), n.value.removeEventListener("line-contextmenu", g), n.value.dispose());
    }), i((e) => {
      if (!l.disabled) {
        let o = !1, s = -1;
        const u = (d) => {
          var P;
          o || (s === -1 && (s = d), (P = n.value) == null || P.update(d - s), s = d, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), e(() => {
          o = !0;
        });
      }
    }), i(() => {
      var e;
      l.alignAnchor !== void 0 && ((e = n.value) == null || e.setAlignAnchor(l.alignAnchor));
    }), i(() => {
      var e;
      l.hidePassedLines !== void 0 && ((e = n.value) == null || e.setHidePassedLines(l.hidePassedLines));
    }), i(() => {
      var e;
      l.alignPosition !== void 0 && ((e = n.value) == null || e.setAlignPosition(l.alignPosition));
    }), i(() => {
      var e, o;
      l.enableSpring !== void 0 ? (e = n.value) == null || e.setEnableSpring(l.enableSpring) : (o = n.value) == null || o.setEnableSpring(!0);
    }), i(() => {
      var e, o;
      l.enableBlur !== void 0 ? (e = n.value) == null || e.setEnableBlur(l.enableBlur) : (o = n.value) == null || o.setEnableBlur(!0);
    }), i(() => {
      var e, o;
      l.enableScale !== void 0 ? (e = n.value) == null || e.setEnableScale(l.enableScale) : (o = n.value) == null || o.setEnableScale(!0);
    }), i(() => {
      var e;
      l.lyricLines !== void 0 && ((e = n.value) == null || e.setLyricLines(l.lyricLines));
    }), i(() => {
      var e;
      l.currentTime !== void 0 && ((e = n.value) == null || e.setCurrentTime(l.currentTime));
    }), i(() => {
      var e;
      l.linePosXSpringParams !== void 0 && ((e = n.value) == null || e.setLinePosXSpringParams(l.linePosXSpringParams));
    }), i(() => {
      var e;
      l.linePosYSpringParams !== void 0 && ((e = n.value) == null || e.setLinePosYSpringParams(l.linePosYSpringParams));
    }), i(() => {
      var e;
      l.lineScaleSpringParams !== void 0 && ((e = n.value) == null || e.setLineScaleSpringParams(l.lineScaleSpringParams));
    }), m({
      lyricPlayer: n,
      wrapperEl: a
    }), (e, o) => {
      var s, u;
      return v(), L(B, null, [
        E("div", w({
          ref_key: "wrapperRef",
          ref: a
        }, e.$attrs), null, 16),
        (s = n.value) != null && s.getBottomLineElement() && l.bottomLine ? (v(), h(k, {
          key: 0,
          to: (u = n.value) == null ? void 0 : u.getBottomLineElement()
        }, null, 8, ["to"])) : R("", !0)
      ], 64);
    };
  }
}), T = /* @__PURE__ */ S({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    lowFreqVolume: {},
    renderScale: {},
    renderer: { type: Function }
  },
  setup(p, { expose: m }) {
    const t = p, l = c(), r = c();
    return y(() => {
      if (l.value) {
        r.value = F.new(t.renderer ?? x);
        const a = r.value.getElement();
        a.style.width = "100%", a.style.height = "100%", l.value.appendChild(a);
      }
    }), b(() => {
      r.value && r.value.dispose();
    }), i(() => {
      var a;
      t.albumImageUrl && ((a = r.value) == null || a.setAlbumImage(t.albumImageUrl));
    }), i(() => {
      var a;
      t.fps && ((a = r.value) == null || a.setFPS(t.fps));
    }), i(() => {
      var a, n;
      t.playing ? (a = r.value) == null || a.pause() : (n = r.value) == null || n.resume();
    }), i(() => {
      var a;
      t.flowSpeed && ((a = r.value) == null || a.setFlowSpeed(t.flowSpeed));
    }), i(() => {
      var a;
      t.renderScale && ((a = r.value) == null || a.setRenderScale(t.renderScale));
    }), i(() => {
      var a;
      t.lowFreqVolume && ((a = r.value) == null || a.setLowFreqVolume(t.lowFreqVolume));
    }), m({
      bgRender: r,
      wrapperEl: l
    }), (a, n) => (v(), L("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  T as BackgroundRender,
  q as LyricPlayer
};
//# sourceMappingURL=amll-vue.js.map
