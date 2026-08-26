"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PetrobrasLogo } from "@/components/PetrobrasLogo";

type EquipmentData = {
  id: string;
  name: string;
  area: string;
  status: string;
  pressureBar: number;
  temperatureC: number;
  vibrationMmS: number;
  flowRateM3h: number;
  depthM: number;
  classification: string;
  lastUpdate: string;
};

type Props = {
  authorized: boolean;
  equipment: EquipmentData | null;
  busy?: boolean;
  onScan: () => void | Promise<unknown>;
  user?: string;
  deviceId?: string;
};

type Mat4 = Float32Array;

type Mesh = {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  index: WebGLBuffer;
  count: number;
};

type DrawItem = {
  mesh: "cube" | "cylinder";
  model: Mat4;
  color: [number, number, number, number];
  emissive?: number;
};

function identity(): Mat4 {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

function multiply(a: ArrayLike<number>, b: ArrayLike<number>): Mat4 {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function translation(x: number, y: number, z: number): Mat4 {
  const out = identity();
  out[12] = x; out[13] = y; out[14] = z;
  return out;
}

function scale(x: number, y: number, z: number): Mat4 {
  const out = identity();
  out[0] = x; out[5] = y; out[10] = z;
  return out;
}

function rotationX(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}

function rotationY(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}

function rotationZ(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}

function modelMatrix(
  x: number, y: number, z: number,
  sx: number, sy: number, sz: number,
  rx = 0, ry = 0, rz = 0,
): Mat4 {
  const rotation = multiply(rotationY(ry), multiply(rotationX(rx), rotationZ(rz)));
  return multiply(translation(x,y,z), multiply(rotation, scale(sx,sy,sz)));
}

function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,0,0,0,
    0,f,0,0,
    0,0,(far + near) * nf,-1,
    0,0,(2 * far * near) * nf,0,
  ]);
}

function viewFromCamera(x: number, y: number, z: number, yaw: number, pitch: number): Mat4 {
  return multiply(rotationX(-pitch), multiply(rotationY(-yaw), translation(-x,-y,-z)));
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Falha ao criar shader WebGL.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "Falha ao compilar shader.";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Falha ao criar programa WebGL.");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Falha ao vincular programa WebGL.");
  }
  return program;
}

function createCubeMesh(gl: WebGLRenderingContext): Mesh {
  const positions = new Float32Array([
    // front
    -0.5,-0.5,0.5,  0.5,-0.5,0.5,  0.5,0.5,0.5,  -0.5,0.5,0.5,
    // back
    0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5,
    // top
    -0.5,0.5,0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5, -0.5,0.5,-0.5,
    // bottom
    -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5,
    // right
    0.5,-0.5,0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5,
    // left
    -0.5,-0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,0.5,-0.5,
  ]);
  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
  ]);
  const indices = new Uint16Array([
    0,1,2, 0,2,3,
    4,5,6, 4,6,7,
    8,9,10, 8,10,11,
    12,13,14, 12,14,15,
    16,17,18, 16,18,19,
    20,21,22, 20,22,23,
  ]);
  return uploadMesh(gl, positions, normals, indices);
}

function createCylinderMesh(gl: WebGLRenderingContext, segments = 18): Mesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    positions.push(c * 0.5, -0.5, s * 0.5, c * 0.5, 0.5, s * 0.5);
    normals.push(c,0,s, c,0,s);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a,b,c, b,d,c);
  }

  const bottomCenter = positions.length / 3;
  positions.push(0,-0.5,0); normals.push(0,-1,0);
  const topCenter = positions.length / 3;
  positions.push(0,0.5,0); normals.push(0,1,0);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(bottomCenter, next * 2, i * 2);
    indices.push(topCenter, i * 2 + 1, next * 2 + 1);
  }

  return uploadMesh(gl, new Float32Array(positions), new Float32Array(normals), new Uint16Array(indices));
}

