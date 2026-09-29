// Constellation V1 particles on the GPU. Sigma recomputes every node on the
// CPU when positions change, which is too slow to turn 76K particles every
// frame. Here each particle keeps its disc position (x, y, height) in a buffer
// and the vertex shader turns, tilts and projects it, so a frame only updates
// a few uniforms. Hubs, labels and anything selected stay drawn by sigma.

const VERTEX_SHADER = /* glsl */ `
attribute vec3 a_disc;
attribute vec4 a_color;
attribute float a_size;

uniform float u_angle;
uniform float u_sinE;
uniform float u_cosE;
uniform float u_distance;
uniform vec3 u_affineX;
uniform vec3 u_affineY;
uniform float u_sizeScale;

varying vec4 v_color;

void main() {
  float c = cos(u_angle);
  float s = sin(u_angle);
  float x = a_disc.x * c - a_disc.y * s;
  float depth = a_disc.x * s + a_disc.y * c;
  float scale = u_distance / (u_distance + depth * u_cosE);
  vec2 graph = vec2(x * scale, (depth * u_sinE + a_disc.z * u_cosE) * scale);
  gl_Position = vec4(dot(u_affineX, vec3(graph, 1.0)), dot(u_affineY, vec3(graph, 1.0)), 0.0, 1.0);
  gl_PointSize = max(1.0, a_size * scale * u_sizeScale * 2.0);
  v_color = a_color;
}
`;

// Same look as NodeGlowProgram: a bright core with a soft halo.
const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;
varying vec4 v_color;
uniform float u_additive;

void main() {
  float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
  if (d > 1.0) discard;
  float core = 1.0 - smoothstep(0.24, 0.4, d);
  float halo = pow(1.0 - d, 2.4) * 0.45;
  float hot = 1.0 - smoothstep(0.0, 0.2, d);
  vec3 color = mix(v_color.rgb, vec3(1.0), hot * 0.5);
  float alpha = clamp(core + halo, 0.0, 1.0) * v_color.a;
  gl_FragColor = u_additive > 0.5 ? vec4(color * alpha * 0.8, alpha * 0.55) : vec4(color * alpha, alpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  return shader;
}

/** Parses #rrggbb or rgb()/rgba() into 0–255 channels. */
export function parseColor(color) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color || "");
  if (hex) {
    const value = parseInt(hex[1], 16);
    return [value >> 16, (value >> 8) & 255, value & 255, 255];
  }
  const rgb = /rgba?\(([^)]+)\)/i.exec(color || "");
  if (rgb) {
    const [r, g, b, a = 1] = rgb[1].split(",").map(Number);
    return [r, g, b, Math.round(a * 255)];
  }
  return [114, 181, 255, 255];
}

export class ParticleLayer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error("WebGL is not available");
    this.gl = gl;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
    this.program = program;
    this.buffers = { disc: gl.createBuffer(), color: gl.createBuffer(), size: gl.createBuffer() };
    this.attributes = { disc: gl.getAttribLocation(program, "a_disc"), color: gl.getAttribLocation(program, "a_color"), size: gl.getAttribLocation(program, "a_size") };
    this.uniforms = Object.fromEntries(["u_angle", "u_sinE", "u_cosE", "u_distance", "u_affineX", "u_affineY", "u_sizeScale", "u_additive"].map((name) => [name, gl.getUniformLocation(program, name)]));
    this.count = 0;
  }

  /** @param {{ disc: Float32Array, color: Uint8Array, size: Float32Array, count: number }} data */
  setData({ disc, color, size, count }) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.disc);
    gl.bufferData(gl.ARRAY_BUFFER, disc, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);
    this.count = count;
  }

  /** Sigma only sizes the canvases it owns, so the backing store is matched to the screen here. */
  resize(width, height, pixelRatio) {
    const targetWidth = Math.max(1, Math.round(width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(height * pixelRatio));
    if (this.canvas.width !== targetWidth) this.canvas.width = targetWidth;
    if (this.canvas.height !== targetHeight) this.canvas.height = targetHeight;
  }

  clear() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * @param {{ angle: number, sinE: number, cosE: number, distance: number,
   *   affineX: number[], affineY: number[], sizeScale: number, additive: boolean }} view
   */
  draw(view) {
    const gl = this.gl;
    this.clear();
    if (!this.count) return;
    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    // Colours are premultiplied; in dark themes the shader lowers alpha so the glow adds light.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const bind = (buffer, location, size, type, normalized) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, type, normalized, 0, 0);
    };
    bind(this.buffers.disc, this.attributes.disc, 3, gl.FLOAT, false);
    bind(this.buffers.color, this.attributes.color, 4, gl.UNSIGNED_BYTE, true);
    bind(this.buffers.size, this.attributes.size, 1, gl.FLOAT, false);
    gl.uniform1f(this.uniforms.u_angle, view.angle);
    gl.uniform1f(this.uniforms.u_sinE, view.sinE);
    gl.uniform1f(this.uniforms.u_cosE, view.cosE);
    gl.uniform1f(this.uniforms.u_distance, view.distance);
    gl.uniform3fv(this.uniforms.u_affineX, view.affineX);
    gl.uniform3fv(this.uniforms.u_affineY, view.affineY);
    gl.uniform1f(this.uniforms.u_sizeScale, view.sizeScale);
    gl.uniform1f(this.uniforms.u_additive, view.additive ? 1 : 0);
    gl.drawArrays(gl.POINTS, 0, this.count);
  }
}
