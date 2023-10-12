import { jsx as k, jsxs as $, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as H, LyricPlayer as P } from "@applemusic-like-lyrics/core";
import { forwardRef as x, useRef as B, useEffect as n, useImperativeHandle as g } from "react";
import { createPortal as T } from "react-dom";
const J = x(
  ({
    albumImageUrl: a,
    fps: o,
    playing: f,
    flowSpeed: l,
    renderScale: m,
    staticMode: v,
    ...R
  }, h) => {
    const c = B(), d = B(null);
    return n(() => (c.current = new H(), () => {
      var t;
      (t = c.current) == null || t.dispose();
    }), []), n(() => {
      var t;
      a && ((t = c.current) == null || t.setAlbumImage(a));
    }, [a]), n(() => {
      var t;
      o && ((t = c.current) == null || t.setFPS(o));
    }, [o]), n(() => {
      var t, i, p;
      f === void 0 ? (t = c.current) == null || t.resume() : f ? (i = c.current) == null || i.resume() : (p = c.current) == null || p.pause();
    }, [f]), n(() => {
      var t;
      l && ((t = c.current) == null || t.setFlowSpeed(l));
    }, [l]), n(() => {
      var t;
      (t = c.current) == null || t.setStaticMode(v);
    }, [v]), n(() => {
      var t;
      m && ((t = c.current) == null || t.setRenderScale(m));
    }, [m]), n(() => {
      var t;
      if (c.current) {
        const i = c.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (t = d.current) == null || t.appendChild(i);
      }
    }), g(
      h,
      () => ({
        wrapperEl: d.current,
        bgRender: c.current
      }),
      [d.current, c.current]
    ), /* @__PURE__ */ k("div", { ...R, ref: d });
  }
), K = x(
  ({
    disabled: a,
    alignAnchor: o,
    alignPosition: f,
    enableSpring: l,
    enableBlur: m,
    enableScale: v,
    lyricLines: R,
    currentTime: h,
    linePosXSpringParams: c,
    linePosYSpringParams: d,
    lineScaleSpringParams: t,
    bottomLine: i,
    onLyricLineClick: p,
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
        const s = (E) => {
          var A;
          e || (u === -1 && (u = E), (A = r.current) == null || A.update(E - u), u = E, requestAnimationFrame(s));
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
      o !== void 0 && ((e = r.current) == null || e.setAlignAnchor(o));
    }, [o]), n(() => {
      var e;
      f !== void 0 && ((e = r.current) == null || e.setAlignPosition(f));
    }, [f]), n(() => {
      var e, u;
      l !== void 0 ? (e = r.current) == null || e.setEnableSpring(l) : (u = r.current) == null || u.setEnableSpring(!0);
    }, [l]), n(() => {
      var e, u;
      v !== void 0 ? (e = r.current) == null || e.setEnableScale(v) : (u = r.current) == null || u.setEnableScale(!0);
    }, [v]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(m ?? !0);
    }, [m]), n(() => {
      var e, u, s, E;
      R !== void 0 ? ((e = r.current) == null || e.setLyricLines(R), (u = r.current) == null || u.update()) : ((s = r.current) == null || s.setLyricLines([]), (E = r.current) == null || E.update());
    }, [R]), n(() => {
      var e, u;
      h !== void 0 ? (e = r.current) == null || e.setCurrentTime(h) : (u = r.current) == null || u.setCurrentTime(0);
    }, [h]), n(() => {
      var e;
      c !== void 0 && ((e = r.current) == null || e.setLinePosXSpringParams(c));
    }, [c]), n(() => {
      var e;
      d !== void 0 && ((e = r.current) == null || e.setLinePosYSpringParams(d));
    }, [d]), n(() => {
      var e;
      t !== void 0 && ((e = r.current) == null || e.setLineScaleSpringParams(t));
    }, [t]), n(() => {
      var e;
      if (p) {
        const u = (s) => p(s);
        return (e = r.current) == null || e.addEventListener("line-click", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", u);
        };
      }
    }, [p]), n(() => {
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
      (y = r.current) != null && y.getBottomLineElement() && i ? T(
        i,
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
