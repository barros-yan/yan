// ===== Config =====
const SMARTGPS_BASE = "https://api-sp.smartgps.com.br/__external";
const API_KEY = "QYoR9hlkgnfa58l#f5Z^%bWZBQx!umv@"; // ⚠️ interno, exposto conscientemente

// ===== Util =====
function show(el, display = "flex") { el.style.display = display; }
function hide(el) { el.style.display = "none"; }
function setAs(el, cls, html) {
  el.className = cls;
  el.innerHTML = html;
}
function jsonPretty(obj) {
  return `<pre style="white-space:pre-wrap;margin:8px 0 0">${JSON.stringify(obj, null, 2)}</pre>`;
}

// ===== Request core (padrão de resposta) =====
const DEFAULT_TIMEOUT_MS = 15000;

function parseApiMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  // tenta campos comuns de erro/mensagem
  return (
    data.message ||
    data.error ||
    data.err ||
    data.detail ||
    data.description ||
    ""
  );
}

async function apiRequest(url, { method = "GET", headers = {}, body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);

  // headers base
  const h = { Accept: "application/json", ...headers };

  // prepara body
  let payload;
  if (body != null) {
    if (typeof body === "string") {
      payload = body;
    } else {
      h["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers: h,
      body: payload,
      signal: ctrl.signal
    });

    const status = res.status;
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let data;
    try {
      data = isJson ? await res.json() : await res.text();
    } catch {
      data = null;
    }

    const ok = res.ok;
    const message = ok ? "" : (parseApiMessage(data) || `HTTP ${status}`);

    return { ok, status, data, message, url };
  } catch (e) {
    const isAbort = e.name === "AbortError";
    return {
      ok: false,
      status: isAbort ? 408 : 0,
      data: null,
      message: isAbort ? "Tempo esgotado (timeout)" : (e.message || "Falha de rede"),
      url
    };
  } finally {
    clearTimeout(t);
  }
}

// Render padrão para sucesso/erro
function renderStd({ box, errorBox, onOk, successClass = "success" }) {
  return (resp) => {
    hide(errorBox); hide(box);
    box.className = "result";
    box.innerHTML = "";

    if (resp.ok) {
      show(box);
      box.classList.add(successClass);
      onOk(resp);
    } else {
      setAs(errorBox, "erro", `❌ Erro${resp.status ? " (" + resp.status + ")" : ""}: ${resp.message}`);
      show(errorBox);
    }
  };
}

// ===== Consulta IMEI (sem chave) =====
async function consultarIMEI() {
  const imeiInput = document.getElementById("imei");
  const erro = document.getElementById("error");
  const result = document.getElementById("result");

  hide(erro); hide(result);
  result.className = "result";
  result.innerHTML = "";

  const imei = (imeiInput.value || "").trim();
  if (!imei) {
    setAs(erro, "erro", '<ion-icon name="warning-outline"></ion-icon> Por favor, insira um número IMEI.');
    show(erro);
    return;
  }

  const url = `${SMARTGPS_BASE}/checkimei/${encodeURIComponent(imei)}`;

  // estado de carregamento (opcional)
  setAs(result, "result", "Carregando…");
  show(result);

  const resp = await apiRequest(url);

  renderStd({
    box: result,
    errorBox: erro,
    onOk: ({ data }) => {
      const existingServers = data?.existingServers;
      if (existingServers && existingServers.length > 0) {
        result.innerHTML = `
          <span class="title-result">Servidores encontrados:</span>
          ${existingServers.join("<br>")}
        `;
      } else {
        result.textContent = "Nenhum servidor encontrado para este IMEI.";
      }
    }
  })(resp);
}

// ===== Consulta Login (com x-api-key) =====
async function consultarLogin() {
  const loginInput = document.getElementById("login");
  const erro = document.getElementById("loginError");
  const box = document.getElementById("loginResult");

  hide(erro); hide(box);
  box.className = "result";
  box.innerHTML = "";

  const login = (loginInput.value || "").trim();
  if (!login) {
    setAs(erro, "erro", "⚠️ Por favor, insira um login.");
    show(erro);
    return;
  }

  const url = `${SMARTGPS_BASE}/checklogin/${encodeURIComponent(login)}`;

  // estado de carregamento (opcional)
  setAs(box, "result", "Carregando…");
  show(box);

  const resp = await apiRequest(url, {
    headers: { "x-api-key": API_KEY }
  });

  renderStd({
    box,
    errorBox: erro,
    onOk: ({ data }) => {
      // Normaliza possíveis formatos da API:
      // - { server: "AL" }
      // - { servers: ["AL","SP"] }
      // - { existingServers: [...] } (fallback)
      // - string ou array direto
      let servers = [];
      if (Array.isArray(data)) {
        servers = data;
      } else if (typeof data === "string") {
        servers = [data];
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.servers)) {
          servers = data.servers;
        } else if (Array.isArray(data.existingServers)) {
          servers = data.existingServers;
        } else if (typeof data.server === "string" && data.server) {
          servers = [data.server];
        } else {
          // último recurso: mostra JSON bruto
          servers = [JSON.stringify(data)];
        }
      }
      box.innerHTML = `
        <span class="title-result">Servidores encontrados:</span>
        ${servers.length ? servers.join("<br>") : "Nenhum servidor encontrado para este login."}
      `;
    }
  })(resp);
}

// ===== Tema =====
function initTema() {
  const icone = document.getElementById("iconeTema");
  const trocaTema = document.getElementById("trocaTema");
  const container = document.getElementById("containerPrincipal");
  const titulo = document.getElementById("titulo");
  const imei = document.getElementById("imei");
  const result = document.getElementById("result");
  const login = document.getElementById("login");
  const loginResult = document.getElementById("loginResult");

  const elementosParaAlterarTema = [trocaTema, container, titulo, imei, result, login, loginResult];

  function alternarTema(el) { el.classList.toggle("temaBranco"); }
  function alternarIcone() {
    icone.name = (icone.name === "sunny-outline") ? "moon-outline" : "sunny-outline";
  }

  trocaTema.addEventListener("click", () => {
    alternarIcone();
    elementosParaAlterarTema.forEach(alternarTema);
  });
}

// ===== Bind de eventos =====
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnImei")?.addEventListener("click", consultarIMEI);
  document.getElementById("imei")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") consultarIMEI();
  });

  document.getElementById("btnLogin")?.addEventListener("click", consultarLogin);
  document.getElementById("login")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") consultarLogin();
  });

  initTema();
});