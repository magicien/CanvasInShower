import Shader from './Shader';
import BoneData from '../BoneData';

const vertexFunc = `#version 300 es
uniform vec2 screenScale;
uniform mat3 bones[8];

in vec2 position;
in vec2 boneIndices;
in vec2 boneWeights;
in vec2 texCoord;
out vec2 vTexCoord;

void main() {
  vTexCoord = texCoord;
  vec3 pos = vec3(position, 1.0);
  vec3 wPos = bones[int(boneIndices[0])] * pos * boneWeights[0]
              + bones[int(boneIndices[1])] * pos * boneWeights[1];
  gl_Position = vec4(wPos.xy * screenScale / wPos.z, 0.0, 1.0);
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

export default class CharacterShader extends Shader {
  initializeData() {
    this.vertexFunc = vertexFunc;
    this.fragmentFunc = fragmentFunc;

    this.updateVertexAttributes();

    this.uniformAttributes = [
      {
        name: 'screenScale',
      },
      {
        name: 'bones',
      },
    ];

    this.indexData = [
      // hair
      0, 1, 2,
      0, 2, 3,
      // upperArm
      4, 5, 6,
      4, 6, 7,
      // lowerArm
      8, 9, 10,
      8, 10, 11,
      // head
      12, 13, 14,
      12, 14, 15,
      // mouth
      16, 17, 18,
      16, 18, 19,
      // hair2
      20, 21, 22,
      20, 22, 23,
      // body
      24, 25, 26,
      24, 26, 27,
      // hand
      28, 29, 30,
      28, 30, 31,
    ];

    this.textures = [
      {
        name: 'sampler',
        src: './img/character.png',
      },
    ];

    this.usesFrameBuffer = true;
    this.clearColor = null;
  }

  updateVertexAttributes() {
    const gl = this.context;

    // bones
    // 0: body
    // 1: upperArm
    // 2: lowerArm
    // 3: hand
    // 4: head
    // 5: hair
    // 6: hair2

    // hair2
    // upperArm
    // body
    // head
    // hair
    // lowerArm
    // hand

    this.vertexAttributes = [
      {
        name: 'position',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: false,
        initialValue: [
          ...BoneData.getVertexPosition('hair2', true, true, false),
          ...BoneData.getVertexPosition('upperArm', true, true, false),
          ...BoneData.getVertexPosition('body', false, true, true),
          ...BoneData.getVertexPosition('head', false, true, true),
          ...BoneData.getVertexPosition('mouth', false, true, true),
          ...BoneData.getVertexPosition('hair1', true, true, false),
          ...BoneData.getVertexPosition('lowerArm', false, true, true),
          ...BoneData.getVertexPosition('hand', false, true, true),
        ],
      },
      {
        name: 'texCoord',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: false,
        initialValue: [
          ...BoneData.getTexcoord('hair2', true, true),
          ...BoneData.getTexcoord('upperArm', true, true),
          ...BoneData.getTexcoord('body', true, true),
          ...BoneData.getTexcoord('head', true, true),
          ...BoneData.getTexcoord('mouth', true, true),
          ...BoneData.getTexcoord('hair1', true, true),
          ...BoneData.getTexcoord('lowerArm', true, true),
          ...BoneData.getTexcoord('hand', true, true),
        ],
      },
      {
        name: 'boneIndices',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: false,
        initialValue: [
          // hair2
          7, 7,
          7, 7,
          7, 7,
          7, 7,
          // upperArm
          1, 1,
          1, 1,
          1, 1,
          1, 1,
          // body
          0, 0,
          0, 0,
          0, 0,
          0, 0,
          // head
          4, 4,
          4, 4,
          4, 4,
          4, 4,
          // mouth
          5, 5,
          5, 5,
          5, 5,
          5, 5,
          // hair1
          6, 6,
          6, 6,
          6, 6,
          6, 6,
          // lowerArm
          2, 2,
          2, 2,
          2, 2,
          2, 2,
          // hand
          3, 3,
          3, 3,
          3, 3,
          3, 3,
        ],
      },
      {
        name: 'boneWeights',
        numComponents: 2,
        type: gl.FLOAT,
        normalize: false,
        dynamic: false,
        initialValue: [
          // hair2
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // upperArm
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // body
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // head
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // mouth
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // hair
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // lowerArm
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          // hand
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
          1.0, 0.0,
        ],
      },
    ];
  }

  setMode(handMode, mouthMode = 0) {
    const gl = this.context;
    BoneData.hand.texcoord = BoneData.hand.texcoords[handMode];
    BoneData.mouth.texcoord = BoneData.mouth.texcoords[mouthMode];

    gl.bindVertexArray(this.vertexArrayObj);
    this.vertexAttributes[1].initialValue.splice(
      8 * 4,
      8,
      ...BoneData.getTexcoord('mouth', true, true),
    );
    this.vertexAttributes[1].initialValue.splice(
      8 * 7,
      8,
      ...BoneData.getTexcoord('hand', true, true),
    );
    this.generateVertexData();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  // Return fingerPos
  setRandomPose() {
    // hand, mouth, fingerPos[2]
    const poses = [
      [0, 0, 105, 95],
      [0, 1, 105, 95],
      [0, 3, 105, 95],
      [1, 1, 300, 250],
      [1, 1, 300, 250],
      [1, 3, 300, 250],
      [2, 1, 135, 0],
      [2, 2, 135, 0],
      [2, 2, 135, 0],
      [3, 1, 460, 126],
      [3, 1, 460, 126],
      [3, 3, 460, 126],
    ];
    const n = Math.floor(Math.random() * poses.length);
    const pose = poses[n];
    this.setMode(pose[0], pose[1]);

    return [pose[2], pose[3]];
  }

  resize() {
    const size = 1024;
    super.resize(size, size);

    const scale = 2.0 / size;

    this.setUniform('screenScale', [scale, scale]);
  }
}
