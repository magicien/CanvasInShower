export default class Bone {
  constructor() {
    this.position = [0, 0];
    this.scale = [1, 1];
    this.rotation = 0;
    this.localMatrix = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
    this.worldMatrix = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
    this.parent = null;
  }

  update() {
    this.updateLocalMatrix();
    this.updateWorldMatrix();
  }

  updateLocalMatrix() {
    const sinR = Math.sin(this.rotation);
    const cosR = Math.cos(this.rotation);
    const sx = this.scale[0];
    const sy = this.scale[1];
    this.localMatrix = [
      cosR * sx, -sinR * sx, 0,
      sinR * sy, cosR * sy, 0,
      this.position[0], this.position[1], 1,
    ];
  }

  updateWorldMatrix() {
    if (!this.parent) {
      this.worldMatrix = [...this.localMatrix];
      return;
    }

    const p = this.parent.worldMatrix;
    const l = this.localMatrix;
    this.worldMatrix = [
      l[0] * p[0] + l[1] * p[3] + l[2] * p[6],
      l[0] * p[1] + l[1] * p[4] + l[2] * p[7],
      l[0] * p[2] + l[1] * p[5] + l[2] * p[8],
      l[3] * p[0] + l[4] * p[3] + l[5] * p[6],
      l[3] * p[1] + l[4] * p[4] + l[5] * p[7],
      l[3] * p[2] + l[4] * p[5] + l[5] * p[8],
      l[6] * p[0] + l[7] * p[3] + l[8] * p[6],
      l[6] * p[1] + l[7] * p[4] + l[8] * p[7],
      l[6] * p[2] + l[7] * p[5] + l[8] * p[8],
    ];
  }

  getWorldPosition() {
    return [
      this.worldMatrix[6],
      this.worldMatrix[7],
    ];
  }
}
