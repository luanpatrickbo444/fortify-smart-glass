"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PetrobrasLogo } from "@/components/PetrobrasLogo";
import { SubseaImmersiveScene } from "@/components/SubseaImmersiveScene";

type Stage = "checking" | "login" | "mfa" | "device" | "ready";

type SessionInfo = {
  user: string;
  deviceId: string;
  permissions: string[];
  expiresAt: number;
};

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

type Mat4 = Float32Array;

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

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Não foi possível criar o shader WebGL.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Erro desconhecido";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Não foi possível criar o programa WebGL.");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Falha ao vincular shaders.");
  }
  return program;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function createPanelCanvas(session: SessionInfo | null, equipment: EquipmentData | null, details: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "rgba(4, 28, 25, .92)";
  drawRoundedRect(ctx, 18, 18, 1164, 604, 34);
  ctx.strokeStyle = "rgba(84, 214, 155, .55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, 1124, 564);

  ctx.fillStyle = "#ffd52f";
  ctx.font = "700 28px Arial";
  ctx.fillText("FORTIFY / SUBSEA SECURE XR", 70, 90);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 46px Arial";
  ctx.fillText(details ? "ATIVO SUBSEA P-101" : "SESSÃO SUBSEA AUTORIZADA", 70, 155);

  ctx.fillStyle = "#7ce3ae";
  ctx.font = "600 24px Arial";
  ctx.fillText(`IDENTIDADE  ✓  ${session?.user ?? "VALIDADA"}`, 70, 220);
  ctx.fillText(`DISPOSITIVO ✓  ${session?.deviceId ?? "FORTIFY-XR"}`, 70, 260);
  ctx.fillText("MFA         ✓  VERIFICADO", 70, 300);
  ctx.fillText("RBAC        ✓  documents.read", 70, 340);

  if (details && equipment) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 30px Arial";
    ctx.fillText(`${equipment.name} • ${equipment.area}`, 650, 220);
    ctx.font = "600 26px Arial";
    ctx.fillText(`STATUS: ${equipment.status}`, 650, 275);
    ctx.fillText(`PRESSÃO: ${equipment.pressureBar} bar`, 650, 320);
    ctx.fillText(`TEMPERATURA: ${equipment.temperatureC} °C`, 650, 365);
    ctx.fillText(`VIBRAÇÃO: ${equipment.vibrationMmS} mm/s`, 650, 410);
    ctx.fillText(`VAZÃO: ${equipment.flowRateM3h} m³/h`, 650, 455);
    ctx.fillStyle = "#ffd52f";
    ctx.font = "700 21px Arial";
    ctx.fillText(`PROFUNDIDADE: ${equipment.depthM} m • ${equipment.classification}`, 650, 500);
  } else {
    ctx.fillStyle = "#dcebe5";
    ctx.font = "500 25px Arial";
    ctx.fillText("Aponte para o módulo submarino e pressione o gatilho", 650, 240);
    ctx.fillText("para alternar os dados autorizados do equipamento.", 650, 282);
    ctx.fillStyle = "#ffd52f";
    ctx.font = "700 22px Arial";
    ctx.fillText("DEMONSTRAÇÃO SUBSEA WEBXR • DADOS SIMULADOS", 650, 350);
  }

  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "500 18px Arial";
  ctx.fillText("Protótipo acadêmico SENAI • Integração demonstrativa • Não representa sistema Petrobras em produção", 70, 570);
  return canvas;
}

