import { defineComponent as S, ref as c, onMounted as P, onUnmounted as y, watchEffect as a, openBlock as v, createElementBlock as b, Fragment as L, createElementVNode as B, mergeProps as E, createBlock as h, Teleport as k, createCommentVNode as w } from "vue";
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
    hidePassedLines: { type: Boolean },
    lyricLines: {},
    currentTime: {},
    linePosXSpringParams: {},
    linePosYSpringParams: {},
    lineScaleSpringParams: {},
    bottomLine: {}
  },
  emits: ["line-click", "line-contextmenu"],
  setup(p, { expose: d, emit: r }) {
    const l = p, i = c(), e = c(), o = (n) => r("line-click", n), f = (n) => r("line-contextmenu", n);
    return P(() => {
      i.value && (e.value = new _(), i.value.appendChild(e.value.getElement()), e.value.addEventListener("line-click", o), e.value.addEventListener("line-contextmenu", f));
    }), y(() => {
      e.value && (e.value.removeEventListener("line-click", o), e.value.removeEventListener("line-contextmenu", f), e.value.dispose());
    }), a((n) => {
      if (!l.disabled) {
        let t = !1, s = -1;
        const u = (m) => {
          var g;
          t || (s === -1 && (s = m), (g = e.value) == null || g.update(m - s), s = m, requestAnimationFrame(u));
        };
        requestAnimationFrame(u), n(() => {
          t = !0;
        });
      }
    }), a(() => {
      var n;
      l.alignAnchor !== void 0 && ((n = e.value) == null || n.setAlignAnchor(l.alignAnchor));
    }), a(() => {
      var n;
      l.hidePassedLines !== void 0 && ((n = e.value) == null || n.setHidePassedLines(l.hidePassedLines));
    }), a(() => {
      var n;
      l.alignPosition !== void 0 && ((n = e.value) == null || n.setAlignPosition(l.alignPosition));
    }), a(() => {
      var n, t;
      l.enableSpring !== void 0 ? (n = e.value) == null || n.setEnableSpring(l.enableSpring) : (t = e.value) == null || t.setEnableSpring(!0);
    }), a(() => {
      var n, t;
      l.enableBlur !== void 0 ? (n = e.value) == null || n.setEnableBlur(l.enableBlur) : (t = e.value) == null || t.setEnableBlur(!0);
    }), a(() => {
      var n, t;
      l.enableScale !== void 0 ? (n = e.value) == null || n.setEnableScale(l.enableScale) : (t = e.value) == null || t.setEnableScale(!0);
    }), a(() => {
      var n;
      l.lyricLines !== void 0 && ((n = e.value) == null || n.setLyricLines(l.lyricLines));
    }), a(() => {
      var n;
      l.currentTime !== void 0 && ((n = e.value) == null || n.setCurrentTime(l.currentTime));
    }), a(() => {
      var n;
      l.linePosXSpringParams !== void 0 && ((n = e.value) == null || n.setLinePosXSpringParams(l.linePosXSpringParams));
    }), a(() => {
      var n;
      l.linePosYSpringParams !== void 0 && ((n = e.value) == null || n.setLinePosYSpringParams(l.linePosYSpringParams));
    }), a(() => {
      var n;
      l.lineScaleSpringParams !== void 0 && ((n = e.value) == null || n.setLineScaleSpringParams(l.lineScaleSpringParams));
    }), d({
      lyricPlayer: e,
      wrapperEl: i
    }), (n, t) => {
      var s, u;
      return v(), b(L, null, [
        B("div", E({
          ref_key: "wrapperRef",
          ref: i
        }, n.$attrs), null, 16),
        (s = e.value) != null && s.getBottomLineElement() && l.bottomLine ? (v(), h(k, {
          key: 0,
          to: (u = e.value) == null ? void 0 : u.getBottomLineElement()
        }, null, 8, ["to"])) : w("", !0)
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
  setup(p, { expose: d }) {
    const r = p, l = c(), i = c();
    return P(() => {
      if (l.value) {
        i.value = new R();
        const e = i.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), y(() => {
      i.value && i.value.dispose();
    }), a(() => {
      var e;
      r.albumImageUrl && ((e = i.value) == null || e.setAlbumImage(r.albumImageUrl));
    }), a(() => {
      var e;
      r.fps && ((e = i.value) == null || e.setFPS(r.fps));
    }), a(() => {
      var e, o;
      r.playing ? (e = i.value) == null || e.pause() : (o = i.value) == null || o.resume();
    }), a(() => {
      var e;
      r.flowSpeed && ((e = i.value) == null || e.setFlowSpeed(r.flowSpeed));
    }), a(() => {
      var e;
      r.renderScale && ((e = i.value) == null || e.setRenderScale(r.renderScale));
    }), d({
      bgRender: i,
      wrapperEl: l
    }), (e, o) => (v(), b("div", {
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
