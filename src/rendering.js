import { NodeCircleProgram } from "sigma/rendering";

const GRADIENT_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;

uniform float u_correctionRatio;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float border = u_correctionRatio * 2.0;
  float dist = length(v_diffVector) - v_radius + border;

  #ifdef PICKING_MODE
  if (dist > border)
    gl_FragColor = transparent;
  else
    gl_FragColor = v_color;
  #else
  float alpha = 0.0;
  if (dist > border)
    alpha = 1.0;
  else if (dist > 0.0)
    alpha = dist / border;

  vec2 p = v_diffVector / max(v_radius, 0.0001);
  float diagonal = clamp((p.x - p.y + 1.3) / 2.6, 0.0, 1.0);
  float radial = clamp(length(p), 0.0, 1.0);
  float highlight = pow(max(0.0, 1.0 - length(p - vec2(-0.32, 0.34))), 2.2);

  vec3 lightTone = mix(v_color.rgb, vec3(1.0), 0.34);
  vec3 deepTone = v_color.rgb * 0.72;
  vec3 gradientColor = mix(lightTone, deepTone, diagonal * 0.72 + radial * 0.18);
  gradientColor += highlight * 0.16;

  float rim = smoothstep(0.70, 0.96, radial);
  gradientColor = mix(gradientColor, v_color.rgb * 0.58, rim * 0.55);
  gl_FragColor = mix(vec4(gradientColor, v_color.a), transparent, alpha);
  #endif
}
`;

export class NodeGradientProgram extends NodeCircleProgram {
  getDefinition() {
    return {
      ...super.getDefinition(),
      FRAGMENT_SHADER_SOURCE: GRADIENT_FRAGMENT_SHADER,
    };
  }
}

// Constellation V1 shading: a bright core with a soft halo that fades out,
// so dense regions read as glowing particle clouds.
const GLOW_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;

uniform float u_correctionRatio;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float d = length(v_diffVector) / max(v_radius, 0.0001);

  #ifdef PICKING_MODE
  if (d > 0.55)
    gl_FragColor = transparent;
  else
    gl_FragColor = v_color;
  #else
  if (d > 1.0) {
    gl_FragColor = transparent;
    return;
  }
  // Dark themes mark colours with alpha just under 1: there the glow adds
  // light, so overlapping particles brighten instead of hiding each other.
  bool additive = v_color.a < 0.99;
  float core = 1.0 - smoothstep(0.24, 0.4, d);
  float halo = pow(1.0 - d, 2.4) * 0.45;
  float hot = 1.0 - smoothstep(0.0, 0.2, d);
  vec3 color = mix(v_color.rgb, vec3(1.0), hot * 0.5);
  float alpha = clamp(core + halo, 0.0, 1.0);
  gl_FragColor = additive ? vec4(color * alpha * 0.8, alpha * 0.55) : vec4(color * alpha, alpha);
  #endif
}
`;

export class NodeGlowProgram extends NodeCircleProgram {
  getDefinition() {
    return {
      ...super.getDefinition(),
      FRAGMENT_SHADER_SOURCE: GLOW_FRAGMENT_SHADER,
    };
  }
}