function uploadMesh(gl: WebGLRenderingContext, positions: Float32Array, normals: Float32Array, indices: Uint16Array): Mesh {
  const position = gl.createBuffer();
  const normal = gl.createBuffer();
  const index = gl.createBuffer();
  if (!position || !normal || !index) throw new Error("Falha ao criar buffers WebGL.");
  gl.bindBuffer(gl.ARRAY_BUFFER, position); gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normal); gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return { position, normal, index, count: indices.length };
}

function buildEnvironment(time: number, scanPulse: number): DrawItem[] {
  const items: DrawItem[] = [];
  const push = (mesh: DrawItem["mesh"], model: Mat4, color: DrawItem["color"], emissive = 0) => items.push({ mesh, model, color, emissive });

  // Ocean floor and depth layers.
  push("cube", modelMatrix(0,-0.52,-8, 22,0.18,28, 0,0,0), [0.035,0.12,0.13,1]);
  for (let i = 0; i < 12; i++) {
    const x = -8 + ((i * 2.17) % 16);
    const z = -4.5 - ((i * 3.11) % 14);
    const s = 0.3 + (i % 4) * 0.12;
    push("cube", modelMatrix(x,-0.22,z, s*1.6,s*0.55,s, 0.1,(i*0.7)%Math.PI,0.1), [0.055,0.16,0.15,1]);
  }

  // Main flowlines.
  push("cylinder", modelMatrix(-3.95,0.28,-5.2, 0.22,4.2,0.22, 0,0,Math.PI/2), [0.17,0.28,0.31,1]);
  push("cylinder", modelMatrix(3.9,0.28,-5.2, 0.22,4.4,0.22, 0,0,Math.PI/2), [0.17,0.28,0.31,1]);
  [ -2.2, 2.2 ].forEach((x) => push("cylinder", modelMatrix(x,0.28,-5.2, 0.34,0.13,0.34), [0.96,0.63,0.05,1], 0.35));

  // Skid frame around P-101.
  const fx = 0, fz = -5.25;
  push("cube", modelMatrix(fx,-0.02,fz, 3.45,0.18,2.65), [0.12,0.22,0.24,1]);
  const frameColor: DrawItem["color"] = [0.15,0.34,0.34,1];
  [ -1.55, 1.55 ].forEach((x) => {
    push("cube", modelMatrix(x,1.15,fz-1.12, 0.14,2.55,0.14), frameColor);
    push("cube", modelMatrix(x,1.15,fz+1.12, 0.14,2.55,0.14), frameColor);
  });
  [ -1.12, 1.12 ].forEach((z) => {
    push("cube", modelMatrix(0,2.35,fz+z, 3.25,0.14,0.14), frameColor);
    push("cube", modelMatrix(0,0.06,fz+z, 3.25,0.14,0.14), frameColor);
  });
  push("cube", modelMatrix(0,2.35,fz, 0.16,0.16,2.25), frameColor);

  // Pump body with more rounded looking cylinders.
  push("cylinder", modelMatrix(0,0.96,fz, 1.5,1.7,1.5, 0,0,Math.PI/2), [0.0,0.33,0.24,1]);
  push("cylinder", modelMatrix(0,0.96,fz+0.78, 0.78,0.16,0.78, Math.PI/2,0,0), [0.95,0.60,0.04,1], 0.75);
  push("cylinder", modelMatrix(0,0.96,fz+0.88, 0.52,0.18,0.52, Math.PI/2,0,0), [0.02,0.10,0.15,1]);
  push("cube", modelMatrix(0,1.85,fz, 0.72,0.42,0.72), [0.42,0.38,0.10,1]);
  push("cube", modelMatrix(0,2.13,fz, 0.94,0.10,0.94), [0.97,0.67,0.05,1], 0.55);

  // Inlet/outlet.
  push("cylinder", modelMatrix(-1.68,0.82,fz, 0.42,1.8,0.42, 0,0,Math.PI/2), [0.18,0.31,0.33,1]);
  push("cylinder", modelMatrix(1.68,0.82,fz, 0.42,1.8,0.42, 0,0,Math.PI/2), [0.18,0.31,0.33,1]);
  [ -1.0, 1.0 ].forEach((x) => push("cylinder", modelMatrix(x,0.82,fz, 0.55,0.13,0.55), [0.96,0.64,0.05,1], 0.35));

  // Instrumentation pods.
  [-1.12, 1.12].forEach((x, i) => {
    push("cube", modelMatrix(x,1.75,fz+0.62, 0.36,0.52,0.36), [0.02,0.40,0.31,1]);
    push("cube", modelMatrix(x,2.08,fz+0.62, 0.20,0.10,0.20), [0.95,0.66,0.04,1], 0.65);
    const blink = 0.55 + Math.sin(time*2.8 + i) * 0.25;
    push("cube", modelMatrix(x,1.75,fz+0.83, 0.08,0.08,0.05), [0.18,0.92,0.62,1], blink);
  });

  // Riser tree on the right.
  push("cylinder", modelMatrix(4.15,1.45,-6.6, 0.38,3.2,0.38), [0.19,0.31,0.34,1]);
  [0.75,1.65,2.45].forEach((y, i) => push("cylinder", modelMatrix(4.15,y,-6.6, 0.62,0.16,0.62), [0.96,0.62,0.04,1], i === 1 ? 0.4 : 0.2));

  // Distant modules / artificial silhouette to create scale.
  for (let i = 0; i < 7; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (5.8 + (i % 3) * 1.5);
    const z = -10 - i * 1.9;
    push("cube", modelMatrix(x,0.85,z, 1.3,1.7,1.1), [0.035,0.13,0.16,1]);
    push("cube", modelMatrix(x,1.95,z, 1.9,0.12,1.5), [0.07,0.22,0.24,1]);
    push("cube", modelMatrix(x,2.55,z, 0.13,1.2,0.13), [0.09,0.28,0.29,1]);
    const light = 0.35 + Math.sin(time*1.8 + i) * 0.2;
    push("cube", modelMatrix(x,2.75,z+0.55, 0.10,0.10,0.05), [0.20,0.74,0.90,1], light);
  }

  // ROV hovering in the far left.
  const rovY = 2.15 + Math.sin(time * 0.55) * 0.14;
  push("cube", modelMatrix(-5.2,rovY,-8.2, 0.95,0.50,0.75, 0,0.2,0), [0.72,0.54,0.07,1]);
  push("cylinder", modelMatrix(-5.75,rovY,-8.2, 0.28,0.34,0.28, 0,0,Math.PI/2), [0.07,0.18,0.22,1]);
  push("cylinder", modelMatrix(-4.65,rovY,-8.2, 0.28,0.34,0.28, 0,0,Math.PI/2), [0.07,0.18,0.22,1]);
  push("cube", modelMatrix(-5.2,rovY,-7.78, 0.16,0.16,0.06), [0.25,0.85,1,1], 1.4);

  // Scan brackets / pulse around P-101 when user scans.
  if (scanPulse > 0.001) {
    const pulse = 1 + scanPulse * 0.6;
    const alpha = Math.min(1, scanPulse * 1.5);
    const c: DrawItem["color"] = [0.07,0.93,0.67,alpha];
    push("cube", modelMatrix(-1.72,1.18,fz+1.38, 0.08,2.55*pulse,0.08), c, 1.5);
    push("cube", modelMatrix(1.72,1.18,fz+1.38, 0.08,2.55*pulse,0.08), c, 1.5);
    push("cube", modelMatrix(0,2.42,fz+1.38, 3.5*pulse,0.08,0.08), c, 1.5);
    push("cube", modelMatrix(0,-0.02,fz+1.38, 3.5*pulse,0.08,0.08), c, 1.5);
  }

  return items;
}

