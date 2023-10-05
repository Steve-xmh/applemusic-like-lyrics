import { jsx as k, jsxs as $, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as H, LyricPlayer as P } from "@applemusic-like-lyrics/core";
import { forwardRef as x, useRef as B, useEffect as n, useImperativeHandle as g } from "react";
import { createPortal as T } from "react-dom";
const J = x(
  ({
    albumImageUrl: a,
    fps: d,
    playing: o,
    flowSpeed: l,
    renderScale: m,
    staticMode: p,
    ...R
  }, h) => {
    const c = B(), i = B(null);
    return n(() => (c.current = new H(), () => {
      var t;
      (t = c.current) == null || t.dispose();
    }), []), n(() => {
      var t;
      a && ((t = c.current) == null || t.setAlbumImage(a));
    }, [a]), n(() => {
      var t;
      d && ((t = c.current) == null || t.setFPS(d));
    }, [d]), n(() => {
      var t, f, E;
      o === void 0 ? (t = c.current) == null || t.resume() : o ? (f = c.current) == null || f.resume() : (E = c.current) == null || E.pause();
    }, [o]), n(() => {
      var t;
      l && ((t = c.current) == null || t.setFlowSpeed(l));
    }, [l]), n(() => {
      var t;
      (t = c.current) == null || t.setStaticMode(p);
    }, [p]), n(() => {
      var t;
      m && ((t = c.current) == null || t.setRenderScale(m));
    }, [m]), n(() => {
      var t;
      if (c.current) {
        const f = c.current.getElement();
        f.style.width = "100%", f.style.height = "100%", (t = i.current) == null || t.appendChild(f);
      }
    }), g(
      h,
      () => ({
        wrapperEl: i.current,
        bgRender: c.current
      }),
      [i.current, c.current]
    ), /* @__PURE__ */ k("div", { ...R, ref: i });
  }
), K = x(
  ({
    disabled: a,
    alignAnchor: d,
    alignPosition: o,
    enableSpring: l,
    enableBlur: m,
    enableScale: p,
    lyricLines: R,
    currentTime: h,
    linePosXSpringParams: c,
    linePosYSpringParams: i,
    lineScaleSpringParams: t,
    bottomLine: f,
    onLyricLineClick: E,
    onLyricLineContextMenu: F,
    ...j
  }, q) => {
    var y, L;
    const r = B(), w = B(null);
    return n(() => (r.current = new P(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (!a) {
        let e = !1, u = -1;
        const s = (v) => {
          var A;
          e || (u === -1 && (u = v), (A = r.current) == null || A.update(v - u), u = v, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [a]), n(() => {
      var e;
      r.current && ((e = w.current) == null || e.appendChild(r.current.getElement()));
    }, [w.current]), n(() => {
      var e;
      d && ((e = r.current) == null || e.setAlignAnchor(d));
    }, [d]), n(() => {
      var e;
      o && ((e = r.current) == null || e.setAlignPosition(o));
    }, [o]), n(() => {
      var e, u;
      l !== void 0 ? (e = r.current) == null || e.setEnableSpring(l) : (u = r.current) == null || u.setEnableSpring(!0);
    }, [l]), n(() => {
      var e, u;
      p !== void 0 ? (e = r.current) == null || e.setEnableScale(p) : (u = r.current) == null || u.setEnableScale(!0);
    }, [p]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(m ?? !0);
    }, [m]), n(() => {
      var e, u, s, v;
      R ? ((e = r.current) == null || e.setLyricLines(R), (u = r.current) == null || u.update()) : ((s = r.current) == null || s.setLyricLines([]), (v = r.current) == null || v.update());
    }, [R]), n(() => {
      var e, u;
      h ? (e = r.current) == null || e.setCurrentTime(h) : (u = r.current) == null || u.setCurrentTime(0);
    }, [h]), n(() => {
      var e;
      c && ((e = r.current) == null || e.setLinePosXSpringParams(c));
    }, [c]), n(() => {
      var e;
      i && ((e = r.current) == null || e.setLinePosYSpringParams(i));
    }, [i]), n(() => {
      var e;
      t && ((e = r.current) == null || e.setLineScaleSpringParams(t));
    }, [t]), n(() => {
      var e;
      if (E) {
        const u = (s) => E(s);
        return (e = r.current) == null || e.addEventListener("line-click", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", u);
        };
      }
    }, [E]), n(() => {
      var e;
      if (F) {
        const u = (s) => F(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            u
          );
        };
      }
    }, [F]), g(
      q,
      () => ({
        wrapperEl: w.current,
        lyricPlayer: r.current
      }),
      [w.current, r.current]
    ), /* @__PURE__ */ $(G, { children: [
      /* @__PURE__ */ k("div", { ...j, ref: w }),
      (y = r.current) != null && y.getBottomLineElement() && f ? T(
        f,
        (L = r.current) == null ? void 0 : L.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  J as BackgroundRender,
  K as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
