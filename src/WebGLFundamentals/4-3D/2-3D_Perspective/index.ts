import vertexShaderSource from "./shaders/vertex.vs.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.fs.glsl?raw";
import { createProgram, createShader } from "./utils/webgl-utils";
import { createControllers, parameters } from "./gui";
import { setFGeometry } from "./geometry";
import m4 from "./utils/m4";
import { setColors } from "./colors";
/**
 * Canvas
 */
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const updateCanvasSize = () => {
  const { clientHeight, clientWidth } = canvas;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  canvas.width = (clientWidth * pixelRatio) | 0;
  canvas.height = (clientHeight * pixelRatio) | 0;
};
updateCanvasSize();

/**
 * WebGL Rendering Context
 */
const gl = canvas.getContext("webgl") as WebGLRenderingContext;
if (!gl) {
  throw new Error("webgl not supported");
}

/**
 * Shaders
 */
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

/**
 * Program
 */
const program = createProgram(gl, vertexShader, fragmentShader);

/**
 * Position Attribute Location
 */
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const { depth, height, width, thicknessOfRung } = parameters;
setFGeometry(gl, 0, 0, 0, width, height, depth, thicknessOfRung);

/**
 * Color Attribute Location
 */
const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
const noOfVertices = 16 * 2 * 3;
setColors(gl, noOfVertices);

/**
 * Matrix Uniforms Location
 */
const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

/**
 * FudgeFactor Uniform Location
 */
const fudgeFactorUniformLocation = gl.getUniformLocation(
  program,
  "u_fudgeFactor"
);
const fudgeFactor = 1;

const drawScene = (gl: WebGLRenderingContext) => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  // clear canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // only front face draws
  gl.enable(gl.CULL_FACE);
  // enable depth buffer
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);

  // Position
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // Color
  gl.enableVertexAttribArray(colorAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(
    colorAttributeLocation,
    3,
    gl.UNSIGNED_BYTE,
    true,
    0,
    0
  );

  // Parameters
  const {
    translate: { tx, ty, tz },
    scale: { sx, sy, sz },
    rotate: { rx, ry, rz },
    fov,
  } = parameters;

  // FudgeFactor
  // gl.uniform1f(fudgeFactorUniformLocation, fudgeFactor);

  // Matrix
  // let matrix = m4.makeZToMatrix(fudgeFactor);
  // matrix = m4.multiply(matrix, m4.projection(canvas.width, canvas.height, 400));

  const aspect = canvas.clientWidth / canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;
  let matrix = m4.perspective(fov, aspect, zNear, zFar);
  matrix = m4.translate(matrix, tx, ty, tz);
  matrix = m4.xRotate(matrix, rx + 180);
  matrix = m4.yRotate(matrix, ry);
  matrix = m4.zRotate(matrix, rz);
  matrix = m4.translate(matrix, -50, -75, 0);
  matrix = m4.scale(matrix, sx, sy, sz);
  // matrix = m4.yShear(matrix, 0.5);
  // matrix = m4.xShear(matrix, 0.5);
  matrix = m4.zShear(matrix, 0.5);
  gl.uniformMatrix4fv(matrixUniformLocation, false, m4.mat4x4To1x16(matrix));

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 2 * 3);
};

createControllers(gl, drawScene);

drawScene(gl);
