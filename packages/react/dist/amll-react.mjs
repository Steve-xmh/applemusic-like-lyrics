import { jsx as v } from "react/jsx-runtime";
import { BackgroundRender as B, LyricPlayer as C } from "@applemusic-like-lyrics/core";
import { forwardRef as F, useRef as L, useEffect as n, useImperativeHandle as h } from "react";
const x = F(({ albumImageUrl: f, fps: o, playing: d, flowSpeed: a, renderScale: p, ...l }, m) => {
  const u = L(), s = L(null);
  return n(() => (u.current = new B(), () => {
    var t;
    (t = u.current) == null || t.dispose();
  }), []), n(() => {
    var t;
    f && ((t = u.current) == null || t.setAlbumImage(f));
  }, [f]), n(() => {
    var t;
    o && ((t = u.current) == null || t.setFPS(o));
  }, [o]), n(() => {
    var t, i, r;
    d === void 0 ? (t = u.current) == null || t.resume() : d ? (i = u.current) == null || i.resume() : (r = u.current) == null || r.pause();
  }, [d]), n(() => {
    var t;
    a && ((t = u.current) == null || t.setFlowSpeed(a));
  }, [a]), n(() => {
    var t;
    p && ((t = u.current) == null || t.setRenderScale(p));
  }, [p]), n(() => {
    var t;
    if (u.current) {
      const i = u.current.getElement();
      i.style.width = "100%", i.style.height = "100%", (t = s.current) == null || t.appendChild(i);
    }
  }), h(
    m,
    () => ({
      wrapperEl: s.current,
      bgRender: u.current
    }),
    [s.current, u.current]
  ), /* @__PURE__ */ v("div", { ...l, ref: s });
}), $ = F(
  ({
    enable: f,
    alignAnchor: o,
    enableSpring: d,
    enableBlur: a,
    lyricLines: p,
    currentTime: l,
    linePosXSpringParams: m,
    linePosYSpringParams: u,
    lineScaleSpringParams: s,
    ...t
  }, i) => {
    const r = L(), y = L(null);
    return n(() => (r.current = new C(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (f !== void 0 && f) {
        let e = !1, c = -1;
        const E = (R) => {
          var w;
          e || (c === -1 && (c = R), (w = r.current) == null || w.update(R - c), c = R, requestAnimationFrame(E));
        };
        return requestAnimationFrame(E), () => {
          e = !0;
        };
      }
    }, [f]), n(() => {
      var e;
      r.current && ((e = y.current) == null || e.appendChild(r.current.getElement()));
    }, [y.current]), n(() => {
      var e;
      o && ((e = r.current) == null || e.setAlignAnchor(o));
    }, [o]), n(() => {
      var e, c;
      d ? (e = r.current) == null || e.setEnableSpring(d) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [d]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(a ?? !0);
    }, [a]), n(() => {
      var e, c, E, R;
      p ? ((e = r.current) == null || e.setLyricLines(p), (c = r.current) == null || c.update()) : ((E = r.current) == null || E.setLyricLines([]), (R = r.current) == null || R.update());
    }, [p]), n(() => {
      var e, c;
      l ? (e = r.current) == null || e.setCurrentTime(l) : (c = r.current) == null || c.setCurrentTime(0);
    }, [l]), n(() => {
      var e;
      m && ((e = r.current) == null || e.setLinePosXSpringParams(m));
    }, [m]), n(() => {
      var e;
      u && ((e = r.current) == null || e.setLinePosYSpringParams(u));
    }, [u]), n(() => {
      var e;
      s && ((e = r.current) == null || e.setLineScaleSpringParams(s));
    }, [s]), h(
      i,
      () => ({
        wrapperEl: y.current,
        lyricPlayer: r.current
      }),
      [y.current, r.current]
    ), /* @__PURE__ */ v("div", { ...t, ref: y });
  }
);
export {
  x as BackgroundRender,
  $ as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