export function VRExperience() {
  const [stage, setStage] = useState<Stage>("checking");
  const [user, setUser] = useState("colaborador@fortify.local");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [deviceId, setDeviceId] = useState("FORTIFY-GLASS-001");
  const [preAuthToken, setPreAuthToken] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [message, setMessage] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [xrActive, setXrActive] = useState(false);
  const [notice, setNotice] = useState("");

  const equipmentRef = useRef<EquipmentData | null>(null);
  const sessionRef = useRef<SessionInfo | null>(null);
  const detailsVisibleRef = useRef(false);
  const xrRuntimeRef = useRef<{ session: any; updatePanel: () => void } | null>(null);

  useEffect(() => { equipmentRef.current = equipment; xrRuntimeRef.current?.updatePanel(); }, [equipment]);
  useEffect(() => { sessionRef.current = session; xrRuntimeRef.current?.updatePanel(); }, [session]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/fortify/auth/session", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSession(data);
      setDeviceId(data.deviceId);
      setStage("ready");
    } catch {
      setStage("login");
    }
  }, []);

  useEffect(() => {
    checkSession();
    const saved = localStorage.getItem("fortify_device_id");
    if (saved) setDeviceId(saved);

    const xr = (navigator as any).xr;
    if (!xr?.isSessionSupported) {
      setXrSupported(false);
      return;
    }
    xr.isSessionSupported("immersive-vr").then((supported: boolean) => setXrSupported(supported)).catch(() => setXrSupported(false));
  }, [checkSession]);

  async function submitLogin(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      localStorage.setItem("fortify_device_id", deviceId);
      const res = await fetch("/api/fortify/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password, deviceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no login.");
      setPreAuthToken(data.preAuthToken);
      setStage("mfa");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Falha no login."); }
    finally { setBusy(false); }
  }

  async function submitMfa(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/fortify/auth/mfa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode, preAuthToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no MFA.");
      setMfaToken(data.mfaToken);
      setStage("device");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Falha no MFA."); }
    finally { setBusy(false); }
  }

  async function validateDevice() {
    setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/fortify/device/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, mfaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Dispositivo não autorizado.");
      await checkSession();
    } catch (err) { setNotice(err instanceof Error ? err.message : "Falha na validação do dispositivo."); }
    finally { setBusy(false); }
  }

  const loadEquipment = useCallback(async () => {
    setBusy(true); setNotice("");
    try {
      const res = await fetch("/api/fortify/xr/equipment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: "P-101" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Acesso ao equipamento negado.");
      setEquipment(data.equipment);
      equipmentRef.current = data.equipment;
      detailsVisibleRef.current = true;
      xrRuntimeRef.current?.updatePanel();
      return data.equipment as EquipmentData;
    } catch (err) {
      const text = err instanceof Error ? err.message : "Falha na consulta do equipamento.";
      setNotice(text);
      return null;
    } finally { setBusy(false); }
  }, []);

  async function askAi(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true); setNotice(""); setAiAnswer("");
    try {
      const res = await fetch("/api/fortify/ai/query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Consulta negada.");
      setAiAnswer(data.answer);
    } catch (err) { setNotice(err instanceof Error ? err.message : "Falha na consulta."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/fortify/auth/logout", { method: "POST" });
    if (xrRuntimeRef.current?.session) await xrRuntimeRef.current.session.end().catch(() => {});
    setSession(null); setEquipment(null); setAiAnswer(""); setPassword(""); setMfaCode(""); setStage("login");
  }

  async function startImmersiveVR() {
    if (stage !== "ready") { setNotice("Conclua a autenticação antes de iniciar o modo imersivo."); return; }
    const xr = (navigator as any).xr;
    if (!xr) { setNotice("WebXR não está disponível neste navegador. Use o simulador desktop ou um headset compatível."); return; }
    setNotice("");

    try {
      // Start with the smallest possible WebXR session configuration.
      // Some headset/browser combinations reject a session when optional
      // reference-space features are supplied, even though immersive-vr
      // itself is supported. We request the base session first and then
      // progressively choose the best reference space available.
      const xrSession = await xr.requestSession("immersive-vr");
      setXrActive(true);

      const canvas = document.createElement("canvas");
      canvas.width = 2048; canvas.height = 2048;
      const glContext = canvas.getContext("webgl", {
        xrCompatible: true,
        alpha: false,
        antialias: true
      }) as WebGLRenderingContext | null;
      if (!glContext) throw new Error("WebGL não está disponível.");

      // Keep a permanently non-null WebGL reference for the nested render callbacks.
      // TypeScript does not preserve null narrowing of captured variables across closures.
      const gl: WebGLRenderingContext = glContext;

      if ((gl as any).makeXRCompatible) await (gl as any).makeXRCompatible();

      const XRWebGLLayerCtor = (window as any).XRWebGLLayer;
      if (!XRWebGLLayerCtor) throw new Error("XRWebGLLayer não está disponível neste navegador.");
      const baseLayer = new XRWebGLLayerCtor(xrSession, gl);
      xrSession.updateRenderState({ baseLayer });

      let referenceSpace: any;
      try {
        referenceSpace = await xrSession.requestReferenceSpace("local-floor");
      } catch {
        try {
          referenceSpace = await xrSession.requestReferenceSpace("local");
        } catch {
          referenceSpace = await xrSession.requestReferenceSpace("viewer");
        }
      }

      const colorProgram = createProgram(gl,
        `attribute vec3 a_position; uniform mat4 u_projection; uniform mat4 u_view; uniform mat4 u_model; varying vec3 v_world; void main(){ vec4 world=u_model*vec4(a_position,1.0); v_world=world.xyz; gl_Position=u_projection*u_view*world; }`,
        `precision mediump float; uniform vec4 u_color; varying vec3 v_world; void main(){ float d=clamp((-v_world.z-2.0)/12.0,0.0,1.0); vec3 fog=vec3(0.004,0.045,0.075); vec3 c=mix(u_color.rgb,fog,d*d*0.72); gl_FragColor=vec4(c,u_color.a); }`
      );
      const textureProgram = createProgram(gl,
        `attribute vec3 a_position; attribute vec2 a_uv; uniform mat4 u_projection; uniform mat4 u_view; uniform mat4 u_model; varying vec2 v_uv; void main(){ v_uv=a_uv; gl_Position=u_projection*u_view*u_model*vec4(a_position,1.0); }`,
        `precision mediump float; uniform sampler2D u_texture; varying vec2 v_uv; void main(){ gl_FragColor=texture2D(u_texture,v_uv); }`
      );

      const cubeVerts = new Float32Array([
        -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,  0.5,-0.5,-0.5,
        -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
        -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
         0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
        -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5
      ]);
      const cubeIdx = new Uint16Array([
        0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11,
        12,13,14,12,14,15, 16,17,18,16,18,19, 20,21,22,20,22,23
      ]);
      const cubeVbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cubeVbo); gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
      const cubeIbo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIbo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIdx, gl.STATIC_DRAW);

      // Canvas textures use a top-left origin while WebGL UVs use a bottom-left origin.
      // Keep standard bottom->top UVs here and flip the uploaded canvas once via
      // UNPACK_FLIP_Y_WEBGL below. The previous version inverted both the UVs and
      // the upload, causing the Fortify XR panel to appear upside down.
      const quad = new Float32Array([
        -1,-0.5,0, 0,0,
         1,-0.5,0, 1,0,
         1, 0.5,0, 1,1,
        -1, 0.5,0, 0,1
      ]);
      const quadIdx = new Uint16Array([0,1,2,0,2,3]);
      const quadVbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      const quadIbo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIbo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIdx, gl.STATIC_DRAW);
      const panelTexture = gl.createTexture();

      // Pequeno campo de partículas para reforçar a sensação de coluna d'água
      // sem depender de assets 3D externos. Mantemos poucos elementos para
      // preservar desempenho em headsets como o Meta Quest 2.
      const subseaBubbles = Array.from({ length: 14 }, (_, i) => ({
        x: -2.8 + ((i * 1.17) % 5.6),
        z: -2.4 - ((i * 0.83) % 4.6),
        y: (i * 0.31) % 3.1,
        speed: 0.09 + (i % 4) * 0.025,
        phase: i * 0.77,
        size: 0.025 + (i % 3) * 0.012,
      }));

      function updatePanel() {
        const panelCanvas = createPanelCanvas(sessionRef.current, equipmentRef.current, detailsVisibleRef.current);
        gl.bindTexture(gl.TEXTURE_2D, panelTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, panelCanvas);
      }
      updatePanel();
      xrRuntimeRef.current = { session: xrSession, updatePanel };

      xrSession.addEventListener("select", async () => {
        if (!equipmentRef.current) await loadEquipment();
        else detailsVisibleRef.current = !detailsVisibleRef.current;
        updatePanel();
      });

      function drawBox(projection: ArrayLike<number>, view: ArrayLike<number>, model: Mat4, color: [number,number,number,number]) {
        gl.useProgram(colorProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVbo);
        const pos = gl.getAttribLocation(colorProgram, "a_position");
        gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIbo);
        gl.uniformMatrix4fv(gl.getUniformLocation(colorProgram,"u_projection"), false, projection as any);
        gl.uniformMatrix4fv(gl.getUniformLocation(colorProgram,"u_view"), false, view as any);
        gl.uniformMatrix4fv(gl.getUniformLocation(colorProgram,"u_model"), false, model);
        gl.uniform4fv(gl.getUniformLocation(colorProgram,"u_color"), color);
        gl.drawElements(gl.TRIANGLES, cubeIdx.length, gl.UNSIGNED_SHORT, 0);
      }

      function drawPanel(projection: ArrayLike<number>, view: ArrayLike<number>) {
        gl.useProgram(textureProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo);
        const pos = gl.getAttribLocation(textureProgram, "a_position");
        const uv = gl.getAttribLocation(textureProgram, "a_uv");
        gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(uv); gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIbo);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, panelTexture);
        gl.uniform1i(gl.getUniformLocation(textureProgram,"u_texture"), 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(textureProgram,"u_projection"), false, projection as any);
        gl.uniformMatrix4fv(gl.getUniformLocation(textureProgram,"u_view"), false, view as any);
        gl.uniformMatrix4fv(gl.getUniformLocation(textureProgram,"u_model"), false, modelMatrix(1.05,1.62,-2.45,0.92,0.92,1));
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }

      function onFrame(_time: number, frame: any) {
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
          gl.enable(gl.DEPTH_TEST);
          gl.enable(gl.CULL_FACE);
          gl.clearColor(0.004,0.035,0.085,1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          for (const view of pose.views) {
            const viewport = baseLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            const projection = view.projectionMatrix;
            const viewMatrix = view.transform.inverse.matrix;

            const t = _time * 0.001;

            // Leito marinho
            drawBox(projection, viewMatrix, modelMatrix(0,-0.07,-4.4,8.2,0.10,8.2), [0.065,0.105,0.095,1]);
            drawBox(projection, viewMatrix, modelMatrix(-3.15,0.12,-5.5,1.15,0.35,1.0,0.25), [0.09,0.14,0.13,1]);
            drawBox(projection, viewMatrix, modelMatrix(3.0,0.08,-6.0,1.55,0.28,1.25,-0.28), [0.08,0.125,0.12,1]);

            // Dutos submarinos e riser
            drawBox(projection, viewMatrix, modelMatrix(-2.15,0.24,-3.75,2.2,0.16,0.16), [0.20,0.34,0.36,1]);
            drawBox(projection, viewMatrix, modelMatrix(1.7,0.24,-3.75,2.0,0.16,0.16), [0.20,0.34,0.36,1]);
            drawBox(projection, viewMatrix, modelMatrix(2.95,0.82,-4.55,0.18,1.55,0.18), [0.24,0.39,0.40,1]);
            drawBox(projection, viewMatrix, modelMatrix(2.95,1.62,-4.55,0.34,0.18,0.34), [0.96,0.72,0.08,1]);

            // Skid / manifold P-101 submarino
            drawBox(projection, viewMatrix, modelMatrix(-0.55,0.16,-3.65,1.95,0.16,1.5), [0.16,0.25,0.26,1]);
            drawBox(projection, viewMatrix, modelMatrix(-1.32,0.70,-3.65,0.10,1.05,1.28), [0.14,0.29,0.29,1]);
            drawBox(projection, viewMatrix, modelMatrix(0.22,0.70,-3.65,0.10,1.05,1.28), [0.14,0.29,0.29,1]);
            drawBox(projection, viewMatrix, modelMatrix(-0.55,1.18,-3.65,1.65,0.10,1.25), [0.14,0.29,0.29,1]);

            // Corpo principal da bomba
            drawBox(projection, viewMatrix, modelMatrix(-0.55,0.57,-3.65,0.78,0.72,0.78), [0.0,0.40,0.30,1]);
            drawBox(projection, viewMatrix, modelMatrix(-0.55,1.12,-3.65,0.42,0.32,0.42), [0.96,0.72,0.08,1]);
            drawBox(projection, viewMatrix, modelMatrix(-1.28,0.50,-3.65,0.72,0.22,0.22), [0.24,0.40,0.40,1]);
            drawBox(projection, viewMatrix, modelMatrix(0.18,0.50,-3.65,0.72,0.22,0.22), [0.24,0.40,0.40,1]);

            // Módulos de instrumentação
            drawBox(projection, viewMatrix, modelMatrix(-1.18,1.36,-3.35,0.26,0.34,0.26), [0.05,0.48,0.34,1]);
            drawBox(projection, viewMatrix, modelMatrix(0.05,1.36,-3.35,0.26,0.34,0.26), [0.05,0.48,0.34,1]);
            drawBox(projection, viewMatrix, modelMatrix(-1.18,1.58,-3.35,0.13,0.08,0.13), [0.96,0.76,0.10,1]);
            drawBox(projection, viewMatrix, modelMatrix(0.05,1.58,-3.35,0.13,0.08,0.13), [0.96,0.76,0.10,1]);

            // Estruturas distantes para criar escala e profundidade no headset
            for (let i = 0; i < 5; i++) {
              const side = i % 2 === 0 ? -1 : 1;
              const dx = side * (4.6 + (i % 3) * 1.35);
              const dz = -7.5 - i * 1.65;
              drawBox(projection, viewMatrix, modelMatrix(dx,0.78,dz,1.10,1.55,0.92), [0.035,0.12,0.15,1]);
              drawBox(projection, viewMatrix, modelMatrix(dx,1.80,dz,1.55,0.10,1.18), [0.07,0.21,0.23,1]);
              drawBox(projection, viewMatrix, modelMatrix(dx,2.28,dz,0.10,0.95,0.10), [0.09,0.27,0.28,1]);
              drawBox(projection, viewMatrix, modelMatrix(dx,2.72,dz+0.34,0.07,0.07,0.05), [0.20,0.78,0.94,1]);
            }

            // ROV de inspeção em movimento lento
            const rovY = 1.75 + Math.sin(t * 0.55) * 0.12;
            const rovX = -3.7 + Math.sin(t * 0.22) * 0.24;
            drawBox(projection, viewMatrix, modelMatrix(rovX,rovY,-6.15,0.72,0.38,0.58,0,0.18,0), [0.70,0.52,0.06,1]);
            drawBox(projection, viewMatrix, modelMatrix(rovX,rovY,-5.82,0.10,0.10,0.05), [0.24,0.88,1.0,1]);

            // Partículas/b bolhas em movimento na coluna d'água
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            for (const bubble of subseaBubbles) {
              const y = -0.05 + ((bubble.y + t * bubble.speed) % 3.15);
              const x = bubble.x + Math.sin(t * 0.75 + bubble.phase) * 0.08;
              drawBox(projection, viewMatrix, modelMatrix(x,y,bubble.z,bubble.size,bubble.size,bubble.size), [0.42,0.78,0.92,0.46]);
            }
            gl.disable(gl.BLEND);

            drawPanel(projection, viewMatrix);
          }
        }
        xrSession.requestAnimationFrame(onFrame);
      }
      xrSession.requestAnimationFrame(onFrame);
      xrSession.addEventListener("end", () => {
        setXrActive(false);
        xrRuntimeRef.current = null;
      });
    } catch (err) {
      setXrActive(false);
      const domError = err as DOMException | Error;
      const errorName = "name" in domError ? domError.name : "";
      const errorMessage = err instanceof Error ? err.message : "";

      if (errorName === "NotSupportedError" || /session configuration is not supported/i.test(errorMessage)) {
        setNotice("O navegador/headset não aceitou uma sessão immersive-vr. Abra esta página diretamente no navegador WebXR do headset, em HTTPS. No computador, use o simulador desktop.");
      } else if (errorName === "SecurityError") {
        setNotice("O navegador bloqueou o acesso ao XR. Confirme a permissão do headset e mantenha a aplicação em HTTPS.");
      } else if (errorName === "InvalidStateError") {
        setNotice("Já existe uma sessão XR ativa. Encerre a sessão atual e tente novamente.");
      } else {
        setNotice(errorMessage || "Não foi possível iniciar a sessão WebXR.");
      }
    }
  }

  return (
    <main className="xrPage xrPageV7">
      <div className="brandStripe" aria-hidden="true" />
      <header className="xrTopbar">
        <Link href="/" className="xrBrand"><Logo /></Link>
        <div className="xrPartner"><span>PROTÓTIPO DE INOVAÇÃO</span><PetrobrasLogo compact /></div>
        <nav><Link href="/documentacao#xr">Documentação XR</Link><Link href="/admin">Arquitetura</Link></nav>
      </header>

      <section className="xrHero">
        <div>
          <span className="xrEyebrow">FORTIFY SUBSEA XR • IMMERSIVE OPERATIONS SIMULATOR</span>
          <h1>Uma operação subsea que parece <em>missão real</em> — com acesso seguro à IA.</h1>
          <p>O operador entra em um cenário submarino 3D, navega pelo campo com mouse/WASD, trava o alvo P-101 e só libera telemetria depois que identidade, MFA, Device Trust e RBAC passam pelo Fortify Security Gateway.</p>
        </div>
        <div className={`xrSupportBadge ${xrSupported ? "ok" : ""}`}>
          <span className="liveDot" />
          {xrSupported === null ? "VERIFICANDO WEBXR" : xrSupported ? "WEBXR IMERSIVO DISPONÍVEL" : "MODO SIMULADOR DESKTOP"}
        </div>
      </section>

      <section className={`xrWorkspace xrWorkspaceV7 ${stage === "ready" ? "isReady" : ""}`}>
        <div className="xrSceneCard xrSceneCardV7">
          <div className="xrSceneHead"><span>CAMPO SUBMARINO SIMULADO</span><b>SUBSEA • PROFUNDIDADE 1.820 m</b></div>
          <div className="xrScene xrSceneV7">
            <SubseaImmersiveScene
              authorized={stage === "ready"}
              equipment={equipment}
              busy={busy}
              onScan={loadEquipment}
              user={session?.user}
              deviceId={session?.deviceId ?? deviceId}
            />
          </div>

          <div className="xrControls">
            <button onClick={startImmersiveVR} className="xrPrimary" disabled={stage !== "ready" || xrActive}>
              {xrActive ? "SESSÃO VR ATIVA" : "ENTRAR NO MODO IMERSIVO"}
            </button>
            <button onClick={loadEquipment} className="xrSecondary" disabled={stage !== "ready" || busy}>ESCANEAR P-101</button>
          </div>
          {!xrSupported && <p className="xrHint">WebXR imersivo exige HTTPS e navegador/headset compatível. O simulador desktop continua totalmente funcional.</p>}
        </div>

        <aside className="xrSecurityPanel xrSecurityPanelV7">
          <div className="xrPanelHead"><span>FORTIFY SECURITY GATEWAY</span><b>{stage === "ready" ? "AUTHORIZED" : "LOCKED"}</b></div>

          {stage === "checking" && <div className="xrChecking">Verificando sessão segura…</div>}

          {stage === "login" && (
            <form onSubmit={submitLogin} className="xrForm">
              <span className="xrStep">ETAPA 01 / IDENTIDADE</span>
              <h2>Autenticação corporativa</h2>
              <label>Identidade<input value={user} onChange={e=>setUser(e.target.value)} autoComplete="username" /></label>
              <label>Senha / PIN<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></label>
              <label>Device ID<input value={deviceId} onChange={e=>setDeviceId(e.target.value.toUpperCase())} /></label>
              <button disabled={busy}>{busy ? "VALIDANDO…" : "VALIDAR IDENTIDADE"}</button>
            </form>
          )}

          {stage === "mfa" && (
            <form onSubmit={submitMfa} className="xrForm">
              <span className="xrStep">ETAPA 02 / MFA</span><h2>Segundo fator</h2>
              <p>A identidade primária foi validada. Informe o segundo fator para continuar.</p>
              <label>Código MFA<input inputMode="numeric" value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 8))} /></label>
              <button disabled={busy}>{busy ? "VERIFICANDO…" : "VALIDAR MFA"}</button>
            </form>
          )}

          {stage === "device" && (
            <div className="xrForm">
              <span className="xrStep">ETAPA 03 / DEVICE TRUST</span><h2>Confiança do dispositivo</h2>
              <p>O Fortify verificará se <b>{deviceId}</b> é o mesmo dispositivo usado no início do fluxo e se está autorizado.</p>
              <button onClick={validateDevice} disabled={busy}>{busy ? "VALIDANDO…" : "AUTORIZAR DISPOSITIVO"}</button>
            </div>
          )}

          {stage === "ready" && session && (
            <div className="xrReady">
              <span className="xrStep">SESSÃO AUTENTICADA</span><h2>Acesso liberado</h2>
              <div className="xrTrustList">
                <span><b>IDENTIDADE</b><i>✓ {session.user}</i></span>
                <span><b>MFA</b><i>✓ verificado</i></span>
                <span><b>DEVICE TRUST</b><i>✓ {session.deviceId}</i></span>
                <span><b>RBAC</b><i>✓ {session.permissions.join(" • ")}</i></span>
                <span><b>SESSÃO</b><i>✓ JWT / httpOnly</i></span>
              </div>
              <button className="xrLogout" onClick={logout}>ENCERRAR SESSÃO</button>
            </div>
          )}

          {notice && <div className="xrNotice">{notice}</div>}
        </aside>
      </section>

      {stage === "ready" && (
        <section className="xrDataGrid">
          <article className="xrDataCard">
            <div className="xrCardTitle"><span>ATIVO SUBSEA</span><b>{equipment ? "DATA RELEASED" : "WAITING"}</b></div>
            {equipment ? (
              <div className="equipmentReadout">
                <header><strong>{equipment.id}</strong><span>{equipment.name}</span></header>
                <div><span>Status<b>{equipment.status}</b></span><span>Pressão<b>{equipment.pressureBar} bar</b></span><span>Temperatura<b>{equipment.temperatureC} °C</b></span><span>Vibração<b>{equipment.vibrationMmS} mm/s</b></span><span>Vazão<b>{equipment.flowRateM3h} m³/h</b></span><span>Profundidade<b>{equipment.depthM} m</b></span></div>
                <footer>{equipment.classification} • Atualização simulada: {new Date(equipment.lastUpdate).toLocaleTimeString("pt-BR")}</footer>
              </div>
            ) : <p className="xrEmpty">Os dados permanecem ocultos até o Fortify validar a sessão e autorizar a consulta.</p>}
          </article>

          <article className="xrDataCard">
            <div className="xrCardTitle"><span>ASSISTENTE IA VIA GATEWAY</span><b>RBAC ENFORCED</b></div>
            <form onSubmit={askAi} className="xrAiForm">
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ex.: Analise o módulo submarino P-101 e explique se pressão, temperatura, vazão ou vibração exigem atenção." maxLength={2000} />
              <button disabled={busy || !message.trim()}>ENVIAR CONSULTA SEGURA</button>
            </form>
            {aiAnswer && <div className="xrAiAnswer"><b>FORTIFY / RESPOSTA AUTORIZADA</b><p>{aiAnswer}</p></div>}
          </article>
        </section>
      )}

      <section className="xrFlowBand">
        <span>HEADSET VR / SMART GLASSES • SUBSEA</span><i>→</i><span>IDENTIDADE</span><i>→</i><span>MFA</span><i>→</i><span>DEVICE TRUST</span><i>→</i><strong>FORTIFY GATEWAY</strong><i>→</i><span>IA / DADOS</span>
      </section>
    </main>
  );
}
