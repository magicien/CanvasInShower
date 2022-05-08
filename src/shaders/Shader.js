import { printError } from '../utils';
// attributes
// name, size, type, normalize, (stride, offset,) instance, dynamic

export default class Shader {
  constructor(gl, opts = null) {
    this.context = gl;

    this.program = null;
    this.vertexFunc = '';
    this.fragmentFunc = '';
    this.vertexAttributes = [];
    this.instanceAttributes = [];
    this.uniformAttributes = [];

    this.vertexData = [];
    this.indexData = [];
    this.instanceData = [];

    this.usesFrameBuffer = false;
    this.frameBuffer = null;
    this.frameTexture = null;

    this.usesInstance = false;
    this.instanceBuffer = null;
    this.instanceCount = 0;
    this.totalInstanceComponents = 0;

    this.clearColor = [0, 0, 0, 0];
    this.textures = [];
    this.blendSrc = gl.SRC_ALPHA;
    this.blendDst = gl.ONE_MINUS_SRC_ALPHA;

    this.width = 0;
    this.height = 0;

    this.initialize(opts);
  }

  initialize(opts) {
    this.initializeData(opts);
    this.createProgram();
    this.createBuffers();
    if (this.usesFrameBuffer) {
      this.createFrameBuffer();
    }
    this.initializeAttributes();
    this.createTextures();
    this.bindBuffers();
  }

  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  initializeData(opts) {
    // Initialize vertex and index data in sub classes
  }

