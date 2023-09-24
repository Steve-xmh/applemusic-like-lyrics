import { defineComponent as P, ref as u, onMounted as S, onUnmounted as y, watchEffect as r, openBlock as d, createElementBlock as L, Fragment as b, createElementVNode as B, mergeProps as E, createBlock as k, Teleport as w, createCommentVNode as h } from "vue";
import { LyricPlayer as _, BackgroundRender as R } from "@applemusic-like-lyrics/core";
const C = /* @__PURE__ */ P({
  inheritAttrs: !1,
  __name: "LyricPlayer",
  props: {
    disabled: { type: Boolean },
    alignAnchor: {},
    alignPosition: {},
    enableSpring: { type: Boolean },
    enableBlur: { type: Boolean },
    lyricLines: {},
    currentTime: {},
    linePosXSpringParams: {},
    linePosYSpringParams: {},
    lineScaleSpringParams: {},
    bottomLine: {}
  },
  emits: ["line-click", "line-contextmenu"],
  setup(c, { expose: p, emit: i }) {
    const l = c, a = u(), e = u(), o = (n) => i("line-click", n), g = (n) => i("line-contextmenu", n);
    return S(() => {
      a.value && (e.value = new _(), a.value.appendChild(e.value.getElement()), e.value.addEventListener("line-click", o), e.value.addEventListener("line-contextmenu", g));
    }), y(() => {
      e.value && (e.value.removeEventListener("line-click", o), e.value.removeEventListener("line-contextmenu", g), e.value.dispose());
    }), r((n) => {
      if (!l.disabled) {
        let m = !1, t = -1;
        const s = (f) => {
          var v;
          m || (t === -1 && (t = f), (v = e.value) == null || v.update(f - t), t = f, requestAnimationFrame(s));
        };
        requestAnimationFrame(s), n(() => {
          m = !0;
        });
      }
    }), r(() => {
      var n;
      l.alignAnchor && ((n = e.value) == null || n.setAlignAnchor(l.alignAnchor));
    }), r(() => {
      var n;
      l.alignPosition && ((n = e.value) == null || n.setAlignPosition(l.alignPosition));
    }), r(() => {
      var n;
      l.enableSpring && ((n = e.value) == null || n.setEnableSpring(l.enableSpring));
    }), r(() => {
      var n;
      l.enableBlur && ((n = e.value) == null || n.setEnableBlur(l.enableBlur));
    }), r(() => {
      var n;
      l.lyricLines && ((n = e.value) == null || n.setLyricLines(l.lyricLines));
    }), r(() => {
      var n;
      l.currentTime && ((n = e.value) == null || n.setCurrentTime(l.currentTime));
    }), r(() => {
      var n;
      l.linePosXSpringParams && ((n = e.value) == null || n.setLinePosXSpringParams(l.linePosXSpringParams));
    }), r(() => {
      var n;
      l.linePosYSpringParams && ((n = e.value) == null || n.setLinePosYSpringParams(l.linePosYSpringParams));
    }), r(() => {
      var n;
      l.lineScaleSpringParams && ((n = e.value) == null || n.setLineScaleSpringParams(l.lineScaleSpringParams));
    }), p({
      lyricPlayer: e,
      wrapperEl: a
    }), (n, m) => {
      var t, s;
      return d(), L(b, null, [
        B("div", E({
          ref_key: "wrapperRef",
          ref: a
        }, n.$attrs), null, 16),
        (t = e.value) != null && t.getBottomLineElement() && l.bottomLine ? (d(), k(w, {
          key: 0,
          to: (s = e.value) == null ? void 0 : s.getBottomLineElement()
        }, null, 8, ["to"])) : h("", !0)
      ], 64);
    };
  }
}), F = /* @__PURE__ */ P({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    renderScale: {}
  },
  setup(c, { expose: p }) {
    const i = c, l = u(), a = u();
    return S(() => {
      if (l.value) {
        a.value = new R();
        const e = a.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), y(() => {
      a.value && a.value.dispose();
    }), r(() => {
      var e;
      i.albumImageUrl && ((e = a.value) == null || e.setAlbumImage(i.albumImageUrl));
    }), r(() => {
      var e;
      i.fps && ((e = a.value) == null || e.setFPS(i.fps));
    }), r(() => {
      var e, o;
      i.playing ? (e = a.value) == null || e.pause() : (o = a.value) == null || o.resume();
    }), r(() => {
      var e;
      i.flowSpeed && ((e = a.value) == null || e.setFlowSpeed(i.flowSpeed));
    }), r(() => {
      var e;
      i.renderScale && ((e = a.value) == null || e.setRenderScale(i.renderScale));
    }), p({
      bgRender: a,
      wrapperEl: l
    }), (e, o) => (d(), L("div", {
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
