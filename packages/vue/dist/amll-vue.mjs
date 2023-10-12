import { defineComponent as S, ref as c, onMounted as P, onUnmounted as b, watchEffect as r, openBlock as d, createElementBlock as y, Fragment as E, createElementVNode as L, mergeProps as B, createBlock as k, Teleport as w, createCommentVNode as h } from "vue";
import { LyricPlayer as _, BackgroundRender as R } from "@applemusic-like-lyrics/core";
const C = /* @__PURE__ */ S({
  inheritAttrs: !1,
  __name: "LyricPlayer",
  props: {
    disabled: { type: Boolean },
    alignAnchor: {},
    alignPosition: {},
    enableSpring: { type: Boolean },
    enableBlur: { type: Boolean },
    enableScale: { type: Boolean },
    lyricLines: {},
    currentTime: {},
    linePosXSpringParams: {},
    linePosYSpringParams: {},
    lineScaleSpringParams: {},
    bottomLine: {}
  },
  emits: ["line-click", "line-contextmenu"],
  setup(p, { expose: m, emit: i }) {
    const l = p, a = c(), e = c(), s = (n) => i("line-click", n), f = (n) => i("line-contextmenu", n);
    return P(() => {
      a.value && (e.value = new _(), a.value.appendChild(e.value.getElement()), e.value.addEventListener("line-click", s), e.value.addEventListener("line-contextmenu", f));
    }), b(() => {
      e.value && (e.value.removeEventListener("line-click", s), e.value.removeEventListener("line-contextmenu", f), e.value.dispose());
    }), r((n) => {
      if (!l.disabled) {
        let t = !1, o = -1;
        const u = (v) => {
          var g;
          t || (o === -1 && (o = v), (g = e.value) == null || g.update(v - o), o = v, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), n(() => {
          t = !0;
        });
      }
    }), r(() => {
      var n;
      l.alignAnchor !== void 0 && ((n = e.value) == null || n.setAlignAnchor(l.alignAnchor));
    }), r(() => {
      var n;
      l.alignPosition !== void 0 && ((n = e.value) == null || n.setAlignPosition(l.alignPosition));
    }), r(() => {
      var n, t;
      l.enableSpring !== void 0 ? (n = e.value) == null || n.setEnableSpring(l.enableSpring) : (t = e.value) == null || t.setEnableSpring(!0);
    }), r(() => {
      var n, t;
      l.enableBlur !== void 0 ? (n = e.value) == null || n.setEnableBlur(l.enableBlur) : (t = e.value) == null || t.setEnableBlur(!0);
    }), r(() => {
      var n, t;
      l.enableScale !== void 0 ? (n = e.value) == null || n.setEnableScale(l.enableScale) : (t = e.value) == null || t.setEnableScale(!0);
    }), r(() => {
      var n;
      l.lyricLines !== void 0 && ((n = e.value) == null || n.setLyricLines(l.lyricLines));
    }), r(() => {
      var n;
      l.currentTime !== void 0 && ((n = e.value) == null || n.setCurrentTime(l.currentTime));
    }), r(() => {
      var n;
      l.linePosXSpringParams !== void 0 && ((n = e.value) == null || n.setLinePosXSpringParams(l.linePosXSpringParams));
    }), r(() => {
      var n;
      l.linePosYSpringParams !== void 0 && ((n = e.value) == null || n.setLinePosYSpringParams(l.linePosYSpringParams));
    }), r(() => {
      var n;
      l.lineScaleSpringParams !== void 0 && ((n = e.value) == null || n.setLineScaleSpringParams(l.lineScaleSpringParams));
    }), m({
      lyricPlayer: e,
      wrapperEl: a
    }), (n, t) => {
      var o, u;
      return d(), y(E, null, [
        L("div", B({
          ref_key: "wrapperRef",
          ref: a
        }, n.$attrs), null, 16),
        (o = e.value) != null && o.getBottomLineElement() && l.bottomLine ? (d(), k(w, {
          key: 0,
          to: (u = e.value) == null ? void 0 : u.getBottomLineElement()
        }, null, 8, ["to"])) : h("", !0)
      ], 64);
    };
  }
}), F = /* @__PURE__ */ S({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    renderScale: {}
  },
  setup(p, { expose: m }) {
    const i = p, l = c(), a = c();
    return P(() => {
      if (l.value) {
        a.value = new R();
        const e = a.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), b(() => {
      a.value && a.value.dispose();
    }), r(() => {
      var e;
      i.albumImageUrl && ((e = a.value) == null || e.setAlbumImage(i.albumImageUrl));
    }), r(() => {
      var e;
      i.fps && ((e = a.value) == null || e.setFPS(i.fps));
    }), r(() => {
      var e, s;
      i.playing ? (e = a.value) == null || e.pause() : (s = a.value) == null || s.resume();
    }), r(() => {
      var e;
      i.flowSpeed && ((e = a.value) == null || e.setFlowSpeed(i.flowSpeed));
    }), r(() => {
      var e;
      i.renderScale && ((e = a.value) == null || e.setRenderScale(i.renderScale));
    }), m({
      bgRender: a,
      wrapperEl: l
    }), (e, s) => (d(), y("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  F as BackgroundRender,
  C as LyricPlayer
};
//# sourceMappingURL=amll-vue.mjs.map
