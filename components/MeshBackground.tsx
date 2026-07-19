"use client";

import { useEffect, useRef } from "react";

/* R1 — full-viewport WebGL mesh: two orbiting glows (orange + red) over a
 * near-black void, ported verbatim from the approved prototype shader. */
export default function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vsSrc = `attribute vec2 a_position; varying vec2 v_texCoord;
      void main() { v_texCoord = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;
    const fsSrc = `precision highp float; varying vec2 v_texCoord; uniform float u_time; uniform float u_bg; uniform float u_aspect; uniform vec3 u_primary; uniform vec3 u_secondary; uniform vec3 u_tertiary;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.55;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.05 + 13.7; a *= 0.5; }
        return v;
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 p = vec2(uv.x * u_aspect, uv.y);
        float t = u_time * 0.12;

        /* fluid domain-warp: waves flowing through waves */
        vec2 q = vec2(fbm(p * 1.6 + vec2(t, -t * 0.6)), fbm(p * 1.6 + vec2(-t * 0.8, t)));
        vec2 r = vec2(fbm(p * 1.9 + 3.2 * q + vec2(1.7, 9.2) + t * 0.7),
                      fbm(p * 1.9 + 3.2 * q + vec2(8.3, 2.8) - t * 0.5));
        float f = fbm(p * 2.1 + 3.5 * r);

        /* rolling wave band across the screen */
        float wave = sin(p.x * 2.2 - u_time * 0.35 + f * 4.0) * 0.5 + 0.5;
        float band = smoothstep(0.15, 0.85, 1.0 - abs(uv.y - (0.35 + 0.25 * wave)) * 1.6);

        vec3 base = vec3(u_bg);
        vec3 crimson = u_secondary;
        vec3 orange  = u_primary;
        vec3 amber   = u_tertiary;

        vec3 col = base;
        col = mix(col, crimson, smoothstep(0.25, 0.75, f) * 0.55);
        col = mix(col, orange, smoothstep(0.45, 0.95, f * band + 0.25 * q.x) * 0.5);
        col += amber * pow(max(r.y * band, 0.0), 3.0) * 0.35;

        /* soft vignette */
        float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
        col *= mix(0.75, 1.0, vig);

        gl_FragColor = vec4(col, 1.0);
      }`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uBg = gl.getUniformLocation(prog, "u_bg");
    const uAspect = gl.getUniformLocation(prog, "u_aspect");
    const uPrimary = gl.getUniformLocation(prog, "u_primary");
    const uSecondary = gl.getUniformLocation(prog, "u_secondary");
    const uTertiary = gl.getUniformLocation(prog, "u_tertiary");

    const parseColor = (cssVar: string) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
      const parts = val.split(/[ ,]+/).filter(Boolean).map(Number);
      if (parts.length >= 3 && !parts.some(isNaN)) {
        return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
      }
      return [0, 0, 0];
    };

    let p = [0, 0, 0];
    let s = [0, 0, 0];
    let t = [0, 0, 0];
    let bg = 0.04;

    const updateVariables = () => {
      p = parseColor("--mesh-c1");
      s = parseColor("--mesh-c2");
      t = parseColor("--mesh-c3");
      bg = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mesh-bg")) || 0.04;
    };
    updateVariables();

    const observer = new MutationObserver(updateVariables);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, canvas.width / Math.max(canvas.height, 1));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const frame = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform1f(uBg, bg);

      gl.uniform3f(uPrimary, p[0], p[1], p[2]);
      gl.uniform3f(uSecondary, s[0], s[1], s[2]);
      gl.uniform3f(uTertiary, t[0], t[1], t[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-lowest/90 mix-blend-multiply" />
    </div>
  );
}
