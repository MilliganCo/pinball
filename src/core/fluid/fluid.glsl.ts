/**
 * GLSL шейдеры для shallow-water жидкости
 */

export const fluidVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fluidFragmentShader = `
uniform sampler2D heightMap;
uniform float cellSize;
uniform float waterHeight;
uniform vec3 waterColor;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  float h = texture2D(heightMap, vUv).r;
  float depth = max(0.0, h - vPosition.y);
  
  vec3 color = waterColor;
  color.rgb *= 0.7 + 0.3 * depth;
  
  gl_FragColor = vec4(color, 0.8);
}
`;

export const fluidComputeShader = `
uniform float dt;
uniform float gravity;
uniform float damping;
uniform float cellSize;
uniform sampler2D heightIn;
uniform sampler2D velocityXIn;
uniform sampler2D velocityYIn;

varying vec2 vUv;

vec2 sampleTexture(sampler2D tex, vec2 uv) {
  return texture2D(tex, uv).rg;
}

void main() {
  vec2 uv = vUv;
  float h = texture2D(heightIn, uv).r;
  float u = texture2D(velocityXIn, uv).r;
  float v = texture2D(velocityYIn, uv).r;
  
  // Advection
  vec2 prevPos = uv - vec2(u, v) * dt / cellSize;
  float hNew = texture2D(heightIn, prevPos).r;
  
  // Pressure gradient
  float hRight = texture2D(heightIn, uv + vec2(1.0/256.0, 0.0)).r;
  float hLeft = texture2D(heightIn, uv - vec2(1.0/256.0, 0.0)).r;
  float hUp = texture2D(heightIn, uv + vec2(0.0, 1.0/256.0)).r;
  float hDown = texture2D(heightIn, uv - vec2(0.0, 1.0/256.0)).r;
  
  float px = (hRight - hLeft) / (2.0 * cellSize);
  float py = (hUp - hDown) / (2.0 * cellSize);
  
  float uNew = u - gravity * px * dt;
  float vNew = v - gravity * py * dt;
  
  gl_FragColor = vec4(hNew, uNew * damping, vNew * damping, 1.0);
}
`;

