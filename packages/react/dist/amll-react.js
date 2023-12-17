import { jsx as H, jsxs as q, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as T, PixiRenderer as z, LyricPlayer as C } from "@applemusic-like-lyrics/core";
import { forwardRef as P, useRef as y, useEffect as u, useImperativeHandle as $ } from "react";
import { createPortal as D } from "react-dom";
const Q = P(
  ({
    albumImageUrl: m,
    fps: f,
    playing: d,
    flowSpeed: o,
    renderScale: l,
    staticMode: R,
    lowFreqVolume: p,
    renderer: F,
    ...h
  }, w) => {
    const n = y(), a = y(null);
    return u(() => {
      var t, i, v, x, k, r, E, A;
      return n.current = T.new(
        F ?? z
      ), m && ((t = n.current) == null || t.setAlbumImage(m)), f && ((i = n.current) == null || i.setFPS(f)), d === void 0 ? (v = n.current) == null || v.resume() : d ? (x = n.current) == null || x.resume() : (k = n.current) == null || k.pause(), o && ((r = n.current) == null || r.setFlowSpeed(o)), (E = n.current) == null || E.setStaticMode(R ?? !1), l && ((A = n.current) == null || A.setRenderScale(l ?? 0.5)), () => {
        var L;
        (L = n.current) == null || L.dispose();
      };
    }, [F]), u(() => {
      var t;
      m && ((t = n.current) == null || t.setAlbumImage(m));
    }, [m]), u(() => {
      var t;
      f && ((t = n.current) == null || t.setFPS(f));
    }, [f]), u(() => {
      var t, i, v;
      d === void 0 ? (t = n.current) == null || t.resume() : d ? (i = n.current) == null || i.resume() : (v = n.current) == null || v.pause();
    }, [d]), u(() => {
      var t;
      o && ((t = n.current) == null || t.setFlowSpeed(o));
    }, [o]), u(() => {
      var t;
      (t = n.current) == null || t.setStaticMode(R ?? !1);
    }, [R]), u(() => {
      var t;
      l && ((t = n.current) == null || t.setRenderScale(l ?? 0.5));
    }, [l]), u(() => {
      var t;
      p && ((t = n.current) == null || t.setLowFreqVolume(p ?? 1));
    }, [p]), u(() => {
      var t;
      if (n.current) {
        const i = n.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (t = a.current) == null || t.appendChild(i);
      }
    }, [n.current]), $(
      w,
      () => ({
        wrapperEl: a.current,
        bgRender: n.current
      }),
      [a.current, n.current]
    ), /* @__PURE__ */ H("div", { ...h, ref: a });
  }
), W = P(
  ({
    disabled: m,
    alignAnchor: f,
    alignPosition: d,
    enableSpring: o,
    enableBlur: l,
    enableScale: R,
    hidePassedLines: p,
    lyricLines: F,
    currentTime: h,
    linePosXSpringParams: w,
    linePosYSpringParams: n,
    lineScaleSpringParams: a,
    bottomLine: t,
    onLyricLineClick: i,
    onLyricLineContextMenu: v,
    ...x
  }, k) => {
    var A, L;
    const r = y(), E = y(null);
    return u(() => (r.current = new C(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), u(() => {
      if (!m) {
        let e = !1, c = -1;
        const s = (B) => {
          var j;
          e || (c === -1 && (c = B), (j = r.current) == null || j.update(B - c), c = B, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [m]), u(() => {
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
      d !== void 0 && ((e = r.current) == null || e.setAlignPosition(d));
    }, [d]), u(() => {
      var e, c;
      o !== void 0 ? (e = r.current) == null || e.setEnableSpring(o) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [o]), u(() => {
      var e, c;
      R !== void 0 ? (e = r.current) == null || e.setEnableScale(R) : (c = r.current) == null || c.setEnableScale(!0);
    }, [R]), u(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(l ?? !0);
    }, [l]), u(() => {
      var e, c, s, B;
      F !== void 0 ? ((e = r.current) == null || e.setLyricLines(F), (c = r.current) == null || c.update()) : ((s = r.current) == null || s.setLyricLines([]), (B = r.current) == null || B.update());
    }, [F]), u(() => {
      var e, c;
      h !== void 0 ? (e = r.current) == null || e.setCurrentTime(h) : (c = r.current) == null || c.setCurrentTime(0);
    }, [h]), u(() => {
      var e;
      w !== void 0 && ((e = r.current) == null || e.setLinePosXSpringParams(w));
    }, [w]), u(() => {
      var e;
      n !== void 0 && ((e = r.current) == null || e.setLinePosYSpringParams(n));
    }, [n]), u(() => {
      var e;
      a !== void 0 && ((e = r.current) == null || e.setLineScaleSpringParams(a));
    }, [a]), u(() => {
      var e;
      if (i) {
        const c = (s) => i(s);
        return (e = r.current) == null || e.addEventListener("line-click", c), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", c);
        };
      }
    }, [i]), u(() => {
      var e;
      if (v) {
        const c = (s) => v(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", c), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            c
          );
        };
      }
    }, [v]), $(
      k,
      () => ({
        wrapperEl: E.current,
        lyricPlayer: r.current
      }),
      [E.current, r.current]
    ), /* @__PURE__ */ q(G, { children: [
      /* @__PURE__ */ H("div", { ...x, ref: E }),
      (A = r.current) != null && A.getBottomLineElement() && t ? D(
        t,
        (L = r.current) == null ? void 0 : L.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  Q as BackgroundRender,
  W as LyricPlayer
};
//# sourceMappingURL=amll-react.js.map
