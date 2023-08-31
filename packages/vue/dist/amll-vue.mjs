import { defineComponent as g, ref as s, onMounted as d, onUnmounted as v, watchEffect as r, openBlock as m, createElementBlock as P, Fragment as S, createElementVNode as y, mergeProps as b, createBlock as B, Teleport as L, createCommentVNode as w } from "vue";
import { LyricPlayer as h, BackgroundRender as _ } from "@applemusic-like-lyrics/core";
const A = /* @__PURE__ */ g({
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
  setup(p, { expose: u }) {
    const a = p, l = s(), n = s();
    return d(() => {
      l.value && (n.value = new h(), l.value.appendChild(n.value.getElement()));
    }), v(() => {
      n.value && n.value.dispose();
    }), r((e) => {
      if (!a.disabled) {
        let i = !1, t = -1;
        const o = (c) => {
          var f;
          i || (t === -1 && (t = c), (f = n.value) == null || f.update(c - t), t = c, requestAnimationFrame(o));
        };
        requestAnimationFrame(o), e(() => {
          i = !0;
        });
      }
    }), r(() => {
      var e;
      a.alignAnchor && ((e = n.value) == null || e.setAlignAnchor(a.alignAnchor));
    }), r(() => {
      var e;
      a.alignPosition && ((e = n.value) == null || e.setAlignPosition(a.alignPosition));
    }), r(() => {
      var e;
      a.enableSpring && ((e = n.value) == null || e.setEnableSpring(a.enableSpring));
    }), r(() => {
      var e;
      a.enableBlur && ((e = n.value) == null || e.setEnableBlur(a.enableBlur));
    }), r(() => {
      var e;
      a.lyricLines && ((e = n.value) == null || e.setLyricLines(a.lyricLines));
    }), r(() => {
      var e;
      a.currentTime && ((e = n.value) == null || e.setCurrentTime(a.currentTime));
    }), r(() => {
      var e;
      a.linePosXSpringParams && ((e = n.value) == null || e.setLinePosXSpringParams(a.linePosXSpringParams));
    }), r(() => {
      var e;
      a.linePosYSpringParams && ((e = n.value) == null || e.setLinePosYSpringParams(a.linePosYSpringParams));
    }), r(() => {
      var e;
      a.lineScaleSpringParams && ((e = n.value) == null || e.setLineScaleSpringParams(a.lineScaleSpringParams));
    }), u({
      lyricPlayer: n,
      wrapperEl: l
    }), (e, i) => {
      var t, o;
      return m(), P(S, null, [
        y("div", b({
          ref_key: "wrapperRef",
          ref: l
        }, e.$attrs), null, 16),
        (t = n.value) != null && t.getBottomLineElement() && a.bottomLine ? (m(), B(L, {
          key: 0,
          to: (o = n.value) == null ? void 0 : o.getBottomLineElement()
        }, null, 8, ["to"])) : w("", !0)
      ], 64);
    };
  }
}), k = /* @__PURE__ */ g({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    renderScale: {}
  },
  setup(p, { expose: u }) {
    const a = p, l = s(), n = s();
    return d(() => {
      if (l.value) {
        n.value = new _();
        const e = n.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), v(() => {
      n.value && n.value.dispose();
    }), r(() => {
      var e;
      a.albumImageUrl && ((e = n.value) == null || e.setAlbumImage(a.albumImageUrl));
    }), r(() => {
      var e;
      a.fps && ((e = n.value) == null || e.setFPS(a.fps));
    }), r(() => {
      var e, i;
      a.playing ? (e = n.value) == null || e.pause() : (i = n.value) == null || i.resume();
    }), r(() => {
      var e;
      a.flowSpeed && ((e = n.value) == null || e.setFlowSpeed(a.flowSpeed));
    }), r(() => {
      var e;
      a.renderScale && ((e = n.value) == null || e.setRenderScale(a.renderScale));
    }), u({
      bgRender: n,
      wrapperEl: l
    }), (e, i) => (m(), P("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  k as BackgroundRender,
  A as LyricPlayer
};
//# sourceMappingURL=amll-vue.mjs.map
