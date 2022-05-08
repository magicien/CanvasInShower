import Shader from './Shader';

const vertexFunc = `#version 300 es
in vec2 position;
out vec2 vTexCoord;

void main() {
  vTexCoord = vec2((position.x + 1.0) * 0.5, (position.y + 1.0) * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentFunc = `#version 300 es
precision highp float;

uniform sampler2D sampler;

in vec2 vTexCoord;

out vec4 outColor;

void main() {
  outColor = texture(sampler, vTexCoord);
}
`;

export default class ImageShader extends Shader {
  initializeData({ src, buffer }) {
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

    this.uniformAttributes = [];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'sampler',
        src,
      },
    ];

    this.usesFrameBuffer = !!buffer;
    this.frameBuffer = buffer;
    this.clearColor = [1, 1, 1, 1];
  }

  // eslint-disable-next-line class-methods-use-this
  createFrameBuffer() {}

  // eslint-disable-next-line class-methods-use-this
  resizeFrameBuffer() {}

  resize() {
    const size = 1024;
    super.resize(size, size);
  }
}