export function SubseaImmersiveScene({ authorized, equipment, busy, onScan, user, deviceId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const cameraOffsetRef = useRef({ x: 0, z: 0 });
  const keysRef = useRef(new Set<string>());
  const scanTimeRef = useRef(0);
  const lastEquipmentIdRef = useRef<string | null>(null);
  const [rendererError, setRendererError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [scanLabel, setScanLabel] = useState("APONTE PARA O MÓDULO E SOLICITE DADOS");

  const sensorState = useMemo(() => ({
    current: "0.28 m/s",
    seawater: "4.2 °C",
    ambient: "182.4 bar",
    visibility: "8.7 m",
  }), []);

  useEffect(() => {
    if (equipment && equipment.id !== lastEquipmentIdRef.current) {
      lastEquipmentIdRef.current = equipment.id;
      scanTimeRef.current = 1;
      setScanLabel("DADOS AUTORIZADOS • TELEMETRIA LIBERADA");
      const timer = window.setTimeout(() => setScanLabel("P-101 EM MONITORAMENTO SEGURO"), 2600);
      return () => window.clearTimeout(timer);
    }
  }, [equipment]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement: HTMLCanvasElement = canvas;
    const glContext = canvasElement.getContext("webgl", { antialias: true, alpha: false, depth: true }) as WebGLRenderingContext | null;
    if (!glContext) { setRendererError("WebGL não está disponível neste navegador."); return; }
    const gl: WebGLRenderingContext = glContext;

    let stopped = false;
    let raf = 0;
    let last = performance.now();

    try {
      const program = createProgram(gl,
        `attribute vec3 a_position;
         attribute vec3 a_normal;
         uniform mat4 u_projection;
         uniform mat4 u_view;
         uniform mat4 u_model;
         varying vec3 v_world;
         varying vec3 v_normal;
         void main(){
           vec4 world = u_model * vec4(a_position,1.0);
           v_world = world.xyz;
           v_normal = normalize((u_model * vec4(a_normal,0.0)).xyz);
           gl_Position = u_projection * u_view * world;
         }`,
        `precision mediump float;
         varying vec3 v_world;
         varying vec3 v_normal;
         uniform vec4 u_color;
         uniform vec3 u_camera;
         uniform float u_time;
         uniform float u_emissive;
         void main(){
           vec3 n = normalize(v_normal);
           vec3 lightDir = normalize(vec3(-0.35,0.8,0.45));
           float diffuse = max(dot(n, lightDir), 0.0);
           vec3 viewDir = normalize(u_camera - v_world);
           float rim = pow(1.0 - max(dot(n, viewDir),0.0), 2.2);
           vec3 pointPos = vec3(0.0,2.4,-3.0);
           vec3 toPoint = pointPos - v_world;
           float dist = max(length(toPoint),0.01);
           float point = max(dot(n, normalize(toPoint)),0.0) * (4.0/(1.0+dist*dist));
           float depth = clamp((-v_world.z - 2.0) / 18.0, 0.0, 1.0);
           vec3 lit = u_color.rgb * (0.20 + diffuse*0.58 + point*0.52);
           lit += vec3(0.02,0.20,0.23) * rim * 0.48;
           lit += u_color.rgb * u_emissive;
           vec3 fog = vec3(0.005,0.055,0.085);
           float fogAmount = clamp(depth*depth*0.78,0.0,0.84);
           vec3 finalColor = mix(lit, fog, fogAmount);
           gl_FragColor = vec4(finalColor, u_color.a);
         }`
      );

      const cube = createCubeMesh(gl);
      const cylinder = createCylinderMesh(gl, 22);
      const meshes = { cube, cylinder };

      const aPosition = gl.getAttribLocation(program, "a_position");
      const aNormal = gl.getAttribLocation(program, "a_normal");
      const uProjection = gl.getUniformLocation(program, "u_projection");
      const uView = gl.getUniformLocation(program, "u_view");
      const uModel = gl.getUniformLocation(program, "u_model");
      const uColor = gl.getUniformLocation(program, "u_color");
      const uCamera = gl.getUniformLocation(program, "u_camera");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uEmissive = gl.getUniformLocation(program, "u_emissive");

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      function resize() {
        const rect = canvasElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvasElement.width !== width || canvasElement.height !== height) { canvasElement.width = width; canvasElement.height = height; }
      }

      function draw(item: DrawItem, projection: Mat4, view: Mat4, camera: [number,number,number], time: number) {
        const mesh = meshes[item.mesh];
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal);
        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
        gl.uniformMatrix4fv(uProjection, false, projection);
        gl.uniformMatrix4fv(uView, false, view);
        gl.uniformMatrix4fv(uModel, false, item.model);
        gl.uniform4fv(uColor, item.color);
        gl.uniform3f(uCamera, camera[0], camera[1], camera[2]);
        gl.uniform1f(uTime, time);
        gl.uniform1f(uEmissive, item.emissive || 0);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      }

      function render(now: number) {
        if (stopped) return;
        resize();
        const dt = Math.min(0.04, Math.max(0, (now - last) / 1000));
        last = now;
        const t = now / 1000;

        const speed = 1.25 * dt;
        const keys = keysRef.current;
        if (keys.has("a") || keys.has("arrowleft")) cameraOffsetRef.current.x -= speed;
        if (keys.has("d") || keys.has("arrowright")) cameraOffsetRef.current.x += speed;
        if (keys.has("w") || keys.has("arrowup")) cameraOffsetRef.current.z -= speed;
        if (keys.has("s") || keys.has("arrowdown")) cameraOffsetRef.current.z += speed;
        cameraOffsetRef.current.x = Math.max(-1.7, Math.min(1.7, cameraOffsetRef.current.x));
        cameraOffsetRef.current.z = Math.max(-1.0, Math.min(1.3, cameraOffsetRef.current.z));

        scanTimeRef.current = Math.max(0, scanTimeRef.current - dt * 0.55);

        const pointer = pointerRef.current;
        const yaw = pointer.x * 0.10 + cameraOffsetRef.current.x * 0.025;
        const pitch = -pointer.y * 0.055;
        const camera: [number,number,number] = [cameraOffsetRef.current.x * 0.35, 1.68, 1.15 + cameraOffsetRef.current.z * 0.42];
        const projection = perspective(66 * Math.PI / 180, canvasElement.width / canvasElement.height, 0.05, 45);
        const view = viewFromCamera(camera[0], camera[1], camera[2], yaw, pitch);

        gl.viewport(0,0,canvasElement.width,canvasElement.height);
        gl.clearColor(0.002,0.025,0.045,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        const items = buildEnvironment(t, scanTimeRef.current);
        for (const item of items) draw(item, projection, view, camera, t);

        raf = requestAnimationFrame(render);
      }
      raf = requestAnimationFrame(render);
    } catch (err) {
      setRendererError(err instanceof Error ? err.message : "Falha ao iniciar o renderer 3D.");
    }

    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, []);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const handlePointerLeave = () => { pointerRef.current = { x: 0, y: 0 }; };

  const performScan = async () => {
    if (!authorized || busy) return;
    scanTimeRef.current = 1;
    setScanLabel("SCANNING • VALIDANDO RBAC E DEVICE TRUST...");
    await onScan();
  };

  const handleCanvasScan = async () => {
    const p = pointerRef.current;
    if (Math.abs(p.x) > 0.46 || Math.abs(p.y) > 0.48) {
      setScanLabel("MOVA O RETÍCULO PARA O P-101");
      return;
    }
    await performScan();
  };

  const toggleFullscreen = async () => {
    const host = rootRef.current;
    if (!host) return;
    if (!document.fullscreenElement) {
      await host.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  return (
    <div ref={rootRef} className="subseaImmersive" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <canvas ref={canvasRef} className="subseaWebgl" onClick={handleCanvasScan} aria-label="Cenário submarino 3D interativo" />
      <div className="subseaWaterFx" aria-hidden="true"><i/><i/><i/></div>
      <div className="subseaCaustics" aria-hidden="true" />
      <div className="subseaParticleLayer" aria-hidden="true">
        {Array.from({ length: 26 }).map((_,i)=><span key={i} style={{
          left: `${(i*37)%100}%`, top: `${(i*23)%100}%`,
          animationDelay: `${-(i%11)*0.7}s`, animationDuration: `${7+(i%7)}s`,
          width: `${2+(i%4)}px`, height: `${2+(i%4)}px`
        }} />)}
      </div>

      <div className="xrVisorFrame" aria-hidden="true"><i/><i/><i/><i/></div>
      <div className="subseaTopHud">
        <div><b>FORTIFY SUBSEA XR</b><small>SISTEMA DE INSPEÇÃO IMERSIVA • SIMULAÇÃO</small></div>
        <div className="subseaPetrobras"><PetrobrasLogo compact /></div>
      </div>

      <div className="subseaCompass" aria-hidden="true"><i/><span>210</span><span>240</span><b>270</b><span>300</span><span>330</span></div>

      <div className="subseaSensors glassPanel">
        <strong>SENSORES</strong>
        <span><i>≈</i><small>CORRENTE</small><b>{sensorState.current}</b></span>
        <span><i>♨</i><small>ÁGUA</small><b>{sensorState.seawater}</b></span>
        <span><i>◉</i><small>PRESSÃO</small><b>{sensorState.ambient}</b></span>
        <span><i>◌</i><small>VISIBILIDADE</small><b>{sensorState.visibility}</b></span>
      </div>

      <div className="subseaStatus glassPanel">
        <span><small>PROFUNDIDADE</small><b>1.820 m</b></span>
        <span><small>INTEGRIDADE</small><b>98%</b><i className="integrityBars">||||||||||</i></span>
        <span><small>COMUNICAÇÃO</small><b className="secureText">● LINK SEGURO</b></span>
        <span><small>DEVICE TRUST</small><b>{authorized ? "● VALIDADO" : "○ AGUARDANDO"}</b></span>
      </div>

      <div className={`subseaTarget ${equipment ? "locked" : ""}`} aria-hidden="true">
        <i/><i/><i/><i/><span>P-101</span><small>{equipment ? "TARGET LOCK • DATA RELEASED" : "TARGET AVAILABLE"}</small>
      </div>

      <button className="subseaMission glassPanel" onClick={performScan} disabled={!authorized || busy}>
        <div className="missionIcon">⌾</div>
        <div><strong>P-101 • INSPEÇÃO EM ANDAMENTO</strong><span>{scanLabel}</span></div>
        <div className={`missionState ${equipment ? "ok" : ""}`}><small>STATUS DO MÓDULO</small><b>{equipment?.status ?? (authorized ? "PRONTO PARA SCAN" : "BLOQUEADO")}</b></div>
      </button>

      <div className="subseaTelemetry glassPanel">
        <div><small>PRESSÃO</small><b>{equipment ? `${equipment.pressureBar} bar` : "—"}</b></div>
        <div><small>TEMP.</small><b>{equipment ? `${equipment.temperatureC} °C` : "—"}</b></div>
        <div><small>VAZÃO</small><b>{equipment ? `${equipment.flowRateM3h} m³/h` : "—"}</b></div>
        <div><small>VIBRAÇÃO</small><b>{equipment ? `${equipment.vibrationMmS} mm/s` : "—"}</b></div>
      </div>

      <div className="subseaRadar glassPanel" aria-hidden="true">
        <div className="radarSweep"/><i/><i/><i/><span>P-101</span>
      </div>

      <div className="subseaActions glassPanel">
        <button type="button" onClick={toggleFullscreen} title="Tela cheia">{fullscreen ? "↙" : "⛶"}</button>
        <span>WASD</span><span>MOUSE</span><span>CLICK SCAN</span>
      </div>

      <div className="subseaIdentity">
        <span>IDENTIDADE <b>{user ? "✓" : "—"}</b></span>
        <span>MFA <b>{authorized ? "✓" : "—"}</b></span>
        <span>DEVICE <b>{deviceId ? "✓" : "—"}</b></span>
        <span>RBAC <b>{equipment ? "✓" : authorized ? "ARMED" : "LOCK"}</b></span>
      </div>

      {rendererError && <div className="subseaRendererError">{rendererError}</div>}
    </div>
  );
}
