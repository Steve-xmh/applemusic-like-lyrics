import { defineComponent as S, ref as c, onMounted as P, onUnmounted as L, watchEffect as i, openBlock as v, createElementBlock as b, Fragment as B, createElementVNode as E, mergeProps as h, createBlock as w, Teleport as k, createCommentVNode as R } from "vue";
import { LyricPlayer as _, BackgroundRender as F, EplorRenderer as A } from "@applemusic-like-lyrics/core";
const q = /* @__PURE__ */ S({
  inheritAttrs: !1,
  __name: "LyricPlayer",
  props: {
    disabled: { type: Boolean },
    playing: { type: Boolean },
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
    const n = p, t = r, a = c(), l = c(), f = (e) => t("line-click", e), g = (e) => t("line-contextmenu", e);
    return P(() => {
      a.value && (l.value = new _(), a.value.appendChild(l.value.getElement()), l.value.addEventListener("line-click", f), l.value.addEventListener("line-contextmenu", g));
    }), L(() => {
      l.value && (l.value.removeEventListener("line-click", f), l.value.removeEventListener("line-contextmenu", g), l.value.dispose());
    }), i((e) => {
      if (!n.disabled) {
        let o = !1, s = -1;
        const u = (d) => {
          var y;
          o || (s === -1 && (s = d), (y = l.value) == null || y.update(d - s), s = d, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), e(() => {
          o = !0;
        });
      }
    }), i(() => {
      var e, o, s;
      n.playing !== void 0 ? n.playing ? (e = l.value) == null || e.resume() : (o = l.value) == null || o.pause() : (s = l.value) == null || s.resume();
    }), i(() => {
      var e;
      n.alignAnchor !== void 0 && ((e = l.value) == null || e.setAlignAnchor(n.alignAnchor));
    }), i(() => {
      var e;
      n.hidePassedLines !== void 0 && ((e = l.value) == null || e.setHidePassedLines(n.hidePassedLines));
    }), i(() => {
      var e;
      n.alignPosition !== void 0 && ((e = l.value) == null || e.setAlignPosition(n.alignPosition));
    }), i(() => {
      var e, o;
      n.enableSpring !== void 0 ? (e = l.value) == null || e.setEnableSpring(n.enableSpring) : (o = l.value) == null || o.setEnableSpring(!0);
    }), i(() => {
      var e, o;
      n.enableBlur !== void 0 ? (e = l.value) == null || e.setEnableBlur(n.enableBlur) : (o = l.value) == null || o.setEnableBlur(!0);
    }), i(() => {
      var e, o;
      n.enableScale !== void 0 ? (e = l.value) == null || e.setEnableScale(n.enableScale) : (o = l.value) == null || o.setEnableScale(!0);
    }), i(() => {
      var e;
      n.lyricLines !== void 0 && ((e = l.value) == null || e.setLyricLines(n.lyricLines));
    }), i(() => {
      var e;
      n.currentTime !== void 0 && ((e = l.value) == null || e.setCurrentTime(n.currentTime));
    }), i(() => {
      var e;
      n.linePosXSpringParams !== void 0 && ((e = l.value) == null || e.setLinePosXSpringParams(n.linePosXSpringParams));
    }), i(() => {
      var e;
      n.linePosYSpringParams !== void 0 && ((e = l.value) == null || e.setLinePosYSpringParams(n.linePosYSpringParams));
    }), i(() => {
      var e;
      n.lineScaleSpringParams !== void 0 && ((e = l.value) == null || e.setLineScaleSpringParams(n.lineScaleSpringParams));
    }), m({
      lyricPlayer: l,
      wrapperEl: a
    }), (e, o) => {
      var s, u;
      return v(), b(B, null, [
        E("div", h({
          ref_key: "wrapperRef",
          ref: a
        }, e.$attrs), null, 16),
        (s = l.value) != null && s.getBottomLineElement() && n.bottomLine ? (v(), w(k, {
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
    const r = p, n = c(), t = c();
    return P(() => {
      if (n.value) {
        t.value = F.new(r.renderer ?? A);
        const a = t.value.getElement();
        a.style.width = "100%", a.style.height = "100%", n.value.appendChild(a);
      }
    }), L(() => {
      t.value && t.value.dispose();
    }), i(() => {
      var a;
      r.albumImageUrl && ((a = t.value) == null || a.setAlbumImage(r.albumImageUrl));
    }), i(() => {
      var a;
      r.fps && ((a = t.value) == null || a.setFPS(r.fps));
    }), i(() => {
      var a, l;
      r.playing ? (a = t.value) == null || a.pause() : (l = t.value) == null || l.resume();
    }), i(() => {
      var a;
      r.flowSpeed && ((a = t.value) == null || a.setFlowSpeed(r.flowSpeed));
    }), i(() => {
      var a;
      r.renderScale && ((a = t.value) == null || a.setRenderScale(r.renderScale));
    }), i(() => {
      var a;
      r.lowFreqVolume && ((a = t.value) == null || a.setLowFreqVolume(r.lowFreqVolume));
    }), i(() => {
      var a;
      r.hasLyric !== void 0 && ((a = t.value) == null || a.setHasLyric(r.hasLyric ?? !0));
    }), m({
      bgRender: t,
      wrapperEl: n
    }), (a, l) => (v(), b("div", {
      ref_key: "wrapperRef",
      ref: n
    }, null, 512));
  }
});
export {
  T as BackgroundRender,
  q as LyricPlayer
};
//# sourceMappingURL=amll-vue.js.map
