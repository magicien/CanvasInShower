const texSize = 2048;

const BoneData = {
  getPosition: (parent, child, rotated = false) => {
    const data = BoneData[parent];
    const parentPos = data.root;
    const childPos = data[child];
    const sign = rotated ? -1 : 1;

    return [
      (childPos[0] - parentPos[0]) * sign,
      (childPos[1] - parentPos[1]) * sign, // FIXME: flip sign
    ];
  },
  getTexcoord: (bone, flipX = false, flipY = false) => {
    const [uv0, uv1, uv2, uv3] = BoneData[bone].texcoord;

    let x0;
    let y0;
    let x1;
    let y1;
    if (flipX) {
      x0 = uv2;
      x1 = uv0;
    } else {
      x0 = uv0;
      x1 = uv2;
    }

    if (flipY) {
      y0 = uv3;
      y1 = uv1;
    } else {
      y0 = uv1;
      y1 = uv3;
    }

    return [
      x0, y0,
      x1, y0,
      x1, y1,
      x0, y1,
    ];
  },
  getVertexPosition: (bone, flipX = false, flipY = false, flipSignY = false) => {
    const data = BoneData[bone];
    const [uv0, uv1, uv2, uv3] = data.texcoord;
    const { root } = data;

    let x0;
    let y0;
    let x1;
    let y1;
    if (flipX) {
      x0 = uv2;
      x1 = uv0;
    } else {
      x0 = uv0;
      x1 = uv2;
    }
    x0 = x0 * texSize - root[0];
    x1 = x1 * texSize - root[0];

    if (flipY) {
      y0 = uv3;
      y1 = uv1;
    } else {
      y0 = uv1;
      y1 = uv3;
    }
    const ysign = flipSignY ? -1 : 1;
    y0 = (y0 * texSize - root[1]) * ysign;
    y1 = (y1 * texSize - root[1]) * ysign;

    return [
      x0, y0,
      x1, y0,
      x1, y1,
      x0, y1,
    ];
  },
  root: {
    root: [0, 0],
    body: [-550, 580],
  },
  body: {
    root: [256, 1024],
    upperArm: [461 - 50, 332 - 20], // FIXME: Move upperArm
    head: [230, -50],
    texcoord: [0, 0, 0.25, 0.5],
  },
  upperArm: {
    root: [243, 1186],
    lowerArm: [243, 1869],
    texcoord: [0, 0.5, 0.25, 1.0],
  },
  lowerArm: {
    root: [775, 1839],
    hand: [755, 1373],
    texcoord: [0.25, 0.5, 0.5, 1.0],
  },
  hand: {
    root: [1300, 1479],
    finger: [1216, 1080],
    texcoord: [0.5, 0.5, 0.75, 0.75],
    texcoords: [
      [0.5, 0.5, 0.75, 0.75],
      [0.75, 0.5, 1.0, 0.75],
      [0.5, 0.75, 0.75, 1.0],
      [0.75, 0.75, 1.0, 1.0],
    ],
  },
  head: {
    root: [1840, 850],
    mouth: [1872 + 90, 910 - 15],
    hair1: [2110, 610],
    hair2: [2020, 660],
    texcoord: [0.75, 0.25, 1.0, 0.5],
  },
  mouth: {
    root: [1664, 128],
    texcoord: [0.75, 0, 0.875, 0.125],
    texcoords: [
      [0.75, 0, 0.875, 0.125],
      [0.875, 0, 1.0, 0.125],
      [0.75, 0.125, 0.875, 0.25],
      [0.875, 0.125, 1.0, 0.25],
    ],
  },
  hair1: {
    root: [1080, 560],
    texcoord: [0.5, 0.25, 0.625, 0.5],
  },
  hair2: {
    root: [1372, 560],
    texcoord: [0.625, 0.25, 0.75, 0.5],
  },
};

export default BoneData;
