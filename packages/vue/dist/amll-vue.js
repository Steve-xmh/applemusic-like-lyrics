import { defineComponent as S, ref as c, onMounted as y, onUnmounted as b, watchEffect as i, openBlock as v, createElementBlock as L, Fragment as B, createElementVNode as E, mergeProps as h, createBlock as k, Teleport as w, createCommentVNode as R } from "vue";
import { LyricPlayer as _, BackgroundRender as x, PixiRenderer as A } from "@applemusic-like-lyrics/core";
const T = /* @__PURE__ */ S({
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
  setup(p, { expose: d, emit: t }) {
    const l = p, r = t, a = c(), n = c(), f = (e) => r("line-click", e), g = (e) => r("line-contextmenu", e);
    return y(() => {
      a.value && (n.value = new _(), a.value.appendChild(n.value.getElement()), n.value.addEventListener("line-click", f), n.value.addEventListener("line-contextmenu", g));
    }), b(() => {
      n.value && (n.value.removeEventListener("line-click", f), n.value.removeEventListener("line-contextmenu", g), n.value.dispose());
    }), i((e) => {
      if (!l.disabled) {
        let s = !1, o = -1;
        const u = (m) => {
          var P;
          s || (o === -1 && (o = m), (P = n.value) == null || P.update(m - o), o = m, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), e(() => {
          s = !0;
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
      var e, s;
      l.enableSpring !== void 0 ? (e = n.value) == null || e.setEnableSpring(l.enableSpring) : (s = n.value) == null || s.setEnableSpring(!0);
    }), i(() => {
      var e, s;
      l.enableBlur !== void 0 ? (e = n.value) == null || e.setEnableBlur(l.enableBlur) : (s = n.value) == null || s.setEnableBlur(!0);
    }), i(() => {
      var e, s;
      l.enableScale !== void 0 ? (e = n.value) == null || e.setEnableScale(l.enableScale) : (s = n.value) == null || s.setEnableScale(!0);
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
    }), d({
      lyricPlayer: n,
      wrapperEl: a
    }), (e, s) => {
      var o, u;
      return v(), L(B, null, [
        E("div", h({
          ref_key: "wrapperRef",
          ref: a
        }, e.$attrs), null, 16),
        (o = n.value) != null && o.getBottomLineElement() && l.bottomLine ? (v(), k(w, {
          key: 0,
          to: (u = n.value) == null ? void 0 : u.getBottomLineElement()
        }, null, 8, ["to"])) : R("", !0)
      ], 64);
    };
  }
}), I = /* @__PURE__ */ S({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    renderScale: {},
    renderer: { type: Function }
  },
  setup(p, { expose: d }) {
    const t = p, l = c(), r = c();
    return y(() => {
      if (l.value) {
        r.value = x.new(t.renderer ?? A);
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
    }), d({
      bgRender: r,
      wrapperEl: l
    }), (a, n) => (v(), L("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  I as BackgroundRender,
  T as LyricPlayer
};
//# sourceMappingURL=amll-vue.js.map
