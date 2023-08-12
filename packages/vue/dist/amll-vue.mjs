import { defineComponent as g, ref as s, onMounted as d, onUnmounted as v, watchEffect as n, openBlock as m, createElementBlock as S, Fragment as P, createElementVNode as y, createBlock as b, Teleport as B, createCommentVNode as L } from "vue";
import { LyricPlayer as w, BackgroundRender as _ } from "@applemusic-like-lyrics/core";
const E = /* @__PURE__ */ g({
  __name: "LyricPlayer",
  props: {
    disabled: { type: Boolean },
    alignAnchor: {},
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
    const a = p, l = s(), r = s();
    return d(() => {
      l.value && (r.value = new w(), l.value.appendChild(r.value.getElement()));
    }), v(() => {
      r.value && r.value.dispose();
    }), n((e) => {
      if (!a.disabled) {
        let i = !1, t = -1;
        const o = (c) => {
          var f;
          i || (t === -1 && (t = c), (f = r.value) == null || f.update(c - t), t = c, requestAnimationFrame(o));
        };
        requestAnimationFrame(o), e(() => {
          i = !0;
        });
      }
    }), n(() => {
      var e;
      a.alignAnchor && ((e = r.value) == null || e.setAlignAnchor(a.alignAnchor));
    }), n(() => {
      var e;
      a.enableSpring && ((e = r.value) == null || e.setEnableSpring(a.enableSpring));
    }), n(() => {
      var e;
      a.enableBlur && ((e = r.value) == null || e.setEnableBlur(a.enableBlur));
    }), n(() => {
      var e;
      a.lyricLines && ((e = r.value) == null || e.setLyricLines(a.lyricLines));
    }), n(() => {
      var e;
      a.currentTime && ((e = r.value) == null || e.setCurrentTime(a.currentTime));
    }), n(() => {
      var e;
      a.linePosXSpringParams && ((e = r.value) == null || e.setLinePosXSpringParams(a.linePosXSpringParams));
    }), n(() => {
      var e;
      a.linePosYSpringParams && ((e = r.value) == null || e.setLinePosYSpringParams(a.linePosYSpringParams));
    }), n(() => {
      var e;
      a.lineScaleSpringParams && ((e = r.value) == null || e.setLineScaleSpringParams(a.lineScaleSpringParams));
    }), u({
      lyricPlayer: r,
      wrapperEl: l
    }), (e, i) => {
      var t, o;
      return m(), S(P, null, [
        y("div", {
          ref_key: "wrapperRef",
          ref: l
        }, null, 512),
        (t = r.value) != null && t.getBottomLineElement() && a.bottomLine ? (m(), b(B, {
          key: 0,
          to: (o = r.value) == null ? void 0 : o.getBottomLineElement()
        }, null, 8, ["to"])) : L("", !0)
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
    const a = p, l = s(), r = s();
    return d(() => {
      if (l.value) {
        r.value = new _();
        const e = r.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), v(() => {
      r.value && r.value.dispose();
    }), n(() => {
      var e;
      a.albumImageUrl && ((e = r.value) == null || e.setAlbumImage(a.albumImageUrl));
    }), n(() => {
      var e;
      a.fps && ((e = r.value) == null || e.setFPS(a.fps));
    }), n(() => {
      var e, i;
      a.playing ? (e = r.value) == null || e.pause() : (i = r.value) == null || i.resume();
    }), n(() => {
      var e;
      a.flowSpeed && ((e = r.value) == null || e.setFlowSpeed(a.flowSpeed));
    }), n(() => {
      var e;
      a.renderScale && ((e = r.value) == null || e.setRenderScale(a.renderScale));
    }), u({
      bgRender: r,
      wrapperEl: l
    }), (e, i) => (m(), S("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  k as BackgroundRender,
  E as LyricPlayer
};
//# sourceMappingURL=amll-vue.mjs.map
