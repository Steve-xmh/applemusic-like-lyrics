import { jsx as F } from "react/jsx-runtime";
import { BackgroundRender as B, LyricPlayer as C } from "@applemusic-like-lyrics/core";
import { forwardRef as h, useRef as L, useEffect as n, useImperativeHandle as v } from "react";
const x = h(({ albumImageUrl: a, fps: i, playing: o, flowSpeed: p, renderScale: d, ...R }, m) => {
  const u = L(), s = L(null);
  return n(() => (u.current = new B(), () => {
    var t;
    (t = u.current) == null || t.dispose();
  }), []), n(() => {
    var t;
    a && ((t = u.current) == null || t.setAlbumImage(a));
  }, [a]), n(() => {
    var t;
    i && ((t = u.current) == null || t.setFPS(i));
  }, [i]), n(() => {
    var t, f, r;
    o === void 0 ? (t = u.current) == null || t.resume() : o ? (f = u.current) == null || f.resume() : (r = u.current) == null || r.pause();
  }, [o]), n(() => {
    var t;
    p && ((t = u.current) == null || t.setFlowSpeed(p));
  }, [p]), n(() => {
    var t;
    d && ((t = u.current) == null || t.setRenderScale(d));
  }, [d]), n(() => {
    var t;
    if (u.current) {
      const f = u.current.getElement();
      f.style.width = "100%", f.style.height = "100%", (t = s.current) == null || t.appendChild(f);
    }
  }), v(
    m,
    () => ({
      wrapperEl: s.current,
      bgRender: u.current
    }),
    [s.current, u.current]
  ), /* @__PURE__ */ F("div", { ...R, ref: s });
}), $ = h(
  ({
    disabled: a,
    alignAnchor: i,
    enableSpring: o,
    enableBlur: p,
    lyricLines: d,
    currentTime: R,
    linePosXSpringParams: m,
    linePosYSpringParams: u,
    lineScaleSpringParams: s,
    ...t
  }, f) => {
    const r = L(), y = L(null);
    return n(() => (r.current = new C(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (!a) {
        let e = !1, c = -1;
        const E = (l) => {
          var w;
          e || (c === -1 && (c = l), (w = r.current) == null || w.update(l - c), c = l, requestAnimationFrame(E));
        };
        return requestAnimationFrame(E), () => {
          e = !0;
        };
      }
    }, [a]), n(() => {
      var e;
      r.current && ((e = y.current) == null || e.appendChild(r.current.getElement()));
    }, [y.current]), n(() => {
      var e;
      i && ((e = r.current) == null || e.setAlignAnchor(i));
    }, [i]), n(() => {
      var e, c;
      o ? (e = r.current) == null || e.setEnableSpring(o) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [o]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(p ?? !0);
    }, [p]), n(() => {
      var e, c, E, l;
      d ? ((e = r.current) == null || e.setLyricLines(d), (c = r.current) == null || c.update()) : ((E = r.current) == null || E.setLyricLines([]), (l = r.current) == null || l.update());
    }, [d]), n(() => {
      var e, c;
      R ? (e = r.current) == null || e.setCurrentTime(R) : (c = r.current) == null || c.setCurrentTime(0);
    }, [R]), n(() => {
      var e;
      m && ((e = r.current) == null || e.setLinePosXSpringParams(m));
    }, [m]), n(() => {
      var e;
      u && ((e = r.current) == null || e.setLinePosYSpringParams(u));
    }, [u]), n(() => {
      var e;
      s && ((e = r.current) == null || e.setLineScaleSpringParams(s));
    }, [s]), v(
      f,
      () => ({
        wrapperEl: y.current,
        lyricPlayer: r.current
      }),
      [y.current, r.current]
    ), /* @__PURE__ */ F("div", { ...t, ref: y });
  }
);
export {
  x as BackgroundRender,
  $ as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
