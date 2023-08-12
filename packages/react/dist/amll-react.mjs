import { jsx as h, jsxs as g, Fragment as k } from "react/jsx-runtime";
import { BackgroundRender as x, LyricPlayer as A } from "@applemusic-like-lyrics/core";
import { forwardRef as v, useRef as y, useEffect as n, useImperativeHandle as C } from "react";
import { createPortal as j } from "react-dom";
const G = v(({ albumImageUrl: m, fps: o, playing: f, flowSpeed: a, renderScale: d, ...p }, L) => {
  const u = y(), s = y(null);
  return n(() => (u.current = new x(), () => {
    var t;
    (t = u.current) == null || t.dispose();
  }), []), n(() => {
    var t;
    m && ((t = u.current) == null || t.setAlbumImage(m));
  }, [m]), n(() => {
    var t;
    o && ((t = u.current) == null || t.setFPS(o));
  }, [o]), n(() => {
    var t, i, r;
    f === void 0 ? (t = u.current) == null || t.resume() : f ? (i = u.current) == null || i.resume() : (r = u.current) == null || r.pause();
  }, [f]), n(() => {
    var t;
    a && ((t = u.current) == null || t.setFlowSpeed(a));
  }, [a]), n(() => {
    var t;
    d && ((t = u.current) == null || t.setRenderScale(d));
  }, [d]), n(() => {
    var t;
    if (u.current) {
      const i = u.current.getElement();
      i.style.width = "100%", i.style.height = "100%", (t = s.current) == null || t.appendChild(i);
    }
  }), C(
    L,
    () => ({
      wrapperEl: s.current,
      bgRender: u.current
    }),
    [s.current, u.current]
  ), /* @__PURE__ */ h("div", { ...p, ref: s });
}), H = v(
  ({
    disabled: m,
    alignAnchor: o,
    enableSpring: f,
    enableBlur: a,
    lyricLines: d,
    currentTime: p,
    linePosXSpringParams: L,
    linePosYSpringParams: u,
    lineScaleSpringParams: s,
    ...t
  }, i) => {
    var w, B;
    const r = y(), R = y(null);
    return n(() => (r.current = new A(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (!m) {
        let e = !1, c = -1;
        const E = (l) => {
          var F;
          e || (c === -1 && (c = l), (F = r.current) == null || F.update(l - c), c = l, requestAnimationFrame(E));
        };
        return requestAnimationFrame(E), () => {
          e = !0;
        };
      }
    }, [m]), n(() => {
      var e;
      r.current && ((e = R.current) == null || e.appendChild(r.current.getElement()));
    }, [R.current]), n(() => {
      var e;
      o && ((e = r.current) == null || e.setAlignAnchor(o));
    }, [o]), n(() => {
      var e, c;
      f ? (e = r.current) == null || e.setEnableSpring(f) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [f]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(a ?? !0);
    }, [a]), n(() => {
      var e, c, E, l;
      d ? ((e = r.current) == null || e.setLyricLines(d), (c = r.current) == null || c.update()) : ((E = r.current) == null || E.setLyricLines([]), (l = r.current) == null || l.update());
    }, [d]), n(() => {
      var e, c;
      p ? (e = r.current) == null || e.setCurrentTime(p) : (c = r.current) == null || c.setCurrentTime(0);
    }, [p]), n(() => {
      var e;
      L && ((e = r.current) == null || e.setLinePosXSpringParams(L));
    }, [L]), n(() => {
      var e;
      u && ((e = r.current) == null || e.setLinePosYSpringParams(u));
    }, [u]), n(() => {
      var e;
      s && ((e = r.current) == null || e.setLineScaleSpringParams(s));
    }, [s]), C(
      i,
      () => ({
        wrapperEl: R.current,
        lyricPlayer: r.current
      }),
      [R.current, r.current]
    ), /* @__PURE__ */ g(k, { children: [
      /* @__PURE__ */ h("div", { ...t, ref: R }),
      (w = r.current) != null && w.getBottomLineElement() && t.bottomLine ? j(
        t.bottomLine,
        (B = r.current) == null ? void 0 : B.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  G as BackgroundRender,
  H as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
