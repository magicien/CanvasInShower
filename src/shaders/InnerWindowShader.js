import Shader from './Shader';

const vertexFunc = `#version 300 es
in vec2 position;
out vec2 vTexCoord;

void main() {
  vTexCoord = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  vec2 pos = position;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const fragmentFunc = `#version 300 es
precision highp float;

uniform sampler2D frostSampler;
uniform sampler2D backgroundSampler;

uniform vec2 parallax;
uniform float parallaxFg;
uniform float textureRatio;
uniform float frostAlpha;
uniform float frostAdd;

in vec2 vTexCoord;

out vec4 outColor;

vec4 blend(vec4 bg, vec4 fg) {
  vec3 bgm = bg.rgb * bg.a;
  vec3 fgm = fg.rgb * fg.a;
  float ia = 1.0 - fg.a;
  float a = (fg.a + bg.a * ia);
  vec3 rgb;
  if (a != 0.0) {
    rgb = (fgm + bgm * ia) / a;
  } else {
    rgb = vec3(0.0, 0.0, 0.0);
  }
  return vec4(rgb, a);
}

vec2 calcParallax(float v) {
  return parallax * v;
}

vec2 texCoord() {
  return vec2(vTexCoord.x, vTexCoord.y);
}

vec2 scaledTexCoord() {
  vec2 scale = vec2(1.0);
  vec2 offset = vec2(0.0);
  float ratioDelta = 1.0 - textureRatio;
  if (ratioDelta >= 0.0) {
    scale.y = (1.0 + ratioDelta);
    offset.y = ratioDelta / 2.0;
  } else {
    scale.x = (1.0 - ratioDelta);
    offset.x = -ratioDelta / 2.0;
  }
  return (texCoord() + offset) / scale;
}

void main() {
  vec2 bgCoord = scaledTexCoord() + calcParallax(parallaxFg);
  vec4 frost = texture(frostSampler, vTexCoord);
  float alpha = (1.0 - frost.a * (1.0 - frostAdd));
  vec4 frostColor = vec4(1.0, 1.0, 1.0, alpha * frostAlpha);
  vec4 bg = texture(backgroundSampler, bgCoord);

  /*
  if (alpha > 0.0) {
    vec4 bg2 = vec4(0.0);
    float diff = 0.02;
    bg2 += texture(backgroundSampler, bgCoord + vec2(diff, diff)) * 0.05;
    bg2 += texture(backgroundSampler, bgCoord + vec2(diff, 0)) * 0.2;
    bg2 += texture(backgroundSampler, bgCoord + vec2(diff, -diff)) * 0.05;
    bg2 += texture(backgroundSampler, bgCoord + vec2(0, diff)) * 0.2;
    // bg2 += texture(backgroundSampler, bgCoord + vec2(0, 0));
    bg2 += texture(backgroundSampler, bgCoord + vec2(0, -diff)) * 0.2;
    bg2 += texture(backgroundSampler, bgCoord + vec2(-diff, diff)) * 0.05;
    bg2 += texture(backgroundSampler, bgCoord + vec2(-diff, 0)) * 0.2;
    bg2 += texture(backgroundSampler, bgCoord + vec2(-diff -diff)) * 0.05;
    // bg2 /= 9.0;
    bg2.a = alpha;
    bg = blend(bg, bg2);
    outColor = blend(bg, frostColor);
  } else {
    outColor = bg;
  }
  */
  outColor = blend(bg, frostColor);
}
`;

export default class InnerWindowShader extends Shader {
  initializeData({ backgroundSampler, frostSampler }) {
    const gl = this.context;

    this.vertexFunc = vertexFunc;
    this.fragmentFunc = fragmentFunc;

    this.vertexAttributes = [
      {
        name: 'position',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: false,
        initialValue: [
          -1, -1,
          1, -1,
          -1, 1,
          1, 1,
        ],
      },
    ];

    this.uniformAttributes = [
      {
        name: 'parallax',
      },
      {
        name: 'parallaxFg',
      },
      {
        name: 'textureRatio',
      },
      {
        name: 'frostAlpha',
      },
      {
        name: 'frostAdd',
      },
    ];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'frostSampler',
        src: frostSampler,
      },
      {
        name: 'backgroundSampler',
        src: backgroundSampler,
      },
    ];

    this.usesFrameBuffer = true;
    this.clearColor = null;
  }

  resize(width, height) {
    super.resize(width, height);
  }
}
