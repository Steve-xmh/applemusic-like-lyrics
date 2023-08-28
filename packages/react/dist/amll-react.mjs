import { jsx as v, jsxs as k, Fragment as x } from "react/jsx-runtime";
import { BackgroundRender as A, LyricPlayer as j } from "@applemusic-like-lyrics/core";
import { forwardRef as C, useRef as w, useEffect as n, useImperativeHandle as g } from "react";
import { createPortal as q } from "react-dom";
const T = C(
  ({
    albumImageUrl: a,
    fps: i,
    playing: f,
    flowSpeed: l,
    renderScale: o,
    staticMode: m,
    ...R
  }, E) => {
    const u = w(), d = w(null);
    return n(() => (u.current = new A(), () => {
      var r;
      (r = u.current) == null || r.dispose();
    }), []), n(() => {
      var r;
      a && ((r = u.current) == null || r.setAlbumImage(a));
    }, [a]), n(() => {
      var r;
      i && ((r = u.current) == null || r.setFPS(i));
    }, [i]), n(() => {
      var r, s, t;
      f === void 0 ? (r = u.current) == null || r.resume() : f ? (s = u.current) == null || s.resume() : (t = u.current) == null || t.pause();
    }, [f]), n(() => {
      var r;
      l && ((r = u.current) == null || r.setFlowSpeed(l));
    }, [l]), n(() => {
      var r;
      (r = u.current) == null || r.setStaticMode(m);
    }, [m]), n(() => {
      var r;
      o && ((r = u.current) == null || r.setRenderScale(o));
    }, [o]), n(() => {
      var r;
      if (u.current) {
        const s = u.current.getElement();
        s.style.width = "100%", s.style.height = "100%", (r = d.current) == null || r.appendChild(s);
      }
    }), g(
      E,
      () => ({
        wrapperEl: d.current,
        bgRender: u.current
      }),
      [d.current, u.current]
    ), /* @__PURE__ */ v("div", { ...R, ref: d });
  }
), z = C(
  ({
    disabled: a,
    alignAnchor: i,
    enableSpring: f,
    enableBlur: l,
    lyricLines: o,
    currentTime: m,
    linePosXSpringParams: R,
    linePosYSpringParams: E,
    lineScaleSpringParams: u,
    bottomLine: d,
    ...r
  }, s) => {
    var B, F;
    const t = w(), y = w(null);
    return n(() => (t.current = new j(), () => {
      var e;
      (e = t.current) == null || e.dispose();
    }), []), n(() => {
      if (!a) {
        let e = !1, c = -1;
        const L = (p) => {
          var h;
          e || (c === -1 && (c = p), (h = t.current) == null || h.update(p - c), c = p, requestAnimationFrame(L));
        };
        return requestAnimationFrame(L), () => {
          e = !0;
        };
      }
    }, [a]), n(() => {
      var e;
      t.current && ((e = y.current) == null || e.appendChild(t.current.getElement()));
    }, [y.current]), n(() => {
      var e;
      i && ((e = t.current) == null || e.setAlignAnchor(i));
    }, [i]), n(() => {
      var e, c;
      f ? (e = t.current) == null || e.setEnableSpring(f) : (c = t.current) == null || c.setEnableSpring(!0);
    }, [f]), n(() => {
      var e;
      (e = t.current) == null || e.setEnableBlur(l ?? !0);
    }, [l]), n(() => {
      var e, c, L, p;
      o ? ((e = t.current) == null || e.setLyricLines(o), (c = t.current) == null || c.update()) : ((L = t.current) == null || L.setLyricLines([]), (p = t.current) == null || p.update());
    }, [o]), n(() => {
      var e, c;
      m ? (e = t.current) == null || e.setCurrentTime(m) : (c = t.current) == null || c.setCurrentTime(0);
    }, [m]), n(() => {
      var e;
      R && ((e = t.current) == null || e.setLinePosXSpringParams(R));
    }, [R]), n(() => {
      var e;
      E && ((e = t.current) == null || e.setLinePosYSpringParams(E));
    }, [E]), n(() => {
      var e;
      u && ((e = t.current) == null || e.setLineScaleSpringParams(u));
    }, [u]), g(
      s,
      () => ({
        wrapperEl: y.current,
        lyricPlayer: t.current
      }),
      [y.current, t.current]
    ), /* @__PURE__ */ k(x, { children: [
      /* @__PURE__ */ v("div", { ...r, ref: y }),
      (B = t.current) != null && B.getBottomLineElement() && d ? q(
        d,
        (F = t.current) == null ? void 0 : F.getBottomLineElement()
      ) : null
    ] });
  }
);
export {
  T as BackgroundRender,
  z as LyricPlayer
};
//# sourceMappingURL=amll-react.mjs.map
