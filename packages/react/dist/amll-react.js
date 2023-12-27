import { jsx as $, jsxs as T, Fragment as y } from "react/jsx-runtime";
import { BackgroundRender as z, PixiRenderer as C, LyricPlayer as D } from "@applemusic-like-lyrics/core";
import { forwardRef as q, useRef as j, useEffect as u, useImperativeHandle as G } from "react";
import { createPortal as J } from "react-dom";
const W = q(
  ({
    albumImageUrl: l,
    fps: f,
    playing: d,
    flowSpeed: o,
    renderScale: v,
    staticMode: F,
    lowFreqVolume: R,
    hasLyric: p,
    renderer: B,
    ...A
  }, x) => {
    const n = j(), E = j(null);
    return u(() => {
      var t, i, m, k, H, r, a, L;
      return n.current = z.new(
        B ?? C
      ), l && ((t = n.current) == null || t.setAlbumImage(l)), f && ((i = n.current) == null || i.setFPS(f)), d === void 0 ? (m = n.current) == null || m.resume() : d ? (k = n.current) == null || k.resume() : (H = n.current) == null || H.pause(), o && ((r = n.current) == null || r.setFlowSpeed(o)), (a = n.current) == null || a.setStaticMode(F ?? !1), v && ((L = n.current) == null || L.setRenderScale(v ?? 0.5)), () => {
        var h;
        (h = n.current) == null || h.dispose();
      };
    }, [B]), u(() => {
      var t;
      l && ((t = n.current) == null || t.setAlbumImage(l));
    }, [l]), u(() => {
      var t;
      f && ((t = n.current) == null || t.setFPS(f));
    }, [f]), u(() => {
      var t, i, m;
      d === void 0 ? (t = n.current) == null || t.resume() : d ? (i = n.current) == null || i.resume() : (m = n.current) == null || m.pause();
    }, [d]), u(() => {
      var t;
      o && ((t = n.current) == null || t.setFlowSpeed(o));
    }, [o]), u(() => {
      var t;
      (t = n.current) == null || t.setStaticMode(F ?? !1);
    }, [F]), u(() => {
      var t;
      v && ((t = n.current) == null || t.setRenderScale(v ?? 0.5));
    }, [v]), u(() => {
      var t;
      R && ((t = n.current) == null || t.setLowFreqVolume(R ?? 1));
    }, [R]), u(() => {
      var t;
      p !== void 0 && ((t = n.current) == null || t.setHasLyric(p ?? !0));
    }, [p]), u(() => {
      var t;
      if (n.current) {
        const i = n.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (t = E.current) == null || t.appendChild(i);
      }
    }, [n.current]), G(
      x,
      () => ({
        wrapperEl: E.current,
        bgRender: n.current
      }),
      [E.current, n.current]
    ), /* @__PURE__ */ $("div", { ...A, ref: E });
  }
), Z = q(
  ({
    disabled: l,
    playing: f,
    alignAnchor: d,
    alignPosition: o,
    enableSpring: v,
    enableBlur: F,
    enableScale: R,
    hidePassedLines: p,
    lyricLines: B,
    currentTime: A,
    linePosXSpringParams: x,
    linePosYSpringParams: n,
    lineScaleSpringParams: E,
    bottomLine: t,
    onLyricLineClick: i,
    onLyricLineContextMenu: m,
    ...k
  }, H) => {
    var L, h;
    const r = j(), a = j(null);
    return u(() => (r.current = new D(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), u(() => {
      if (!l) {
        let e = !1, c = -1;
        const s = (w) => {
          var P;
          e || (c === -1 && (c = w), (P = r.current) == null || P.update(w - c), c = w, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [l]), u(() => {
      var e, c, s;
      f !== void 0 ? f ? (e = r.current) == null || e.resume() : (c = r.current) == null || c.pause() : (s = r.current) == null || s.resume();
    }, [f]), u(() => {
      var e;
      r.current && ((e = a.current) == null || e.appendChild(r.current.getElement()));
    }, [a.current]), u(() => {
      var e;
      d !== void 0 && ((e = r.current) == null || e.setAlignAnchor(d));
    }, [d]), u(() => {
      var e;
      p !== void 0 && ((e = r.current) == null || e.setHidePassedLines(p));
    }, [p]), u(() => {
      var e;
      o !== void 0 && ((e = r.current) == null || e.setAlignPosition(o));
    }, [o]), u(() => {
      var e, c;
      v !== void 0 ? (e = r.current) == null || e.setEnableSpring(v) : (c = r.current) == null || c.setEnableSpring(!0);
    }, [v]), u(() => {
      var e, c;
      R !== void 0 ? (e = r.current) == null || e.setEnableScale(R) : (c = r.current) == null || c.setEnableScale(!0);
    }, [R]), u(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(F ?? !0);
    }, [F]), u(() => {
      var e, c, s, w;
      B !== void 0 ? ((e = r.current) == null || e.setLyricLines(B), (c = r.current) == null || c.update()) : ((s = r.current) == null || s.setLyricLines([]), (w = r.current) == null || w.update());
    }, [B]), u(() => {
      var e, c;
      A !== void 0 ? (e = r.current) == null || e.setCurrentTime(A) : (c = r.current) == null || c.setCurrentTime(0);
    }, [A]), u(() => {
      var e;
      x !== void 0 && ((e = r.current) == null || e.setLinePosXSpringParams(x));
    }, [x]), u(() => {
      var e;
      n !== void 0 && ((e = r.current) == null || e.setLinePosYSpringParams(n));
    }, [n]), u(() => {
      var e;
      E !== void 0 && ((e = r.current) == null || e.setLineScaleSpringParams(E));
    }, [E]), u(() => {
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
      if (m) {
        const c = (s) => m(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", c), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            c
          );
        };
      }
    }, [m]), G(
      H,
      () => ({
        wrapperEl: a.current,
        lyricPlayer: r.current
      }),
      [a.current, r.current]
    ), /* @__PURE__ */ T(y, { children: [
      /* @__PURE__ */ $("div", { ...k, ref: a }),
      (L = r.current) != null && L.getBottomLineElement() && t ? J(
        t,
        (h = r.current) == null ? void 0 : h.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  W as BackgroundRender,
  Z as LyricPlayer
};
//# sourceMappingURL=amll-react.js.map
