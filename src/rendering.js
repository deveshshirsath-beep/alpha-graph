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
