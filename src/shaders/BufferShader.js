import Shader from './Shader';

const vertexFunc = `#version 300 es
uniform vec2 screenScale;

in vec2 position;
out vec2 vTexCoord;

void main() {
  vTexCoord = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  vec2 pos = position * screenScale;
  gl_Position = vec4(pos, 0.0, 1.0);
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

export default class BufferShader extends Shader {
  initializeData({ buffer }) {
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
    ];

    this.indexData = [
      0, 1, 2,
      2, 1, 3,
    ];

    this.textures = [
      {
        name: 'sampler',
        src: buffer,
      },
    ];

    this.clearColor = [1, 1, 1, 1];
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
  }
}
