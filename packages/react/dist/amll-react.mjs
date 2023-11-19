import { jsx as x, jsxs as $, Fragment as G } from "react/jsx-runtime";
import { BackgroundRender as T, LyricPlayer as z } from "@applemusic-like-lyrics/core";
import { forwardRef as g, useRef as F, useEffect as n, useImperativeHandle as j } from "react";
import { createPortal as C } from "react-dom";
const N = g(
  ({
    albumImageUrl: m,
    fps: d,
    playing: f,
    flowSpeed: l,
    renderScale: v,
    staticMode: a,
    ...E
  }, R) => {
    const c = F(), o = F(null);
    return n(() => (c.current = new T(), () => {
      var t;
      (t = c.current) == null || t.dispose();
    }), []), n(() => {
      var t;
      m && ((t = c.current) == null || t.setAlbumImage(m));
    }, [m]), n(() => {
      var t;
      d && ((t = c.current) == null || t.setFPS(d));
    }, [d]), n(() => {
      var t, i, w;
      f === void 0 ? (t = c.current) == null || t.resume() : f ? (i = c.current) == null || i.resume() : (w = c.current) == null || w.pause();
    }, [f]), n(() => {
      var t;
      l && ((t = c.current) == null || t.setFlowSpeed(l));
    }, [l]), n(() => {
      var t;
      (t = c.current) == null || t.setStaticMode(a);
    }, [a]), n(() => {
      var t;
      v && ((t = c.current) == null || t.setRenderScale(v));
    }, [v]), n(() => {
      var t;
      if (c.current) {
        const i = c.current.getElement();
        i.style.width = "100%", i.style.height = "100%", (t = o.current) == null || t.appendChild(i);
      }
    }), j(
      R,
      () => ({
        wrapperEl: o.current,
        bgRender: c.current
      }),
      [o.current, c.current]
    ), /* @__PURE__ */ x("div", { ...E, ref: o });
  }
), O = g(
  ({
    disabled: m,
    alignAnchor: d,
    alignPosition: f,
    enableSpring: l,
    enableBlur: v,
    enableScale: a,
    hidePassedLines: E,
    lyricLines: R,
    currentTime: c,
    linePosXSpringParams: o,
    linePosYSpringParams: t,
    lineScaleSpringParams: i,
    bottomLine: w,
    onLyricLineClick: h,
    onLyricLineContextMenu: y,
    ...q
  }, H) => {
    var A, L;
    const r = F(), B = F(null);
    return n(() => (r.current = new z(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (!m) {
        let e = !1, u = -1;
        const s = (p) => {
          var k;
          e || (u === -1 && (u = p), (k = r.current) == null || k.update(p - u), u = p, requestAnimationFrame(s));
        };
        return requestAnimationFrame(s), () => {
          e = !0;
        };
      }
    }, [m]), n(() => {
      var e;
      r.current && ((e = B.current) == null || e.appendChild(r.current.getElement()));
    }, [B.current]), n(() => {
      var e;
      d !== void 0 && ((e = r.current) == null || e.setAlignAnchor(d));
    }, [d]), n(() => {
      var e;
      E !== void 0 && ((e = r.current) == null || e.setHidePassedLines(E));
    }, [E]), n(() => {
      var e;
      f !== void 0 && ((e = r.current) == null || e.setAlignPosition(f));
    }, [f]), n(() => {
      var e, u;
      l !== void 0 ? (e = r.current) == null || e.setEnableSpring(l) : (u = r.current) == null || u.setEnableSpring(!0);
    }, [l]), n(() => {
      var e, u;
      a !== void 0 ? (e = r.current) == null || e.setEnableScale(a) : (u = r.current) == null || u.setEnableScale(!0);
    }, [a]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(v ?? !0);
    }, [v]), n(() => {
      var e, u, s, p;
      R !== void 0 ? ((e = r.current) == null || e.setLyricLines(R), (u = r.current) == null || u.update()) : ((s = r.current) == null || s.setLyricLines([]), (p = r.current) == null || p.update());
    }, [R]), n(() => {
      var e, u;
      c !== void 0 ? (e = r.current) == null || e.setCurrentTime(c) : (u = r.current) == null || u.setCurrentTime(0);
    }, [c]), n(() => {
      var e;
      o !== void 0 && ((e = r.current) == null || e.setLinePosXSpringParams(o));
    }, [o]), n(() => {
      var e;
      t !== void 0 && ((e = r.current) == null || e.setLinePosYSpringParams(t));
    }, [t]), n(() => {
      var e;
      i !== void 0 && ((e = r.current) == null || e.setLineScaleSpringParams(i));
    }, [i]), n(() => {
      var e;
      if (h) {
        const u = (s) => h(s);
        return (e = r.current) == null || e.addEventListener("line-click", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", u);
        };
      }
    }, [h]), n(() => {
      var e;
      if (y) {
        const u = (s) => y(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            u
          );
        };
      }
    }, [y]), j(
      H,
      () => ({
        wrapperEl: B.current,
        lyricPlayer: r.current
      }),
      [B.current, r.current]
    ), /* @__PURE__ */ $(G, { children: [
      /* @__PURE__ */ x("div", { ...q, ref: B }),
      (A = r.current) != null && A.getBottomLineElement() && w ? C(
        w,
        (L = r.current) == null ? void 0 : L.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  N as BackgroundRender,
  O as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
