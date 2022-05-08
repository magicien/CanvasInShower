import Shader from './Shader';

const vertexFunc = `#version 300 es
uniform vec2 screenScale;
uniform vec2 offset;

in vec2 position;
out vec2 vTexCoord;

void main() {
  vTexCoord = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  vec2 pos = (position - offset) * screenScale;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const fragmentFunc = `#version 300 es
precision highp float;

uniform sampler2D rainSampler;
uniform sampler2D shadowSampler;
uniform sampler2D backgroundSampler;

uniform vec2 resolution;
uniform vec2 parallax;
uniform float parallaxFg;
uniform float parallaxBg;
uniform float textureRatio;
uniform float minRefraction;
uniform float refractionDelta;
uniform float brightness;
uniform float alphaMultiply;
uniform float alphaSubtract;

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
  return parallax / resolution * v;
}

vec2 texCoord() {
  return vec2(vTexCoord.x, resolution.y - vTexCoord.y) / resolution;
}

vec2 scaledTexCoord() {
  float ratio = resolution.x / resolution.y;
  vec2 scale = vec2(1.0);
  vec2 offset = vec2(0.0);
  float ratioDelta = ratio - textureRatio;
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
  vec4 rainColor = texture(rainSampler, vTexCoord);

  vec2 bgCoord = scaledTexCoord() + calcParallax(parallaxFg);
  vec4 bg = texture(backgroundSampler, scaledTexCoord() + calcParallax(parallaxFg));

  float d = rainColor.b; // "thickness"
  float x = rainColor.g;
  float y = rainColor.r;

  float a = clamp(rainColor.a * alphaMultiply - alphaSubtract, 0.0, 1.0);

  vec2 refraction = (vec2(x, y) - 0.5) * 2.0;
  vec2 refractionParallax = calcParallax(parallaxBg - parallaxFg);
  vec2 refractionPos = scaledTexCoord()
    + (refraction / resolution * (minRefraction + d * refractionDelta))
    + refractionParallax;

  vec4 tex = texture(backgroundSampler, refractionPos);
  vec4 shadowColor = texture(shadowSampler, vec2(x, y - 0.1));
  // shadowColor.a *= rainColor.a;

  vec4 fg = vec4(tex.rgb * brightness * (1.0 - shadowColor.a), a);

  outColor = blend(bg, fg);
  outColor.a = 1.0;
}
`;

export default class OuterWindowShader extends Shader {
  initializeData({ backgroundSampler, rainSampler }) {
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
        name: 'screenScale',
      },
      {
        name: 'offset',
      },
      {
        name: 'resolution',
      },
      {
        name: 'parallax',
      },
      {
        name: 'parallaxFg',
      },
      {
        name: 'parallaxBg',
      },
      {
        name: 'textureRatio',
      },
      {
        name: 'minRefraction',
      },
      {
        name: 'refractionDelta',
      },
      {
        name: 'brightness',
      },
      {
        name: 'alphaMultiply',
      },
      {
        name: 'alphaSubtract',
      },
    ];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'rainSampler',
        src: rainSampler,
      },
      {
        name: 'shadowSampler',
        src: './img/shadow.png',
      },
      {
        name: 'backgroundSampler',
        src: backgroundSampler,
      },
    ];

    this.usesFrameBuffer = true;
    this.clearColor = [0, 0, 0, 1];
  }

  resize(width, height) {
    super.resize(width, height);

    let scaleX = 1.0;
    let scaleY = 1.0;
    if (width > height) {
      scaleY = width / height;
    } else {
      scaleX = height / width;
    }

    this.setUniform('screenScale', [scaleX, scaleY]);
    this.setUniform('resolution', [1.0, 1.0]);
  }
}
