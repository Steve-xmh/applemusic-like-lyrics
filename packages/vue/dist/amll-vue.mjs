import { defineComponent as m, ref as p, onMounted as d, onUnmounted as g, watchEffect as n, openBlock as v, createElementBlock as S } from "vue";
import { LyricPlayer as P, BackgroundRender as y } from "@applemusic-like-lyrics/core";
const _ = /* @__PURE__ */ m({
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
    lineScaleSpringParams: {}
  },
  setup(t, { expose: o }) {
    const a = t, l = p(), r = p();
    return d(() => {
      l.value && (r.value = new P(), l.value.appendChild(r.value.getElement()));
    }), g(() => {
      r.value && r.value.dispose();
    }), n((e) => {
      if (!a.disabled) {
        let i = !1, s = -1;
        const c = (u) => {
          var f;
          i || (s === -1 && (s = u), (f = r.value) == null || f.update(u - s), s = u, requestAnimationFrame(c));
        };
        requestAnimationFrame(c), e(() => {
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
    }), o({
      lyricPlayer: r,
      wrapperEl: l
    }), (e, i) => (v(), S("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
}), B = /* @__PURE__ */ m({
  __name: "BackgroundRender",
  props: {
    albumImageUrl: {},
    fps: {},
    playing: { type: Boolean },
    flowSpeed: {},
    renderScale: {}
  },
  setup(t, { expose: o }) {
    const a = t, l = p(), r = p();
    return d(() => {
      if (l.value) {
        r.value = new y();
        const e = r.value.getElement();
        e.style.width = "100%", e.style.height = "100%", l.value.appendChild(e);
      }
    }), g(() => {
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
    }), o({
      bgRender: r,
      wrapperEl: l
    }), (e, i) => (v(), S("div", {
      ref_key: "wrapperRef",
      ref: l
    }, null, 512));
  }
});
export {
  B as BackgroundRender,
  _ as LyricPlayer
};
//# sourceMappingURL=amll-vue.mjs.map
