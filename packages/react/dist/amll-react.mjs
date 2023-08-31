import { jsx as A, jsxs as x, Fragment as g } from "react/jsx-runtime";
import { BackgroundRender as j, LyricPlayer as q } from "@applemusic-like-lyrics/core";
import { forwardRef as C, useRef as B, useEffect as n, useImperativeHandle as k } from "react";
import { createPortal as $ } from "react-dom";
const z = C(
  ({
    albumImageUrl: l,
    fps: i,
    playing: o,
    flowSpeed: d,
    renderScale: a,
    staticMode: m,
    ...R
  }, E) => {
    const u = B(), s = B(null);
    return n(() => (u.current = new j(), () => {
      var r;
      (r = u.current) == null || r.dispose();
    }), []), n(() => {
      var r;
      l && ((r = u.current) == null || r.setAlbumImage(l));
    }, [l]), n(() => {
      var r;
      i && ((r = u.current) == null || r.setFPS(i));
    }, [i]), n(() => {
      var r, f, w;
      o === void 0 ? (r = u.current) == null || r.resume() : o ? (f = u.current) == null || f.resume() : (w = u.current) == null || w.pause();
    }, [o]), n(() => {
      var r;
      d && ((r = u.current) == null || r.setFlowSpeed(d));
    }, [d]), n(() => {
      var r;
      (r = u.current) == null || r.setStaticMode(m);
    }, [m]), n(() => {
      var r;
      a && ((r = u.current) == null || r.setRenderScale(a));
    }, [a]), n(() => {
      var r;
      if (u.current) {
        const f = u.current.getElement();
        f.style.width = "100%", f.style.height = "100%", (r = s.current) == null || r.appendChild(f);
      }
    }), k(
      E,
      () => ({
        wrapperEl: s.current,
        bgRender: u.current
      }),
      [s.current, u.current]
    ), /* @__PURE__ */ A("div", { ...R, ref: s });
  }
), D = C(
  ({
    disabled: l,
    alignAnchor: i,
    alignPosition: o,
    enableSpring: d,
    enableBlur: a,
    lyricLines: m,
    currentTime: R,
    linePosXSpringParams: E,
    linePosYSpringParams: u,
    lineScaleSpringParams: s,
    bottomLine: r,
    ...f
  }, w) => {
    var F, h;
    const t = B(), y = B(null);
    return n(() => (t.current = new q(), () => {
      var e;
      (e = t.current) == null || e.dispose();
    }), []), n(() => {
      if (!l) {
        let e = !1, c = -1;
        const L = (p) => {
          var v;
          e || (c === -1 && (c = p), (v = t.current) == null || v.update(p - c), c = p, requestAnimationFrame(L));
        };
        return requestAnimationFrame(L), () => {
          e = !0;
        };
      }
    }, [l]), n(() => {
      var e;
      t.current && ((e = y.current) == null || e.appendChild(t.current.getElement()));
    }, [y.current]), n(() => {
      var e;
      i && ((e = t.current) == null || e.setAlignAnchor(i));
    }, [i]), n(() => {
      var e;
      o && ((e = t.current) == null || e.setAlignPosition(o));
    }, [o]), n(() => {
      var e, c;
      d ? (e = t.current) == null || e.setEnableSpring(d) : (c = t.current) == null || c.setEnableSpring(!0);
    }, [d]), n(() => {
      var e;
      (e = t.current) == null || e.setEnableBlur(a ?? !0);
    }, [a]), n(() => {
      var e, c, L, p;
      m ? ((e = t.current) == null || e.setLyricLines(m), (c = t.current) == null || c.update()) : ((L = t.current) == null || L.setLyricLines([]), (p = t.current) == null || p.update());
    }, [m]), n(() => {
      var e, c;
      R ? (e = t.current) == null || e.setCurrentTime(R) : (c = t.current) == null || c.setCurrentTime(0);
    }, [R]), n(() => {
      var e;
      E && ((e = t.current) == null || e.setLinePosXSpringParams(E));
    }, [E]), n(() => {
      var e;
      u && ((e = t.current) == null || e.setLinePosYSpringParams(u));
    }, [u]), n(() => {
      var e;
      s && ((e = t.current) == null || e.setLineScaleSpringParams(s));
    }, [s]), k(
      w,
      () => ({
        wrapperEl: y.current,
        lyricPlayer: t.current
      }),
      [y.current, t.current]
    ), /* @__PURE__ */ x(g, { children: [
      /* @__PURE__ */ A("div", { ...f, ref: y }),
      (F = t.current) != null && F.getBottomLineElement() && r ? $(
        r,
        (h = t.current) == null ? void 0 : h.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  z as BackgroundRender,
  D as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
