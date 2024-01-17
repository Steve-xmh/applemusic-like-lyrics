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
  float lIIlIllIIIlIl=llIlIIllllIII(IlllIIlIIIIlIIII*1.+sin(.2*lIIIlllllIllIl)*.1+.1)*3.2831;
  IlllIIlIIIIlIIII+=vec2(.0,.5);
  lIIlIllIIIlIl+=llIlIIllllIII(IlllIIlIIIIlIIII*vec2(1.0,1.)*3.5-sin(.3*lIIIlllllIllIl)*.1+.1)*2.2831*IIIlllllllIIIllIl;
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
  vec2 lIIIlIIllIlIIlI=sin(lIIIlllllIllIl*.1)*.3+.1+gl_FragCoord.xy/IIlIlIIlIlIllI.xy,lIIllIIlIIIllI=lIIIlIIllIlIIlI*.8f+vec2(-0.8f,-.3f);
  lIIllIIlIIIllI.x*=IIlIlIIlIlIllI.x/IIlIlIIlIlIllI.y;
  float lIIlIIlIIlIIIlII=gl_FragCoord.x/max(IIlIlIIlIlIllI.x,IIlIlIIlIlIllI.y),lIIIlIllIllIlIIl=0.f;
  vec3 lIIIlIlIIIlIlIIl=texture(IlllIIlIlllIll,-lIIIlllllIllIl*.1+1.*lIIllIIlIIIllI*lIIllIIlIIIllIl(lIIIlllllIllIl*.4)).xyz;
  vec2 lIlIIlIlIIIllIll=lIIllIIlIIIllI;
  for(int IllIlIIlIIlllllIIIl=0;IllIlIIlIIlllllIIIl<8;IllIlIIlIIlllllIIIl++)
    {
      vec2 lIllIIlIIlIIIll=lllIIIIIIllIlIIIlI(lIIllIIlIIIllI,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
      float lIIlIlIIlIIlIllI=float(IllIlIIlIIlllllIIIl)/16.f,lIIllIIlIIIIlIII=4.f*lIIlIlIIlIIlIllI*(1.f-lIIlIlIIlIIlIllI);
      vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,lIIIlllllIllIl*.1+1.2*lIIllIIlIIIllI*lIIllIIlIIIllIl(lIIIlllllIllIl*.4)+(3.-IIIlllIlIIllll)*.3*(IllIlIIlIIlllllIIIl%2==0?-1.:1.2)).xyz;
      // vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,(IllIlIIlIIlllllIIIl%2==0?lIIllIIlIIIllI-IIIlllIlIIllll*.2:vec2(1.)-lIIllIIlIIIllI*1.2+IIIlllIlIIllll*.2)*rotate2d(lIIIlllllIllIl*.4)).xyz;
      llIIlIIIIlIIlIII*=mix(vec3(.8),vec3(1),.5-.5*dot(reflect(vec3(lIllIIlIIlIIIll,0),vec3(1,0,0)).xy,vec2(.707)));
      lIIIlIlIIIlIlIIl+=lIIllIIlIIIIlIII*llIIlIIIIlIIlIII;
      lIIIlIllIllIlIIl+=lIIllIIlIIIIlIII;
      // if (IllIlIIlIIlllllIIIl >= 4) {
      //   lIIllIIlIIIllI+=.03f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.9+.5)*3.;
      // } else {
      //   lIIllIIlIIIllI+=.01f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.5+.9)*3.;
      // }
      lIIllIIlIIIllI+=.05f*lIllIIlIIlIIIll*(sin(lIIIlllllIllIl*2.)*.4+1.2);
      lIlIIlIlIIIllIll+=.05f*lIllIIlIIlIIIll;
    }
  lIIIlIlIIIlIlIIl/=lIIIlIllIllIlIIl;
  vec2 IIlllIIlIllIIlI=lllIIIIIIllIlIIIlI(lIlIIlIlIIIllIll,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
  // lIIIlIlIIIlIlIIl*=.95f+.35f*dot(IIlllIIlIllIIlI,vec2(.707f));
  // lIIIlIlIIIlIlIIl*=.2f+.8f*pow(2.f*lIIIlIIllIlIIlI.x*(1.f-lIIIlIIllIlIIlI.x),.1f);
  lIIIlIlIIIlIlIIl*=2.8f;
  lIIIlIlIIIlIlIIl=1.f-exp(-lIIIlIlIIIlIlIIl);
  lIIIlIlIIIlIlIIl=pow(lIIIlIlIIIlIlIIl,vec3(2.0));
  lIIIlIlIIIlIlIIl*=.9f;
  lIIIlIlIIIlIlIIl=IllllIIIlIlllI(lIIIlIlIIIlIlIIl);
  // lIIIlIlIIIlIlIIl += (1.0 / 255.0) * gradientNoise(gl_FragCoord.xy) - (0.5 / 255.0);
  lIIlIIIIIlIlIlllIIIIlIIl=vec4(lIIIlIlIIIlIlIIl,1);
}