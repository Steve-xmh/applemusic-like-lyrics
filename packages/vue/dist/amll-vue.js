import { defineComponent as S, ref as c, onMounted as y, onUnmounted as L, watchEffect as i, openBlock as v, createElementBlock as b, Fragment as B, createElementVNode as h, mergeProps as E, createBlock as w, Teleport as k, createCommentVNode as R } from "vue";
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
  setup(p, { expose: m, emit: r }) {
    const a = p, t = r, n = c(), l = c(), f = (e) => t("line-click", e), g = (e) => t("line-contextmenu", e);
    return y(() => {
      n.value && (l.value = new _(), n.value.appendChild(l.value.getElement()), l.value.addEventListener("line-click", f), l.value.addEventListener("line-contextmenu", g));
    }), L(() => {
      l.value && (l.value.removeEventListener("line-click", f), l.value.removeEventListener("line-contextmenu", g), l.value.dispose());
    }), i((e) => {
      if (!a.disabled) {
        let o = !1, s = -1;
        const u = (d) => {
          var P;
          o || (s === -1 && (s = d), (P = l.value) == null || P.update(d - s), s = d, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), e(() => {
          o = !0;
        });
      }
    }), i(() => {
      var e;
      a.alignAnchor !== void 0 && ((e = l.value) == null || e.setAlignAnchor(a.alignAnchor));
    }), i(() => {
      var e;
      a.hidePassedLines !== void 0 && ((e = l.value) == null || e.setHidePassedLines(a.hidePassedLines));
    }), i(() => {
      var e;
      a.alignPosition !== void 0 && ((e = l.value) == null || e.setAlignPosition(a.alignPosition));
    }), i(() => {
      var e, o;
      a.enableSpring !== void 0 ? (e = l.value) == null || e.setEnableSpring(a.enableSpring) : (o = l.value) == null || o.setEnableSpring(!0);
    }), i(() => {
      var e, o;
      a.enableBlur !== void 0 ? (e = l.value) == null || e.setEnableBlur(a.enableBlur) : (o = l.value) == null || o.setEnableBlur(!0);
    }), i(() => {
      var e, o;
      a.enableScale !== void 0 ? (e = l.value) == null || e.setEnableScale(a.enableScale) : (o = l.value) == null || o.setEnableScale(!0);
    }), i(() => {
      var e;
      a.lyricLines !== void 0 && ((e = l.value) == null || e.setLyricLines(a.lyricLines));
    }), i(() => {
      var e;
      a.currentTime !== void 0 && ((e = l.value) == null || e.setCurrentTime(a.currentTime));
    }), i(() => {
      var e;
      a.linePosXSpringParams !== void 0 && ((e = l.value) == null || e.setLinePosXSpringParams(a.linePosXSpringParams));
    }), i(() => {
      var e;
      a.linePosYSpringParams !== void 0 && ((e = l.value) == null || e.setLinePosYSpringParams(a.linePosYSpringParams));
    }), i(() => {
      var e;
      a.lineScaleSpringParams !== void 0 && ((e = l.value) == null || e.setLineScaleSpringParams(a.lineScaleSpringParams));
    }), m({
      lyricPlayer: l,
      wrapperEl: n
    }), (e, o) => {
      var s, u;
      return v(), b(B, null, [
        h("div", E({
          ref_key: "wrapperRef",
          ref: n
        }, e.$attrs), null, 16),
        (s = l.value) != null && s.getBottomLineElement() && a.bottomLine ? (v(), w(k, {
          key: 0,
          to: (u = l.value) == null ? void 0 : u.getBottomLineElement()
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
    hasLyric: { type: Boolean },
    lowFreqVolume: {},
    renderScale: {},
    renderer: { type: Function }
  },
  setup(p, { expose: m }) {
    const r = p, a = c(), t = c();
    return y(() => {
      if (a.value) {
        t.value = F.new(r.renderer ?? x);
        const n = t.value.getElement();
        n.style.width = "100%", n.style.height = "100%", a.value.appendChild(n);
      }
    }), L(() => {
      t.value && t.value.dispose();
    }), i(() => {
      var n;
      r.albumImageUrl && ((n = t.value) == null || n.setAlbumImage(r.albumImageUrl));
    }), i(() => {
      var n;
      r.fps && ((n = t.value) == null || n.setFPS(r.fps));
    }), i(() => {
      var n, l;
      r.playing ? (n = t.value) == null || n.pause() : (l = t.value) == null || l.resume();
    }), i(() => {
      var n;
      r.flowSpeed && ((n = t.value) == null || n.setFlowSpeed(r.flowSpeed));
    }), i(() => {
      var n;
      r.renderScale && ((n = t.value) == null || n.setRenderScale(r.renderScale));
    }), i(() => {
      var n;
      r.lowFreqVolume && ((n = t.value) == null || n.setLowFreqVolume(r.lowFreqVolume));
    }), i(() => {
      var n;
      r.hasLyric !== void 0 && ((n = t.value) == null || n.setHasLyric(r.hasLyric ?? !0));
    }), m({
      bgRender: t,
      wrapperEl: a
    }), (n, l) => (v(), b("div", {
      ref_key: "wrapperRef",
      ref: a
    }, null, 512));
  }
});
export {
  T as BackgroundRender,
  q as LyricPlayer
};
//# sourceMappingURL=amll-vue.js.map
