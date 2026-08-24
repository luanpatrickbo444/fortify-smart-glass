"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PetrobrasLogo } from "@/components/PetrobrasLogo";

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

function rotationY(rad: number): Mat4 {
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}

function modelMatrix(x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) {
  return multiply(translation(x,y,z), multiply(rotationY(ry), scale(sx,sy,sz)));
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
  ctx.fillText("FORTIFY / SECURE XR", 70, 90);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 46px Arial";
  ctx.fillText(details ? "EQUIPAMENTO P-101" : "SESSÃO AUTORIZADA", 70, 155);

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
    ctx.fillStyle = "#ffd52f";
    ctx.font = "700 21px Arial";
    ctx.fillText(`CLASSIFICAÇÃO: ${equipment.classification}`, 650, 460);
  } else {
    ctx.fillStyle = "#dcebe5";
    ctx.font = "500 25px Arial";
    ctx.fillText("Aponte para o ativo industrial e pressione o gatilho", 650, 240);
    ctx.fillText("para alternar os dados autorizados do equipamento.", 650, 282);
    ctx.fillStyle = "#ffd52f";
    ctx.font = "700 22px Arial";
    ctx.fillText("DEMONSTRAÇÃO WEBXR • DADOS SIMULADOS", 650, 350);
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
      const xrSession = await xr.requestSession("immersive-vr", {
        requiredFeatures: [],
        optionalFeatures: ["local-floor", "bounded-floor"]
      });
      setXrActive(true);

      const canvas = document.createElement("canvas");
      canvas.width = 2048; canvas.height = 2048;
      const gl = canvas.getContext("webgl", {
        xrCompatible: true,
        alpha: false,
        antialias: true
      }) as WebGLRenderingContext | null;
      if (!gl) throw new Error("WebGL não está disponível.");
      if ((gl as any).makeXRCompatible) await (gl as any).makeXRCompatible();

      const XRWebGLLayerCtor = (window as any).XRWebGLLayer;
      if (!XRWebGLLayerCtor) throw new Error("XRWebGLLayer não está disponível neste navegador.");
      const baseLayer = new XRWebGLLayerCtor(xrSession, gl);
      xrSession.updateRenderState({ baseLayer });

      let referenceSpace: any;
      try { referenceSpace = await xrSession.requestReferenceSpace("local-floor"); }
      catch { referenceSpace = await xrSession.requestReferenceSpace("local"); }

      const colorProgram = createProgram(gl,
        `attribute vec3 a_position; uniform mat4 u_projection; uniform mat4 u_view; uniform mat4 u_model; void main(){ gl_Position=u_projection*u_view*u_model*vec4(a_position,1.0); }`,
        `precision mediump float; uniform vec4 u_color; void main(){ gl_FragColor=u_color; }`
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

      const quad = new Float32Array([-1,-0.5,0, 0,1,  1,-0.5,0, 1,1,  1,0.5,0, 1,0,  -1,0.5,0, 0,0]);
      const quadIdx = new Uint16Array([0,1,2,0,2,3]);
      const quadVbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadVbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
      const quadIbo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIbo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIdx, gl.STATIC_DRAW);
      const panelTexture = gl.createTexture();

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
        gl.uniformMatrix4fv(gl.getUniformLocation(textureProgram,"u_model"), false, modelMatrix(0,1.65,-2.6,1.35,1.35,1));
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }

      function onFrame(_time: number, frame: any) {
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
          gl.enable(gl.DEPTH_TEST);
          gl.enable(gl.CULL_FACE);
          gl.clearColor(0.015,0.055,0.05,1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          for (const view of pose.views) {
            const viewport = baseLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            const projection = view.projectionMatrix;
            const viewMatrix = view.transform.inverse.matrix;

            drawBox(projection, viewMatrix, modelMatrix(0,-0.04,-3.4,5.8,0.08,5.8), [0.08,0.13,0.12,1]);
            drawBox(projection, viewMatrix, modelMatrix(0,0.45,-3.4,0.92,0.9,0.92), [0.0,0.42,0.26,1]);
            drawBox(projection, viewMatrix, modelMatrix(0,1.15,-3.4,0.55,0.52,0.55), [0.98,0.78,0.08,1]);
            drawBox(projection, viewMatrix, modelMatrix(-0.92,0.34,-3.4,0.85,0.28,0.28), [0.18,0.32,0.30,1]);
            drawBox(projection, viewMatrix, modelMatrix(0.92,0.34,-3.4,0.85,0.28,0.28), [0.18,0.32,0.30,1]);
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
      setNotice(err instanceof Error ? err.message : "Não foi possível iniciar a sessão WebXR.");
    }
  }

  return (
    <main className="xrPage">
      <div className="brandStripe" aria-hidden="true" />
      <header className="xrTopbar">
        <Link href="/" className="xrBrand"><Logo /></Link>
        <div className="xrPartner"><span>PROTÓTIPO DE INOVAÇÃO</span><PetrobrasLogo compact /></div>
        <nav><Link href="/documentacao#xr">Documentação XR</Link><Link href="/admin">Arquitetura</Link></nav>
      </header>

      <section className="xrHero">
        <div>
          <span className="xrEyebrow">FORTIFY XR • SMART GLASSES SIMULATOR</span>
          <h1>Simulação imersiva do <em>acesso seguro</em> à IA industrial.</h1>
          <p>O headset VR representa os Smart Glasses durante a prototipação. A autenticação, o vínculo do dispositivo, as permissões e o Security Gateway são os mesmos controles usados no fluxo web.</p>
        </div>
        <div className={`xrSupportBadge ${xrSupported ? "ok" : ""}`}>
          <span className="liveDot" />
          {xrSupported === null ? "VERIFICANDO WEBXR" : xrSupported ? "WEBXR IMERSIVO DISPONÍVEL" : "MODO SIMULADOR DESKTOP"}
        </div>
      </section>

      <section className="xrWorkspace">
        <div className="xrSceneCard">
          <div className="xrSceneHead"><span>ÁREA INDUSTRIAL SIMULADA</span><b>UNIDADE / PROCESSO</b></div>
          <div className="xrScene">
            <div className="xrGridFloor" />
            <button className="xrPump" onClick={loadEquipment} disabled={stage !== "ready" || busy} aria-label="Consultar bomba P-101">
              <span className="pumpPipe left" /><span className="pumpPipe right" />
              <span className="pumpBody"><i /></span><span className="pumpBase" />
              <strong>P-101</strong><small>BOMBA DE PROCESSO</small>
              <span className="scanRing" />
            </button>
            <div className="xrSceneLegend"><span className="liveDot" /> SELECIONE O ATIVO PARA SOLICITAR DADOS</div>
          </div>

          <div className="xrControls">
            <button onClick={startImmersiveVR} className="xrPrimary" disabled={stage !== "ready" || xrActive}>
              {xrActive ? "SESSÃO VR ATIVA" : "ENTRAR NO MODO IMERSIVO"}
            </button>
            <button onClick={loadEquipment} className="xrSecondary" disabled={stage !== "ready" || busy}>CONSULTAR P-101</button>
          </div>
          {!xrSupported && <p className="xrHint">WebXR imersivo exige HTTPS e navegador/headset compatível. O simulador desktop continua totalmente funcional.</p>}
        </div>

        <aside className="xrSecurityPanel">
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
            <div className="xrCardTitle"><span>ATIVO INDUSTRIAL</span><b>{equipment ? "DATA RELEASED" : "WAITING"}</b></div>
            {equipment ? (
              <div className="equipmentReadout">
                <header><strong>{equipment.id}</strong><span>{equipment.name}</span></header>
                <div><span>Status<b>{equipment.status}</b></span><span>Pressão<b>{equipment.pressureBar} bar</b></span><span>Temperatura<b>{equipment.temperatureC} °C</b></span><span>Vibração<b>{equipment.vibrationMmS} mm/s</b></span></div>
                <footer>{equipment.classification} • Atualização simulada: {new Date(equipment.lastUpdate).toLocaleTimeString("pt-BR")}</footer>
              </div>
            ) : <p className="xrEmpty">Os dados permanecem ocultos até o Fortify validar a sessão e autorizar a consulta.</p>}
          </article>

          <article className="xrDataCard">
            <div className="xrCardTitle"><span>ASSISTENTE IA VIA GATEWAY</span><b>RBAC ENFORCED</b></div>
            <form onSubmit={askAi} className="xrAiForm">
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ex.: Analise o estado da bomba P-101 e explique se os dados exigem atenção." maxLength={2000} />
              <button disabled={busy || !message.trim()}>ENVIAR CONSULTA SEGURA</button>
            </form>
            {aiAnswer && <div className="xrAiAnswer"><b>FORTIFY / RESPOSTA AUTORIZADA</b><p>{aiAnswer}</p></div>}
          </article>
        </section>
      )}

      <section className="xrFlowBand">
        <span>HEADSET VR / SMART GLASSES</span><i>→</i><span>IDENTIDADE</span><i>→</i><span>MFA</span><i>→</i><span>DEVICE TRUST</span><i>→</i><strong>FORTIFY GATEWAY</strong><i>→</i><span>IA / DADOS</span>
      </section>
    </main>
  );
}
