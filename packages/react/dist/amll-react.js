import { jsx as y, jsxs as q, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as T, PixiRenderer as z, LyricPlayer as C } from "@applemusic-like-lyrics/core";
import { forwardRef as P, useRef as H, useEffect as u, useImperativeHandle as $ } from "react";
import { createPortal as D } from "react-dom";
const Q = P(
  ({
    albumImageUrl: v,
    fps: f,
    playing: d,
    flowSpeed: o,
    renderScale: m,
    staticMode: E,
    lowFreqVolume: a,
    hasLyric: R,
    renderer: B,
    ...A
  }, x) => {
    const n = H(), p = H(null);
    return u(() => {
      var r, i, F, k, t, l, L, h;
      return n.current = T.new(
        B ?? z
      ), v && ((r = n.current) == null || r.setAlbumImage(v)), f && ((i = n.current) == null || i.setFPS(f)), d === void 0 ? (F = n.current) == null || F.resume() : d ? (k = n.current) == null || k.resume() : (t = n.current) == null || t.pause(), o && ((l = n.current) == null || l.setFlowSpeed(o)), (L = n.current) == null || L.setStaticMode(E ?? !1), m && ((h = n.current) == null || h.setRenderScale(m ?? 0.5)), () => {
        var e;
        (e = n.current) == null || e.dispose();
      };
    }, [B]), u(() => {
      var r;
      v && ((r = n.current) == null || r.setAlbumImage(v));
    }, [v]), u(() => {
      var r;
      f && ((r = n.current) == null || r.setFPS(f));
    }, [f]), u(() => {
      var r, i, F;
      d === void 0 ? (r = n.current) == null || r.resume() : d ? (i = n.current) == null || i.resume() : (F = n.current) == null || F.pause();
    }, [d]), u(() => {
      var r;
      o && ((r = n.current) == null || r.setFlowSpeed(o));
    }, [o]), u(() => {
      var r;
      (r = n.current) == null || r.setStaticMode(E ?? !1);
    }, [E]), u(() => {
      var r;
      m && ((r = n.current) == null || r.setRenderScale(m ?? 0.5));
    }, [m]), u(() => {
      var r;
      a && ((r = n.current) == null || r.setLowFreqVolume(a ?? 1));
    }, [a]), u(() => {
      var r;
      R !== void 0 && ((r = n.current) == null || r.setHasLyric(R ?? !0));
    }, [R]), u(() => {
      var r;
      if (n.current) {
        const i = n.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (r = p.current) == null || r.appendChild(i);
      }
    }, [n.current]), $(
      x,
      () => ({
        wrapperEl: p.current,
        bgRender: n.current
      }),
      [p.current, n.current]
    ), /* @__PURE__ */ y("div", { ...A, ref: p });
  }
), W = P(
  ({
    disabled: v,
    alignAnchor: f,
    alignPosition: d,
    enableSpring: o,
    enableBlur: m,
    enableScale: E,
    hidePassedLines: a,
    lyricLines: R,
    currentTime: B,
    linePosXSpringParams: A,
    linePosYSpringParams: x,
    lineScaleSpringParams: n,
    bottomLine: p,
    onLyricLineClick: r,
    onLyricLineContextMenu: i,
    ...F
  }, k) => {
    var L, h;
    const t = H(), l = H(null);
    return u(() => (t.current = new C(), () => {
      var e;
      (e = t.current) == null || e.dispose();
    }), []), u(() => {
      if (!v) {
        let e = !1, c = -1;
        const s = (w) => {
          var j;
          e || (c === -1 && (c = w), (j = t.current) == null || j.update(w - c), c = w, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [v]), u(() => {
      var e;
      t.current && ((e = l.current) == null || e.appendChild(t.current.getElement()));
    }, [l.current]), u(() => {
      var e;
      f !== void 0 && ((e = t.current) == null || e.setAlignAnchor(f));
    }, [f]), u(() => {
      var e;
      a !== void 0 && ((e = t.current) == null || e.setHidePassedLines(a));
    }, [a]), u(() => {
      var e;
      d !== void 0 && ((e = t.current) == null || e.setAlignPosition(d));
    }, [d]), u(() => {
      var e, c;
      o !== void 0 ? (e = t.current) == null || e.setEnableSpring(o) : (c = t.current) == null || c.setEnableSpring(!0);
    }, [o]), u(() => {
      var e, c;
      E !== void 0 ? (e = t.current) == null || e.setEnableScale(E) : (c = t.current) == null || c.setEnableScale(!0);
    }, [E]), u(() => {
      var e;
      (e = t.current) == null || e.setEnableBlur(m ?? !0);
    }, [m]), u(() => {
      var e, c, s, w;
      R !== void 0 ? ((e = t.current) == null || e.setLyricLines(R), (c = t.current) == null || c.update()) : ((s = t.current) == null || s.setLyricLines([]), (w = t.current) == null || w.update());
    }, [R]), u(() => {
      var e, c;
      B !== void 0 ? (e = t.current) == null || e.setCurrentTime(B) : (c = t.current) == null || c.setCurrentTime(0);
    }, [B]), u(() => {
      var e;
      A !== void 0 && ((e = t.current) == null || e.setLinePosXSpringParams(A));
    }, [A]), u(() => {
      var e;
      x !== void 0 && ((e = t.current) == null || e.setLinePosYSpringParams(x));
    }, [x]), u(() => {
      var e;
      n !== void 0 && ((e = t.current) == null || e.setLineScaleSpringParams(n));
    }, [n]), u(() => {
      var e;
      if (r) {
        const c = (s) => r(s);
        return (e = t.current) == null || e.addEventListener("line-click", c), () => {
          var s;
          return (s = t.current) == null ? void 0 : s.removeEventListener("line-click", c);
        };
      }
    }, [r]), u(() => {
      var e;
      if (i) {
        const c = (s) => i(s);
        return (e = t.current) == null || e.addEventListener("line-contextmenu", c), () => {
          var s;
          return (s = t.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            c
          );
        };
      }
    }, [i]), $(
      k,
      () => ({
        wrapperEl: l.current,
        lyricPlayer: t.current
      }),
      [l.current, t.current]
    ), /* @__PURE__ */ q(G, { children: [
      /* @__PURE__ */ y("div", { ...F, ref: l }),
      (L = t.current) != null && L.getBottomLineElement() && p ? D(
        p,
        (h = t.current) == null ? void 0 : h.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  Q as BackgroundRender,
  W as LyricPlayer
};
//# sourceMappingURL=amll-react.js.map
