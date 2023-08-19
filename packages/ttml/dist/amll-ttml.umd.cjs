(function(L,D){typeof exports=="object"&&typeof module<"u"?D(exports):typeof define=="function"&&define.amd?define(["exports"],D):(L=typeof globalThis<"u"?globalThis:L||self,D(L.AppleMusicLikeLyricsTTML={}))})(this,function(L){"use strict";const D=/^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;function M(m){var b,u,T;const r=D.exec(m);if(r){const e=Number(((b=r.groups)==null?void 0:b.hour)||"0"),t=Number(((u=r.groups)==null?void 0:u.min)||"0"),h=Number(((T=r.groups)==null?void 0:T.sec.replace(/:/,"."))||"0");return Math.floor((e*3600+t*60+h)*1e3)}else throw new TypeError("时间戳字符串解析失败")}function $(m){const b=new DOMParser().parseFromString(m,"application/xml");let u="v1";for(const e of b.querySelectorAll("ttm\\:agent"))if(e.getAttribute("type")==="person"){const t=e.getAttribute("xml:id");t&&(u=t)}const T=[];for(const e of b.querySelectorAll("body p[begin][end]")){const t={words:[],startTime:M(e.getAttribute("begin")??"0:0"),endTime:M(e.getAttribute("end")??"0:0"),translatedLyric:"",romanLyric:"",isBG:!1,isDuet:e.getAttribute("ttm:agent")!==u};let h=null;for(const x of e.childNodes)if(x.nodeType===Node.TEXT_NODE){const i=x.textContent??"";/^(\s+)$/.test(i)?t.words.push({word:" ",startTime:0,endTime:0}):t.words.push({word:i,startTime:0,endTime:0})}else if(x.nodeType===Node.ELEMENT_NODE){const i=x,A=i.getAttribute("ttm:role");if(i.nodeName==="span"&&A)if(A==="x-bg"){const d={words:[],startTime:t.startTime,endTime:t.endTime,translatedLyric:"",romanLyric:"",isBG:!0,isDuet:t.isDuet};for(const y of i.childNodes)if(y.nodeType===Node.TEXT_NODE){const l=y.textContent??"";/^(\s+)$/.test(l)?d.words.push({word:" ",startTime:0,endTime:0}):d.words.push({word:l,startTime:0,endTime:0})}else if(y.nodeType===Node.ELEMENT_NODE){const l=y,S=l.getAttribute("ttm:role");if(l.nodeName==="span"&&S)S==="x-translation"?d.translatedLyric=l.innerHTML.trim():S==="x-roman"&&(d.romanLyric=l.innerHTML.trim());else if(l.hasAttribute("begin")&&l.hasAttribute("end")){const o={word:y.textContent,startTime:M(l.getAttribute("begin")),endTime:M(l.getAttribute("end"))};d.words.push(o)}}const g=d.words[0];d.startTime=g.startTime,g!=null&&g.word.startsWith("(")&&(g.word=g.word.substring(1));const w=d.words[d.words.length-1];d.endTime=w.endTime,w!=null&&w.word.endsWith(")")&&(w.word=w.word.substring(0,w.word.length-1)),h=d}else A==="x-translation"?t.translatedLyric=i.innerHTML:A==="x-roman"&&(t.romanLyric=i.innerHTML);else if(i.hasAttribute("begin")&&i.hasAttribute("end")){const d={word:x.textContent??"",startTime:M(i.getAttribute("begin")),endTime:M(i.getAttribute("end"))};t.words.push(d)}}T.push(t),h&&T.push(h)}return T}function p(m){let r=m;if(r===1/0)return"99:99.999";r=r/1e3;const b=r%60;r=(r-b)/60;const u=r%60,T=(r-u)/60,e=T.toString().padStart(2,"0"),t=u.toString().padStart(2,"0"),h=b.toFixed(3).padStart(6,"0");return T>0?`${e}:${t}:${h}`:`${t}:${h}`}function z(m,r=!1){var w,y,l,S;const b=!!m.find(o=>o.isDuet),u=m.every(o=>o.words.length<=1),T=[m],e=new Document,t=e.createElement("tt");t.setAttribute("xmlns","http://www.w3.org/ns/ttml"),t.setAttribute("xmlns:ttm","http://www.w3.org/ns/ttml#metadata"),t.setAttribute("xmlns:itunes","http://music.apple.com/lyric-ttml-internal"),e.appendChild(t);const h=e.createElement("head");t.appendChild(h);const x=e.createElement("body"),i=e.createElement("metadata"),A=e.createElement("ttm:agent");if(A.setAttribute("type","person"),A.setAttribute("xml:id","v1"),i.appendChild(A),b){const o=e.createElement("ttm:agent");o.setAttribute("type","other"),o.setAttribute("xml:id","v2"),i.appendChild(o)}h.appendChild(i);const d=(((w=m[m.length-1])==null?void 0:w.endTime)??0)-(((y=m[0])==null?void 0:y.startTime)??0);x.setAttribute("dur",p(d));let g;for(const o of T){const C=e.createElement("div"),P=((l=o[0])==null?void 0:l.startTime)??0,O=((S=o[o.length-1])==null?void 0:S.endTime)??0;C.setAttribute("begin",p(P)),C.setAttribute("end",p(O));let X=0;for(const c of o){const a=e.createElement("p"),j=c.startTime??0,B=c.endTime;if(a.setAttribute("begin",p(j)),a.setAttribute("end",p(B)),a.setAttribute("ttm:agent",c.isDuet?"v2":"v1"),a.setAttribute("itunes:key",`L${++X}`),c.isBG){const n=c,f=e.createElement("span");if(f.setAttribute("ttm:role","x-bg"),u)f.appendChild(e.createTextNode(n.words.map(s=>s.word).join("")));else{let s=0,E=0;for(const N of n.words)if(N.word.trim().length===0)f.appendChild(e.createTextNode(N.word));else{const v=e.createElement("span");v.setAttribute("begin",p(N.startTime)),v.setAttribute("end",p(N.endTime)),v.appendChild(e.createTextNode(N.word)),f.appendChild(v),s=Math.min(s,N.startTime),E=Math.max(E,N.endTime)}}if(n.translatedLyric){const s=e.createElement("span");s.setAttribute("ttm:role","x-translation"),s.setAttribute("xml:lang","zh-CN"),s.appendChild(e.createTextNode(n.translatedLyric)),f.appendChild(s)}if(n.romanLyric){const s=e.createElement("span");s.setAttribute("ttm:role","x-roman"),s.appendChild(e.createTextNode(n.romanLyric)),f.appendChild(s)}a.appendChild(f)}else if(u)a.appendChild(e.createTextNode(c.words.map(n=>n.word).join("")));else{let n=1/0,f=0;for(const s of c.words)if(s.word.trim().length===0)a.appendChild(e.createTextNode(s.word));else{const E=e.createElement("span");E.setAttribute("begin",p(s.startTime)),E.setAttribute("end",p(s.endTime)),E.appendChild(e.createTextNode(s.word)),a.appendChild(E),n=Math.min(n,s.startTime),f=Math.max(f,s.endTime)}a.setAttribute("begin",p(n)),a.setAttribute("end",p(f))}if(c.translatedLyric){const n=e.createElement("span");n.setAttribute("ttm:role","x-translation"),n.setAttribute("xml:lang","zh-CN"),n.appendChild(e.createTextNode(c.translatedLyric)),a.appendChild(n)}if(c.romanLyric){const n=e.createElement("span");n.setAttribute("ttm:role","x-roman"),n.appendChild(e.createTextNode(c.romanLyric)),a.appendChild(n)}c.isBG&&g?a.firstElementChild&&g.appendChild(a.firstElementChild):(g=a,C.appendChild(a))}x.appendChild(C)}if(t.appendChild(x),r){const o=new DOMParser().parseFromString(['<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">','  <xsl:strip-space elements="*"/>','  <xsl:template match="para[content-style][not(text())]">','    <xsl:value-of select="normalize-space(.)"/>',"  </xsl:template>",'  <xsl:template match="node()|@*">','    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',"  </xsl:template>",'  <xsl:output indent="yes"/>',"</xsl:stylesheet>"].join(`
`),"application/xml"),C=new XSLTProcessor;C.importStylesheet(o);const P=C.transformToDocument(e);return new XMLSerializer().serializeToString(P)}else return new XMLSerializer().serializeToString(e)}L.parseTTML=$,L.stringifyTTML=z,Object.defineProperty(L,Symbol.toStringTag,{value:"Module"})});