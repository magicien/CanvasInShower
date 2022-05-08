import Shader from './Shader';

const vertexFunc = `#version 300 es
uniform vec2 screenScale;

in vec2 position;
in vec2 centerPos;
in float radius;
in float thickness;
in vec2 spread;

out vec2 vTexCoord;
out float vThickness;

void main() {
  vTexCoord = (position + vec2(1.0)) * 0.5;
  vThickness = thickness;
  vec2 cPos = centerPos * screenScale - vec2(1.0);
  vec2 vPos = cPos + position * radius * (spread + vec2(1.0)) * vec2(1.0, 1.5) * screenScale;
  gl_Position = vec4(vPos, 0.0, 1.0);
}
`;

const fragmentFunc = `#version 300 es
precision highp float;

uniform sampler2D sampler;

in vec2 vTexCoord;
in float vThickness;

out vec4 outColor;

void main() {
  outColor = texture(sampler, vTexCoord);
  outColor.b = vThickness;
}
`;

export default class RainShader extends Shader {
  initializeData() {
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

    this.instanceAttributes = [
      {
        name: 'centerPos',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: true,
        initialValue: [
          -0.7, -0.7,
          0, 0,
          0.5, 0.5,
        ],
      },
      {
        name: 'radius',
        numComponents: 1,
        type: gl.FLOAT,
        normalize: false,
        dynamic: true,
        initialValue: [
          1,
          1,
          1,
        ],
      },
      {
        name: 'thickness',
        numComponents: 1,
        type: gl.FLOAT,
        normalize: false,
        dynamic: true,
        initialValue: [
          1,
          1,
          1,
        ],
      },
      {
        name: 'spread',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: true,
        initialValue: [
          0, 0,
          0, 0.5,
          0, 0.5,
        ],
      },
    ];

    this.uniformAttributes = [
      {
        name: 'screenScale',
      },
    ];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'sampler',
        src: './img/drop-color-alpha.png',
      },
    ];

    this.usesFrameBuffer = true;
    this.clearColor = [0, 0, 0, 0];
  }

  resize() {
    const size = 1024;
    super.resize(size, size);

    const scale = 2.0 / size;

    this.setUniform('screenScale', [scale, scale]);
  }
}
