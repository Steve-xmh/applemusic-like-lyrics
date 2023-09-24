import { jsx as A, jsxs as q, Fragment as $ } from "react/jsx-runtime";
import { BackgroundRender as G, LyricPlayer as H } from "@applemusic-like-lyrics/core";
import { forwardRef as k, useRef as B, useEffect as n, useImperativeHandle as x } from "react";
import { createPortal as P } from "react-dom";
const I = k(
  ({
    albumImageUrl: a,
    fps: d,
    playing: o,
    flowSpeed: l,
    renderScale: m,
    staticMode: p,
    ...v
  }, h) => {
    const c = B(), i = B(null);
    return n(() => (c.current = new G(), () => {
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
    }), x(
      h,
      () => ({
        wrapperEl: i.current,
        bgRender: c.current
      }),
      [i.current, c.current]
    ), /* @__PURE__ */ A("div", { ...v, ref: i });
  }
), J = k(
  ({
    disabled: a,
    alignAnchor: d,
    alignPosition: o,
    enableSpring: l,
    enableBlur: m,
    lyricLines: p,
    currentTime: v,
    linePosXSpringParams: h,
    linePosYSpringParams: c,
    lineScaleSpringParams: i,
    bottomLine: t,
    onLyricLineClick: f,
    onLyricLineContextMenu: E,
    ...g
  }, j) => {
    var F, y;
    const r = B(), w = B(null);
    return n(() => (r.current = new H(), () => {
      var e;
      (e = r.current) == null || e.dispose();
    }), []), n(() => {
      if (!a) {
        let e = !1, u = -1;
        const s = (R) => {
          var L;
          e || (u === -1 && (u = R), (L = r.current) == null || L.update(R - u), u = R, requestAnimationFrame(s));
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
      l ? (e = r.current) == null || e.setEnableSpring(l) : (u = r.current) == null || u.setEnableSpring(!0);
    }, [l]), n(() => {
      var e;
      (e = r.current) == null || e.setEnableBlur(m ?? !0);
    }, [m]), n(() => {
      var e, u, s, R;
      p ? ((e = r.current) == null || e.setLyricLines(p), (u = r.current) == null || u.update()) : ((s = r.current) == null || s.setLyricLines([]), (R = r.current) == null || R.update());
    }, [p]), n(() => {
      var e, u;
      v ? (e = r.current) == null || e.setCurrentTime(v) : (u = r.current) == null || u.setCurrentTime(0);
    }, [v]), n(() => {
      var e;
      h && ((e = r.current) == null || e.setLinePosXSpringParams(h));
    }, [h]), n(() => {
      var e;
      c && ((e = r.current) == null || e.setLinePosYSpringParams(c));
    }, [c]), n(() => {
      var e;
      i && ((e = r.current) == null || e.setLineScaleSpringParams(i));
    }, [i]), n(() => {
      var e;
      if (f) {
        const u = (s) => f(s);
        return (e = r.current) == null || e.addEventListener("line-click", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener("line-click", u);
        };
      }
    }, [f]), n(() => {
      var e;
      if (E) {
        const u = (s) => E(s);
        return (e = r.current) == null || e.addEventListener("line-contextmenu", u), () => {
          var s;
          return (s = r.current) == null ? void 0 : s.removeEventListener(
            "line-contextmenu",
            u
          );
        };
      }
    }, [E]), x(
      j,
      () => ({
        wrapperEl: w.current,
        lyricPlayer: r.current
      }),
      [w.current, r.current]
    ), /* @__PURE__ */ q($, { children: [
      /* @__PURE__ */ A("div", { ...g, ref: w }),
      (F = r.current) != null && F.getBottomLineElement() && t ? P(
        t,
        (y = r.current) == null ? void 0 : y.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  I as BackgroundRender,
  J as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
