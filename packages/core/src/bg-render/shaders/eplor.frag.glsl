#version 300 es
precision highp float;
uniform float IIIlllllllIIIllIl,lIIIlllllIllIl,IIIlllIlIIllll;
uniform sampler2D IlllIIlIlllIll;
uniform vec2 IIlIlIIlIlIllI;
out vec4 lIIlIIIIIlIlIlllIIIIlIIl;
mat2 lIIllIIlIIIllIl(float IIIlIIlIIIlllIII){
    return mat2(cos(IIIlIIlIIIlllIII),-sin(IIIlIIlIIIlllIII),
                sin(IIIlIIlIIIlllIII),cos(IIIlIIlIIIlllIII));
}
float IllllIIlIllII(float llIIllIllIIIllI)
{
  return fract(sin(llIIllIllIIIllI)*43758.5453);
}
float llIlIIllllIII(vec2 IIIlIIlIIIlllIII)
{
  vec2 IIllIlIIlllI=floor(IIIlIIlIIIlllIII),lIlIllIIIIIlIl=fract(IIIlIIlIIIlllIII);
  lIlIllIIIIIlIl=lIlIllIIIIIlIl*lIlIllIIIIIlIl*(3.-2.*lIlIllIIIIIlIl);
  float lIlIlIlIlIlIIl=IIllIlIIlllI.x+IIllIlIIlllI.y*57.;
  return mix(mix(IllllIIlIllII(lIlIlIlIlIlIIl),IllllIIlIllII(lIlIlIlIlIlIIl+1.),lIlIllIIIIIlIl.x),mix(IllllIIlIllII(lIlIlIlIlIlIIl+57.),IllllIIlIllII(lIlIlIlIlIlIIl+58.),lIlIllIIIIIlIl.x),lIlIllIIIIIlIl.y);
}
vec2 lllIIIIIIllIlIIIlI(vec2 IlllIIlIIIIlIIII,float lIIIIlllIIIIllIlIlI,vec2 IlIlIIIIlIlllIlIII)
{
  float lIIlIllIIIlIl=llIlIIllllIII(IlllIIlIIIIlIIII*vec2(1.0,1.0)*3.5+.1)*4.2831*IIIlllllllIIIllIl;
  IlllIIlIIIIlIIII+=vec2(-1.0,.5);
  // lIIlIllIIIlIl+=llIlIIllllIII(IlllIIlIIIIlIIII*vec2(1.0,1.)*1.8-sin(.3*lIIIlllllIllIl)*.1+.1)*6.2831*IIIlllllllIIIllIl;
  lIIlIllIIIlIl-=lIIIIlllIIIIllIlIlI;
  return vec2(cos(lIIlIllIIIlIl),sin(lIIlIllIIIlIl));
}
const mat3 lIIllIIIlllIl=mat3(1.,.02,.002,.02,1.,.008,.002,.02,1.),lIIIlllIIIIll=mat3(1.022,-.02,-.002,-.02,1.028,-.008,-.002,-.02,1.022);
vec3 IllllIIIlIlllI(vec3 lIlIIlIlIIIllIll)
{
  lIlIIlIlIIIllIll*=lIIllIIIlllIl;
  lIlIIlIlIIIllIll=pow(lIlIIlIlIIIllIll,vec3(3));
  lIlIIlIlIIIllIll/=1.+lIlIIlIlIIIllIll;
  lIlIIlIlIIIllIll=pow(lIlIIlIlIIIllIll,vec3(1./3.));
  lIlIIlIlIIIllIll*=lIIIlllIIIIll;
  return clamp(lIlIIlIlIIIllIll,vec3(0),vec3(1));
}
void main()
{
  // lIIlIIIIIlIlIlllIIIIlIIl=texture(IlllIIlIlllIll,gl_FragCoord.xy/IIlIlIIlIlIllI.xy);
  // return;
  vec2 lIIIlIIllIlIIlI=sin(lIIIlllllIllIl*.2)*.1+0.2+gl_FragCoord.xy/IIlIlIIlIlIllI.xy,lIIllIIlIIIllI=lIIIlIIllIlIIlI*.8f+vec2(-1.2f,-.9f);
  lIIllIIlIIIllI.x*=IIlIlIIlIlIllI.x/IIlIlIIlIlIllI.y;
  float lIIlIIlIIlIIIlII=gl_FragCoord.x/max(IIlIlIIlIlIllI.x,IIlIlIIlIlIllI.y),lIIIlIllIllIlIIl=0.f;
  // vec3 lIIIlIlIIIlIlIIl=texture(IlllIIlIlllIll,lIIllIIlIIIllI*lIIllIIlIIIllIl(lIIIlllllIllIl*.1)).xyz;
  vec3 lIIIlIlIIIlIlIIl=vec3(0.0);
  vec2 lIlIIlIlIIIllIll=lIIllIIlIIIllI;
  for(int IllIlIIlIIlllllIIIl=0;IllIlIIlIIlllllIIIl<32;IllIlIIlIIlllllIIIl++)
    {
      vec2 lIllIIlIIlIIIll=lllIIIIIIllIlIIIlI(lIIllIIlIIIllI,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
      float lIIlIlIIlIIlIllI=float(IllIlIIlIIlllllIIIl)/32.f,lIIllIIlIIIIlIII=4.f*lIIlIlIIlIIlIllI*(1.f-lIIlIlIIlIIlIllI);
      vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,-lIIIlllllIllIl*.1+.8*(IllIlIIlIIlllllIIIl%2==0?lIIllIIlIIIllI:lIIllIIlIIIllI-2.0)*lIIllIIlIIIllIl(lIIIlllllIllIl*(IllIlIIlIIlllllIIIl%2==0?.1:-.1))+vec2((3.-IIIlllIlIIllll)*0.15*(IllIlIIlIIlllllIIIl%2==0?1.:-1.)*lIIllIIlIIIllIl(lIIIlllllIllIl*(IllIlIIlIIlllllIIIl%2==0?.1:-.1)))).xyz;
    //   vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,-lIIIlllllIllIl*.1+.8*(IllIlIIlIIlllllIIIl%2==0?lIIllIIlIIIllI:lIIllIIlIIIllI-2.0)+(3.-IIIlllIlIIllll)*.15*(IllIlIIlIIlllllIIIl%2==0?1.:-1.)).xyz;
      // vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,(IllIlIIlIIlllllIIIl%2==0?lIIllIIlIIIllI-IIIlllIlIIllll*.2:vec2(1.)-lIIllIIlIIIllI*1.2+IIIlllIlIIllll*.2)*rotate2d(lIIIlllllIllIl*.4)).xyz;
      float lIIllIIlIIlIIlI=sin(lIIIlllllIllIl*2.)*.5+.5;
      float lIIlIIlIIllIIlI=smoothstep(1.0,0.0,dot(reflect(vec3(lIllIIlIIlIIIll,.0),vec3(1,0,0)), vec3(1.0)));
    //   float lIIlIIlIIllIIlI=smoothstep(1.0,0.0,dot(vec3(lIllIIlIIlIIIll,.0), vec3(1.0)));
    //   lIIlIIlIIllIIlI=sign(lIIlIIlIIllIIlI);
    //   lIIlIIlIIllIIlI=lIIlIIlIIllIIlI>0.9?1.0:0.0;
    //   float lIIlIIlIIllIIlI=clamp(dot(reflect(vec3(lIllIIlIIlIIIll,.0),vec3(1,0,0)), vec3(1.0)),0.0,1.0);
      // llIIlIIIIlIIlIII=1.0-lIIlIIlIIllIIlI*vec3(1.0);
      // llIIlIIIIlIIlIII+=lIIlIIlIIllIIlI*vec3(1.0);
      llIIlIIIIlIIlIII*=(1.0-lIIllIIlIIlIIlI)+lIIllIIlIIlIIlI*vec3(IllIlIIlIIlllllIIIl%2==0?1.0-lIIlIIlIIllIIlI:lIIlIIlIIllIIlI)*2.;
      // llIIlIIIIlIIlIII*=mix(vec3(.7),vec3(1.),.5-.5*dot(reflect(vec3(lIllIIlIIlIIIll,0),vec3(0,1,0)).xy,vec2(.707)));
      lIIIlIlIIIlIlIIl+=lIIllIIlIIIIlIII*llIIlIIIIlIIlIII;
      lIIIlIllIllIlIIl+=lIIllIIlIIIIlIII;
      // if (IllIlIIlIIlllllIIIl >= 4) {
      //   lIIllIIlIIIllI+=.03f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.9+.5)*3.;
      // } else {
      //   lIIllIIlIIIllI+=.01f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.5+.9)*3.;
      // }
      lIIllIIlIIIllI+=.006f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.5+1.);
      lIlIIlIlIIIllIll+=.05f*lIllIIlIIlIIIll;
    }
  lIIIlIlIIIlIlIIl/=lIIIlIllIllIlIIl;
  vec2 IIlllIIlIllIIlI=lllIIIIIIllIlIIIlI(lIlIIlIlIIIllIll,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
  // lIIIlIlIIIlIlIIl*=.95f+.35f*dot(IIlllIIlIllIIlI,vec2(.707f));
  // lIIIlIlIIIlIlIIl*=.2f+.8f*pow(2.f*lIIIlIIllIlIIlI.x*(1.f-lIIIlIIllIlIIlI.x),.1f);
  lIIIlIlIIIlIlIIl*=2.6f;
  lIIIlIlIIIlIlIIl=1.f-exp(-lIIIlIlIIIlIlIIl);
  lIIIlIlIIIlIlIIl=pow(lIIIlIlIIIlIlIIl,vec3(2.2));
  lIIIlIlIIIlIlIIl*=.9f;
  lIIIlIlIIIlIlIIl=IllllIIIlIlllI(lIIIlIlIIIlIlIIl);
  // lIIIlIlIIIlIlIIl += (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy) - (0.5 / 255.0);
  lIIlIIIIIlIlIlllIIIIlIIl=vec4(lIIIlIlIIIlIlIIl,1);
}