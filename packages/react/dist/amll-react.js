import { jsx as q, jsxs as $, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as T, PixiRenderer as z, LyricPlayer as C } from "@applemusic-like-lyrics/core";
import { forwardRef as H, useRef as k, useEffect as u, useImperativeHandle as P } from "react";
import { createPortal as D } from "react-dom";
const Q = H(
  ({
    albumImageUrl: v,
    fps: f,
    playing: o,
    flowSpeed: d,
    renderScale: m,
    staticMode: R,
    renderer: p,
    ...B
  }, h) => {
    const t = k(), a = k(null);
    return u(() => {
      var n, i, l, F, x, L, r, E;
      return t.current = T.new(
        p ?? z
      ), v && ((n = t.current) == null || n.setAlbumImage(v)), f && ((i = t.current) == null || i.setFPS(f)), o === void 0 ? (l = t.current) == null || l.resume() : o ? (F = t.current) == null || F.resume() : (x = t.current) == null || x.pause(), d && ((L = t.current) == null || L.setFlowSpeed(d)), (r = t.current) == null || r.setStaticMode(R ?? !1), m && ((E = t.current) == null || E.setRenderScale(m ?? 0.5)), () => {
        var A;
        (A = t.current) == null || A.dispose();
      };
    }, [p]), u(() => {
      var n;
      v && ((n = t.current) == null || n.setAlbumImage(v));
    }, [v]), u(() => {
      var n;
      f && ((n = t.current) == null || n.setFPS(f));
    }, [f]), u(() => {
      var n, i, l;
      o === void 0 ? (n = t.current) == null || n.resume() : o ? (i = t.current) == null || i.resume() : (l = t.current) == null || l.pause();
    }, [o]), u(() => {
      var n;
      d && ((n = t.current) == null || n.setFlowSpeed(d));
    }, [d]), u(() => {
      var n;
      (n = t.current) == null || n.setStaticMode(R ?? !1);
    }, [R]), u(() => {
      var n;
      m && ((n = t.current) == null || n.setRenderScale(m ?? 0.5));
    }, [m]), u(() => {
      var n;
      if (t.current) {
        const i = t.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (n = a.current) == null || n.appendChild(i);
      }
    }, [t.current]), P(
      h,
      () => ({
        wrapperEl: a.current,
        bgRender: t.current
      }),
      [a.current, t.current]
    ), /* @__PURE__ */ q("div", { ...B, ref: a });
  }
), V = H(
  ({
    disabled: v,
    alignAnchor: f,
    alignPosition: o,
    enableSpring: d,
    enableBlur: m,
    enableScale: R,
    hidePassedLines: p,
    lyricLines: B,
    currentTime: h,
    linePosXSpringParams: t,
    linePosYSpringParams: a,
    lineScaleSpringParams: n,
    bottomLine: i,
    onLyricLineClick: l,
    onLyricLineContextMenu: F,
    ...x
  }, L) => {
    var A, y;
    const r = k(), E = k(null);
    return u(() => (r.current = new C(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), u(() => {
      if (!v) {
        let e = !1, c = -1;
        const s = (w) => {
          var j;
          e || (c === -1 && (c = w), (j = r.current) == null || j.update(w - c), c = w, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [v]), u(() => {
      var e;
      r.current && ((e = E.current) == null || e.appendChild(r.current.getElement()));
    }, [E.current]), u(() => {
      var e;
      f !== void 0 && ((e = r.current) == null || e.setAlignAnchor(f));
    }, [f]), u(() => {
      var e;
      p !== void 0 && ((e = r.current) == null || e.setHidePassedLines(p));
    }, [p]), u(() => {
      var e;
      o !== void 0 && ((e = r.current) == null || e.setAlignPosition(o));
    }, [o]), u(() => {
      var e, c;
      d !== void 0 ? (e = r.current) == null || e.setEnableSpring(d) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [d]), u(() => {
      var e, c;
      R !== void 0 ? (e = r.current) == null || e.setEnableScale(R) : (c = r.current) == null || c.setEnableScale(!0);
    }, [R]), u(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(m ?? !0);
    }, [m]), u(() => {
      var e, c, s, w;
      B !== void 0 ? ((e = r.current) == null || e.setLyricLines(B), (c = r.current) == null || c.update()) : ((s = r.current) == null || s.setLyricLines([]), (w = r.current) == null || w.update());
    }, [B]), u(() => {
      var e, c;
      h !== void 0 ? (e = r.current) == null || e.setCurrentTime(h) : (c = r.current) == null || c.setCurrentTime(0);
    }, [h]), u(() => {
      var e;
      t !== void 0 && ((e = r.current) == null || e.setLinePosXSpringParams(t));
    }, [t]), u(() => {
      var e;
      a !== void 0 && ((e = r.current) == null || e.setLinePosYSpringParams(a));
    }, [a]), u(() => {
      var e;
      n !== void 0 && ((e = r.current) == null || e.setLineScaleSpringParams(n));
    }, [n]), u(() => {
      var e;
      if (l) {
        const c = (s) => l(s);
        return (e = r.current) == null || e.addEventListener("line-click", c), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", c);
        };
      }
    }, [l]), u(() => {
      var e;
      if (F) {
        const c = (s) => F(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", c), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            c
          );
        };
      }
    }, [F]), P(
      L,
      () => ({
        wrapperEl: E.current,
        lyricPlayer: r.current
      }),
      [E.current, r.current]
    ), /* @__PURE__ */ $(G, { children: [
      /* @__PURE__ */ q("div", { ...x, ref: E }),
      (A = r.current) != null && A.getBottomLineElement() && i ? D(
        i,
        (y = r.current) == null ? void 0 : y.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  Q as BackgroundRender,
  V as LyricPlayer
};
//# sourceMappingURL=amll-react.js.map
