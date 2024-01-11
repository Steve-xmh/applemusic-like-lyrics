#version 300 es
precision highp float;
uniform float IIIlllllllIIIllIl,lIIIlllllIllIl,IIIlllIlIIllll;
uniform sampler2D IlllIIlIlllIll;
uniform vec2 IIlIlIIlIlIllI;
out vec4 lIIlIIIIIlIlIlllIIIIlIIl;
mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
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
  float lIIlIllIIIlIl=llIlIIllllIII(IlllIIlIIIIlIIII*1.5+sin(.1*lIIIlllllIllIl))*3.2831;
  IlllIIlIIIIlIIII+=vec2(.1,.5);
  lIIlIllIIIlIl+=llIlIIllllIII(IlllIIlIIIIlIIII*vec2(1.5,1.)*3.5-sin(.1*lIIIlllllIllIl))*2.2831*IIIlllllllIIIllIl;
  lIIlIllIIIlIl-=lIIIIlllIIIIllIlIlI;
  return vec2(cos(lIIlIllIIIlIl),sin(lIIlIllIIIlIl));
}
const float overlap = 0.2;

const float rgOverlap = 0.1 * overlap;
const float rbOverlap = 0.01 * overlap;
const float gbOverlap = 0.04 * overlap;

const mat3 coneOverlap = mat3(1.0, 			rgOverlap, 	rbOverlap,
							  rgOverlap, 	1.0, 		gbOverlap,
							  rbOverlap, 	rgOverlap, 	1.0);

const mat3 coneOverlapInverse = mat3(	1.0 + (rgOverlap + rbOverlap), 			-rgOverlap, 	-rbOverlap,
									  	-rgOverlap, 		1.0 + (rgOverlap + gbOverlap), 		-gbOverlap,
									  	-rbOverlap, 		-rgOverlap, 	1.0 + (rbOverlap + rgOverlap));

vec3 tonemap(vec3 color)
{
	color = color * coneOverlap;



	const float p = 3.0;
	color = pow(color, vec3(p));
	color = color / (1.0 + color);
	color = pow(color, vec3(1.0 / p));


	// color *= 0.5;
	// color = saturate(color);
	// const float p = 0.1;
	// color = pow(color, vec3(p));
	// color = SineHalfRadian(color);
	// color = pow(color, vec3(2.5 / p));


	color = color * coneOverlapInverse;
	color = clamp(color, vec3(0.0), vec3(1.0));



	return color;
}

void main()
{
  vec2 lIIIlIIllIlIIlI=gl_FragCoord.xy/IIlIlIIlIlIllI.xy,lIIllIIlIIIllI=lIIIlIIllIlIIlI*.8f+vec2(-.1f,.2f);
  lIIllIIlIIIllI.x*=IIlIlIIlIlIllI.x/IIlIlIIlIlIllI.y;
  float lIIlIIlIIlIIIlII=lIIIlllllIllIl*.01f+gl_FragCoord.x/max(IIlIlIIlIlIllI.x,IIlIlIIlIlIllI.y),lIIIlIllIllIlIIl=0.f;
  vec3 lIIIlIlIIIlIlIIl=texture(IlllIIlIlllIll,lIIllIIlIIIllI*rotate2d(lIIIlllllIllIl*.4)).xyz;
  vec2 lIlIIlIlIIIllIll=lIIllIIlIIIllI;
  for(int IllIlIIlIIlllllIIIl=0;IllIlIIlIIlllllIIIl<8;IllIlIIlIIlllllIIIl++)
    {
      vec2 lIllIIlIIlIIIll=lllIIIIIIllIlIIIlI(lIIllIIlIIIllI,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
      float lIIlIlIIlIIlIllI=float(IllIlIIlIIlllllIIIl)/16.f,lIIllIIlIIIIlIII=4.f*lIIlIlIIlIIlIllI*(1.f-lIIlIlIIlIIlIllI);
      vec3 llIIlIIIIlIIlIII=lIIllIIlIIIIlIII*texture(IlllIIlIlllIll,lIIllIIlIIIllI*rotate2d(lIIIlllllIllIl*.4)+IIIlllIlIIllll*.2*(IllIlIIlIIlllllIIIl%2==0?-1.:1.)).xyz;
      //llIIlIIIIlIIlIII*=mix(vec3(.6,.7,.7),vec3(1,.95,.9),.5-.5*dot(reflect(vec3(lIllIIlIIlIIIll,0),vec3(1,0,0)).xy,vec2(.707)));
      lIIIlIlIIIlIlIIl+=lIIllIIlIIIIlIII*llIIlIIIIlIIlIII;
      lIIIlIllIllIlIIl+=lIIllIIlIIIIlIII;
      lIIllIIlIIIllI+=.05f*lIllIIlIIlIIIll;
      lIlIIlIlIIIllIll+=.01f*lIllIIlIIlIIIll;
    }
  lIIIlIlIIIlIlIIl/=lIIIlIllIllIlIIl;
  vec2 IIlllIIlIllIIlI=lllIIIIIIllIlIIIlI(lIlIIlIlIIIllIll,lIIlIIlIIlIIIlII,lIIIlIIllIlIIlI);
  //lIIIlIlIIIlIlIIl*=.95f+.35f*dot(IIlllIIlIllIIlI,vec2(.707f));
  lIIIlIlIIIlIlIIl*=.2f+.8f*pow(2.f*lIIIlIIllIlIIlI.x*(1.f-lIIIlIIllIlIIlI.x),.1f);
  lIIIlIlIIIlIlIIl*=2.8f;
  lIIIlIlIIIlIlIIl=1.f-exp(-lIIIlIlIIIlIlIIl);
  lIIIlIlIIIlIlIIl=pow(lIIIlIlIIIlIlIIl,vec3(2.2));
  lIIIlIlIIIlIlIIl*=.9f;
  lIIIlIlIIIlIlIIl=tonemap(lIIIlIlIIIlIlIIl);
  lIIlIIIIIlIlIlllIIIIlIIl=vec4(lIIIlIlIIIlIlIIl,1);
}