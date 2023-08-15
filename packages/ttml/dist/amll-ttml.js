const O = /^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function D(m) {
  var f, p, u;
  const s = O.exec(m);
  if (s) {
    const e = Number(((f = s.groups) == null ? void 0 : f.hour) || "0"), t = Number(((p = s.groups) == null ? void 0 : p.min) || "0"), T = Number(((u = s.groups) == null ? void 0 : u.sec.replace(/:/, ".")) || "0");
    return Math.floor((e * 3600 + t * 60 + T) * 1e3);
  } else
    throw new TypeError("时间戳字符串解析失败");
}
function X(m) {
  const f = new DOMParser().parseFromString(
    m,
    "application/xml"
  );
  let p = "v1";
  for (const e of f.querySelectorAll("ttm\\:agent"))
    if (e.getAttribute("type") === "person") {
      const t = e.getAttribute("xml:id");
      t && (p = t);
    }
  const u = [];
  for (const e of f.querySelectorAll("body p[begin][end]")) {
    const t = {
      words: [],
      startTime: D(e.getAttribute("begin") ?? "0:0"),
      endTime: D(e.getAttribute("end") ?? "0:0"),
      translatedLyric: "",
      romanLyric: "",
      isBG: !1,
      isDuet: e.getAttribute("ttm:agent") !== p
    };
    let T = null;
    for (const x of e.childNodes)
      if (x.nodeType === Node.TEXT_NODE) {
        const i = x.textContent ?? "";
        /^(\s+)$/.test(i) ? t.words.push({
          word: " ",
          startTime: 0,
          endTime: 0
        }) : t.words.push({
          word: i,
          startTime: 0,
          endTime: 0
        });
      } else if (x.nodeType === Node.ELEMENT_NODE) {
        const i = x, A = i.getAttribute("ttm:role");
        if (i.nodeName === "span" && A)
          if (A === "x-bg") {
            const d = {
              words: [],
              startTime: t.startTime,
              endTime: t.endTime,
              translatedLyric: "",
              romanLyric: "",
              isBG: !0,
              isDuet: t.isDuet
            };
            for (const y of i.childNodes)
              if (y.nodeType === Node.TEXT_NODE) {
                const l = y.textContent ?? "";
                /^(\s+)$/.test(l) ? d.words.push({
                  word: " ",
                  startTime: 0,
                  endTime: 0
                }) : d.words.push({
                  word: l,
                  startTime: 0,
                  endTime: 0
                });
              } else if (y.nodeType === Node.ELEMENT_NODE) {
                const l = y, N = l.getAttribute("ttm:role");
                if (l.nodeName === "span" && N)
                  N === "x-translation" ? d.translatedLyric = l.innerHTML.trim() : N === "x-roman" && (d.romanLyric = l.innerHTML.trim());
                else if (l.hasAttribute("begin") && l.hasAttribute("end")) {
                  const o = {
                    word: y.textContent,
                    startTime: D(l.getAttribute("begin")),
                    endTime: D(l.getAttribute("end"))
                  };
                  d.words.push(o);
                }
              }
            const g = d.words[0];
            d.startTime = g.startTime, g != null && g.word.startsWith("(") && (g.word = g.word.substring(1));
            const w = d.words[d.words.length - 1];
            d.endTime = w.endTime, w != null && w.word.endsWith(")") && (w.word = w.word.substring(
              0,
              w.word.length - 1
            )), T = d;
          } else
            A === "x-translation" ? t.translatedLyric = i.innerHTML : A === "x-roman" && (t.romanLyric = i.innerHTML);
        else if (i.hasAttribute("begin") && i.hasAttribute("end")) {
          const d = {
            word: x.textContent ?? "",
            startTime: D(i.getAttribute("begin")),
            endTime: D(i.getAttribute("end"))
          };
          t.words.push(d);
        }
      }
    u.push(t), T && u.push(T);
  }
  return u;
}
function b(m) {
  let s = m;
  if (s === 1 / 0)
    return "99:99.999";
  s = s / 1e3;
  const f = s % 60;
  s = (s - f) / 60;
  const p = s % 60, u = (s - p) / 60, e = u.toString().padStart(2, "0"), t = p.toString().padStart(2, "0"), T = f.toFixed(3).padStart(6, "0");
  return u > 0 ? `${e}:${t}:${T}` : `${t}:${T}`;
}
function B(m, s = !1) {
  var w, y, l, N;
  const f = !!m.find((o) => o.isDuet), p = m.every((o) => o.words.length <= 1), u = [m], e = new Document(), t = e.createElement("tt");
  t.setAttribute("xmlns", "http://www.w3.org/ns/ttml"), t.setAttribute("xmlns:ttm", "http://www.w3.org/ns/ttml#metadata"), t.setAttribute(
    "xmlns:itunes",
    "http://music.apple.com/lyric-ttml-internal"
  ), e.appendChild(t);
  const T = e.createElement("head");
  t.appendChild(T);
  const x = e.createElement("body"), i = e.createElement("metadata"), A = e.createElement("ttm:agent");
  if (A.setAttribute("type", "person"), A.setAttribute("xml:id", "v1"), i.appendChild(A), f) {
    const o = e.createElement("ttm:agent");
    o.setAttribute("type", "other"), o.setAttribute("xml:id", "v2"), i.appendChild(o);
  }
  T.appendChild(i);
  const d = (((w = m[m.length - 1]) == null ? void 0 : w.endTime) ?? 0) - (((y = m[0]) == null ? void 0 : y.startTime) ?? 0);
  x.setAttribute("dur", b(d));
  let g;
  for (const o of u) {
    const C = e.createElement("div"), M = ((l = o[0]) == null ? void 0 : l.startTime) ?? 0, v = ((N = o[o.length - 1]) == null ? void 0 : N.endTime) ?? 0;
    C.setAttribute("begin", b(M)), C.setAttribute("end", b(v));
    let P = 0;
    for (const c of o) {
      const a = e.createElement("p"), $ = c.startTime ?? 0, z = c.endTime;
      if (a.setAttribute("begin", b($)), a.setAttribute("end", b(z)), a.setAttribute("ttm:agent", c.isDuet ? "v2" : "v1"), a.setAttribute("itunes:key", `L${++P}`), c.isBG) {
        const n = c, h = e.createElement("span");
        if (h.setAttribute("ttm:role", "x-bg"), p)
          h.appendChild(
            e.createTextNode(n.words.map((r) => r.word).join(""))
          );
        else {
          let r = 0, L = 0;
          for (const E of n.words)
            if (E.word.trim().length === 0)
              h.appendChild(e.createTextNode(E.word));
            else {
              const S = e.createElement("span");
              S.setAttribute("begin", b(E.startTime)), S.setAttribute("end", b(E.endTime)), S.appendChild(e.createTextNode(E.word)), h.appendChild(S), r = Math.min(r, E.startTime), L = Math.max(L, E.endTime);
            }
        }
        if (n.translatedLyric) {
          const r = e.createElement("span");
          r.setAttribute("ttm:role", "x-translation"), r.setAttribute("xml:lang", "zh-CN"), r.appendChild(e.createTextNode(n.translatedLyric)), h.appendChild(r);
        }
        if (n.romanLyric) {
          const r = e.createElement("span");
          r.setAttribute("ttm:role", "x-roman"), r.appendChild(e.createTextNode(n.romanLyric)), h.appendChild(r);
        }
        a.appendChild(h);
      } else if (p)
        a.appendChild(
          e.createTextNode(c.words.map((n) => n.word).join(""))
        );
      else {
        let n = 1 / 0, h = 0;
        for (const r of c.words)
          if (r.word.trim().length === 0)
            a.appendChild(e.createTextNode(r.word));
          else {
            const L = e.createElement("span");
            L.setAttribute("begin", b(r.startTime)), L.setAttribute("end", b(r.endTime)), L.appendChild(e.createTextNode(r.word)), a.appendChild(L), n = Math.min(n, r.startTime), h = Math.max(h, r.endTime);
          }
        a.setAttribute("begin", b(n)), a.setAttribute("end", b(h));
      }
      if (c.translatedLyric) {
        const n = e.createElement("span");
        n.setAttribute("ttm:role", "x-translation"), n.setAttribute("xml:lang", "zh-CN"), n.appendChild(e.createTextNode(c.translatedLyric)), a.appendChild(n);
      }
      if (c.romanLyric) {
        const n = e.createElement("span");
        n.setAttribute("ttm:role", "x-roman"), n.appendChild(e.createTextNode(c.romanLyric)), a.appendChild(n);
      }
      c.isBG && g ? a.firstElementChild && g.appendChild(a.firstElementChild) : (g = a, C.appendChild(a));
    }
    x.appendChild(C);
  }
  if (t.appendChild(x), s) {
    const o = new DOMParser().parseFromString(
      [
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">',
        '    <xsl:value-of select="normalize-space(.)"/>',
        "  </xsl:template>",
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        "  </xsl:template>",
        '  <xsl:output indent="yes"/>',
        "</xsl:stylesheet>"
      ].join(`
`),
      "application/xml"
    ), C = new XSLTProcessor();
    C.importStylesheet(o);
    const M = C.transformToDocument(e);
    return new XMLSerializer().serializeToString(M);
  } else
    return new XMLSerializer().serializeToString(e);
}
export {
  X as parseTTML,
  B as stringifyTTML
};
