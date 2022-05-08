import Shader from './Shader';

const vertexFunc = `#version 300 es
uniform vec2 screenScale;
uniform float size;

in vec2 position;
in vec2 centerPos;

out vec2 vTexCoord;

void main() {
  vTexCoord = (position + vec2(1.0)) * 0.5;
  vec2 cPos = centerPos * screenScale - vec2(1.0);
  vec2 vPos = cPos + position * size * screenScale;
  gl_Position = vec4(vPos, 0.0, 1.0);
}
`;

const fragmentFunc = `#version 300 es
precision highp float;

uniform sampler2D sampler;

in vec2 vTexCoord;

out vec4 outColor;

void main() {
  vec4 brush = texture(sampler, vTexCoord);
  outColor = vec4(0.0, 0.0, 0.0, brush.a);
}
`;

export default class DrawingShader extends Shader {
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
          500, 500,
        ],
      },
    ];

    this.uniformAttributes = [
      {
        name: 'screenScale',
      },
      {
        name: 'size',
      },
    ];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'sampler',
        src: './img/brush.png',
      },
    ];

    this.usesFrameBuffer = true;
    this.clearColor = null;
    this.blendSrc = gl.SRC_ALPHA;
    this.blendDst = gl.ONE;
  }

  resize() {
    const size = 1024;
    super.resize(size, size);

    const scale = 2.0 / size;

    this.setUniform('screenScale', [scale, scale]);
  }

  resizeFrameBuffer(width, height) {
    if (this.isFrameInitialized) {
      return;
    }
    super.resizeFrameBuffer(width, height);
    this.isFrameInitialized = true;
  }
}