  createProgram() {
    const gl = this.context;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, this.vertexFunc);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(vertShader);
      printError('Failed to compile vertex shader: ', log);
      return;
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, this.fragmentFunc);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fragShader);
      printError('Failed to compile fragment shader: ', log);
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      printError('Failed to link program: ', log);
      return;
    }
    this.program = program;
  }

  createBuffers() {
    const gl = this.context;

    this.vertexArrayObj = gl.createVertexArray();
    gl.bindVertexArray(this.vertexArrayObj);

    this.arrayBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    this.usesInstance = this.instanceAttributes.length > 0;
    if (this.usesInstance) {
      this.instanceBuffer = gl.createBuffer();
    }

    gl.bindVertexArray(null);
  }

  bindBuffers() {
    const gl = this.context;

    gl.bindVertexArray(this.vertexArrayObj);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(this.indexData), gl.STATIC_DRAW);

    if (this.usesInstance) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.instanceData), gl.DYNAMIC_DRAW);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  createFrameBuffer() {
    const gl = this.context;

    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

    this.frameTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.frameTexture,
      0,
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  initializeAttributes() {
    const gl = this.context;

    gl.bindVertexArray(this.vertexArrayObj);

    this.generateVertexData();
    this.generateInstanceData();

    gl.bindVertexArray(null);

    // TODO: Rendering settings
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
  }

  createTextures() {
    const gl = this.context;

    gl.useProgram(this.program);
    this.textureObjects = [];
    this.textures.forEach((tex, i) => {
      if (typeof tex.src === 'string') {
        const img = new Image();
        const texture = gl.createTexture();
        img.onload = () => this.setTexture(i, tex.name, texture, img);
        img.src = tex.src;
      } else {
        // TODO: Type check
        this.setTexture(i, tex.name, tex.src);
      }
    });

    gl.activeTexture(gl[`TEXTURE${this.textures.length + 1}`]);
    gl.activeTexture(gl[`TEXTURE${this.textures.length}`]);
  }

  setTexture(index, name, texture, image = null, width = 0, height = 0) {
    const gl = this.context;
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (image instanceof Image) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const loc = gl.getUniformLocation(this.program, name);
    gl.uniform1i(loc, index);
    gl.activeTexture(gl[`TEXTURE${index}`]);

    this.textureObjects[index] = texture;
  }

  generateVertexData() {
    const gl = this.context;

    const data = [];
    const dataLength = this.vertexAttributes[0].initialValue.length;
    const vertexCount = dataLength / this.vertexAttributes[0].numComponents;
    for (let v = 0; v < vertexCount; v += 1) {
      this.vertexAttributes.forEach((attr) => {
        const index = attr.numComponents * v;
        data.push(...attr.initialValue.slice(index, index + attr.numComponents));
      });
    }
    this.vertexData = data;

    let stride = 0;
    this.vertexAttributes.forEach((attr) => {
      // TODO: handle other data sizes
      stride += attr.numComponents * 4;
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBuffer);
    let offset = 0;
    this.vertexAttributes.forEach((attr) => {
      const loc = gl.getAttribLocation(this.program, attr.name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attr.numComponents, attr.type, attr.normalize, stride, offset);
      offset += attr.numComponents * 4;
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  generateInstanceData() {
    if (!this.usesInstance) {
      return;
    }
    const gl = this.context;

    const data = [];
    const dataLength = this.instanceAttributes[0].initialValue.length;
    this.instanceCount = dataLength / this.instanceAttributes[0].numComponents;
    for (let i = 0; i < this.instanceCount; i += 1) {
      this.instanceAttributes.forEach((attr) => {
        const index = attr.numComponents * i;
        data.push(...attr.initialValue.slice(index, index + attr.numComponents));
      });
    }
    this.instanceData = data;

    let stride = 0;
    let totalNumComponents = 0;
    this.instanceAttributes.forEach((attr) => {
      // TODO: handle other data sizes
      stride += attr.numComponents * 4;
      totalNumComponents += attr.numComponents;
    });
    this.totalInstanceComponents = totalNumComponents;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    let offset = 0;
    this.instanceAttributes.forEach((attr) => {
      const loc = gl.getAttribLocation(this.program, attr.name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attr.numComponents, attr.type, attr.normalize, stride, offset);
      offset += attr.numComponents * 4;
      gl.vertexAttribDivisor(loc, 1);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setInstanceData(data) {
    const gl = this.context;

    this.instanceData = data;
    gl.bindVertexArray(this.vertexArrayObj);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    this.instanceCount = Math.floor(data.length / this.totalInstanceComponents);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.resizeFrameBuffer(width, height);
  }

  resizeFrameBuffer(width, height) {
    if (!this.usesFrameBuffer) {
      return;
    }

    const gl = this.context;

    gl.useProgram(this.program);

    gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  draw() {
    const gl = this.context;

    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vertexArrayObj);

    if (this.blendSrc && this.blendDst) {
      gl.enable(gl.BLEND);
      gl.blendFunc(this.blendSrc, this.blendDst);
    } else {
      gl.disable(gl.BLEND);
    }

    if (this.usesFrameBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    }

    if (this.clearColor) {
      gl.clearColor(
        this.clearColor[0],
        this.clearColor[1],
        this.clearColor[2],
        this.clearColor[3],
      );
      // TODO: Depth
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.textureObjects.forEach((tex, i) => {
      gl.activeTexture(gl[`TEXTURE${i}`]);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    });

    const dataLength = this.indexData.length;
    if (this.usesInstance) {
      gl.drawElementsInstanced(gl.TRIANGLES, dataLength, gl.UNSIGNED_SHORT, 0, this.instanceCount);
    } else {
      gl.drawElements(gl.TRIANGLES, dataLength, gl.UNSIGNED_SHORT, 0);
    }

    if (this.usesFrameBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.bindVertexArray(null);
  }

  setUniform(name, values, isFloat = true) {
    const gl = this.context;
    const loc = gl.getUniformLocation(this.program, name);
    gl.useProgram(this.program);

    if (isFloat) {
      switch (values.length) {
        case 1:
          gl.uniform1fv(loc, values);
          break;
        case 2:
          gl.uniform2fv(loc, values);
          break;
        case 3:
          gl.uniform3fv(loc, values);
          break;
        case 4:
          gl.uniform4fv(loc, values);
          break;
        default:
          printError('Unsupported uniform data length: ', values.length);
          break;
      }
    } else {
      switch (values.length) {
        case 1:
          gl.uniform1iv(loc, values);
          break;
        case 2:
          gl.uniform2iv(loc, values);
          break;
        case 3:
          gl.uniform3iv(loc, values);
          break;
        case 4:
          gl.uniform4iv(loc, values);
          break;
        default:
          printError('Unsupported uniform data length: ', values.length);
          break;
      }
    }
  }

  setUniformMatrix(name, values) {
    const gl = this.context;
    const loc = gl.getUniformLocation(this.program, name);
    gl.useProgram(this.program);
    gl.uniformMatrix3fv(loc, false, values);
  }

  clearCanvas(r, g, b, a) {
    const gl = this.context;

    if (this.usesFrameBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    }
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.usesFrameBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}
