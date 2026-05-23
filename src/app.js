const newDiagramButton = document.querySelector("#newDiagramButton");
const modalBackdrop = document.querySelector("#modalBackdrop");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelButton = document.querySelector("#cancelButton");
const diagramForm = document.querySelector("#diagramForm");
const modalTitle = document.querySelector("#modalTitle");
const diagramTitle = document.querySelector("#diagramTitle");
const sourceCode = document.querySelector("#sourceCode");
const generatedGrid = document.querySelector("#generatedGrid");
const diagramCount = document.querySelector("#diagramCount");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const plantumlResult = document.querySelector("#plantumlResult");
const diagramPreview = document.querySelector("#diagramPreview");
const resultPanel = document.querySelector("#resultPanel");
const resultStatus = document.querySelector("#resultStatus");
const toast = document.querySelector("#toast");
const backToProject = document.querySelector("#backToProject");
const backProjectLabel = document.querySelector("#backProjectLabel");
const userToggle = document.querySelector("#userToggle");
const userMenu = document.querySelector("#userMenu");
const downloadPumlButton = document.querySelector("#download-puml-btn");
const downloadPngButton = document.querySelector("#download-png-btn");
const downloadSvgButton = document.querySelector("#download-svg-btn");

const storageKey = "docula.frontend.diagrams.only.v1";
const defaultGatewayUrl = window.DOCULA_GATEWAY_URL || "http://127.0.0.1:8000";
const moduleOneBaseUrl =
  window.DOCIA_MODULE_ONE_URL || "https://docuia-frontend-hdc8hzfqbqebc6cp.brazilsouth-01.azurewebsites.net";

function captureIntegrationParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const token = params.get("token");
  const projectIdParam = params.get("id") || params.get("projectId");
  const companyIdParam = params.get("companyId") || params.get("company_id");
  const projectNameParam = params.get("project_name") || params.get("projectName") || params.get("name");
  const returnUrlParam = params.get("returnUrl") || params.get("return_url") || params.get("redirect");

  if (token) {
    sessionStorage.setItem("auth_token", token);
  }

  if (projectIdParam) {
    sessionStorage.setItem("project_id", projectIdParam);
  }

  if (companyIdParam) {
    sessionStorage.setItem("company_id", companyIdParam);
  }

  if (projectNameParam) {
    sessionStorage.setItem("project_name", projectNameParam);
  }

  if (returnUrlParam) {
    sessionStorage.setItem("return_url", returnUrlParam);
  } else if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    sessionStorage.setItem("return_url", document.referrer);
  }

  if (token) {
    params.delete("token");

    const queryString = params.toString();
    const cleanUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

    window.history.replaceState({}, document.title, cleanUrl);
  }
}

function buildModuleOneUrl(path, params = {}) {
  const url = new URL(path, moduleOneBaseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value && !String(value).startsWith("demo-")) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getBackToProjectUrl() {
  const storedReturnUrl = sessionStorage.getItem("return_url");

  if (storedReturnUrl) {
    return storedReturnUrl;
  }

  if (projectId && !projectId.startsWith("demo-")) {
    return buildModuleOneUrl("/projeto", { id: projectId });
  }

  return buildModuleOneUrl("/projetos");
}

function configureModuleOneNavigation() {
  const navigationLinks = {
    "/dashboard": buildModuleOneUrl("/dashboard"),
    "/empresas": buildModuleOneUrl("/empresas"),
    "/projetos": buildModuleOneUrl("/projetos"),
  };

  document.querySelectorAll(".menu-link").forEach((link) => {
    const targetUrl = navigationLinks[link.getAttribute("href")];

    if (targetUrl) {
      link.href = targetUrl;
    }
  });
}

function getAuthHeaders() {
  const token = sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getProjectContext() {
  const params = new URLSearchParams(window.location.search);

  return {
    project_id: sessionStorage.getItem("project_id") || params.get("id") || params.get("projectId") || "demo-project",
    company_id:
      sessionStorage.getItem("company_id") || params.get("companyId") || params.get("company_id") || "demo-company",
    project_name:
      sessionStorage.getItem("project_name") ||
      params.get("project_name") ||
      params.get("projectName") ||
      params.get("name") ||
      "Projeto DoculA",
  };
}

captureIntegrationParamsFromUrl();

const projectContext = getProjectContext();
const projectId = projectContext.project_id;
const companyId = projectContext.company_id;
const projectName = projectContext.project_name;
backProjectLabel.textContent = "Voltar";
configureModuleOneNavigation();

const diagramTypes = {
  class: {
    title: "Diagrama UML",
    theme: "blue",
    icon: "code-2",
    sampleCode: `public class Usuario {
    private String nome;
    private String email;

    public void login() { }
    public void logout() { }
}`,
  },
  architecture: {
    title: "Arquitetura de Sistema",
    theme: "purple",
    icon: "layers",
    sampleCode: `public class GatewayController {
    private ParserClient parserClient;
    private DiagramClient diagramClient;
}`,
  },
  cloud: {
    title: "Infraestrutura Cloud",
    theme: "green",
    icon: "cloud",
    sampleCode: `public class AzureAppService {
    private String gatewayUrl;
    private String parserUrl;
    private String diagramUrl;
}`,
  },
  er: {
    title: "Diagrama ER",
    theme: "orange",
    icon: "database",
    sampleCode: `public class Usuario {
    private Long id;
    private String nome;
}

public class Pedido {
    private Long id;
    private Usuario usuario;
}`,
  },
  persona: {
    title: "Perfis de Usuario",
    theme: "pink",
    icon: "users",
    sampleCode: `public class TechLead {
    public void revisarArquitetura() { }
}

public class Desenvolvedor {
    public void consultarDocumentacao() { }
}`,
  },
  process: {
    title: "Fluxo de Processo",
    theme: "teal",
    icon: "git-branch",
    sampleCode: `public class PipelineGeracao {
    public void receberCodigo() { }
    public void chamarParser() { }
    public void chamarDiagramApi() { }
    public void salvarHistorico() { }
}`,
  },
};

let selectedDiagramType = "class";
let currentPlantuml = "";
let currentDiagramTitle = "diagrama";

const demoDiagrams = [
  {
    id: "demo-architecture",
    title: "Arquitetura de Sistema",
    type: "architecture",
    elements: 5,
    createdAt: "2026-05-16T18:21:00",
    plantuml: buildDemoPlantuml("Arquitetura de Sistema"),
  },
  {
    id: "demo-cloud",
    title: "Infraestrutura Cloud",
    type: "cloud",
    elements: 5,
    createdAt: "2026-05-16T18:12:00",
    plantuml: buildDemoPlantuml("Infraestrutura Cloud"),
  },
  {
    id: "demo-er",
    title: "Diagrama ER",
    type: "er",
    elements: 3,
    createdAt: "2026-05-16T17:58:00",
    plantuml: buildDemoPlantuml("Diagrama ER"),
  },
];

sourceCode.value = diagramTypes.class.sampleCode;
seedDemoHistory();
renderGeneratedDiagrams();
window.lucide?.createIcons();

newDiagramButton.addEventListener("click", () => openModal("class"));
closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);
backToProject.addEventListener("click", () => {
  const returnUrl = getBackToProjectUrl();

  if (document.referrer && document.referrer === returnUrl && window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = returnUrl;
});

userToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  userMenu?.classList.toggle("show");
});

window.addEventListener("click", (event) => {
  if (userMenu && userToggle && !userMenu.contains(event.target) && !userToggle.contains(event.target)) {
    userMenu.classList.remove("show");
  }
});

document.querySelectorAll(".type-card").forEach((card) => {
  card.addEventListener("click", () => openModal(card.dataset.type || "class"));
});

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderGeneratedDiagrams([]);
  showToast("Historico limpo.");
});

generatedGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-diagram-id]");
  if (!card) {
    return;
  }

  const diagram = getHistory().find((item) => item.id === card.dataset.diagramId);
  if (diagram) {
    openHistoryDiagram(diagram);
  }
});

diagramForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await generateDiagram();
});

downloadPumlButton?.addEventListener("click", () => {
  if (!currentPlantuml) {
    showToast("Nenhum diagrama disponivel para exportacao.");
    return;
  }

  downloadTextFile(getDownloadFileName("puml"), currentPlantuml);
  showToast("PUML exportado com sucesso.");
});

downloadPngButton?.addEventListener("click", async () => {
  await exportRenderedDiagram("png");
});

downloadSvgButton?.addEventListener("click", async () => {
  await exportRenderedDiagram("svg");
});

function openModal(type) {
  selectedDiagramType = diagramTypes[type] ? type : "class";
  const config = diagramTypes[selectedDiagramType];

  modalTitle.textContent = "Novo Diagrama";
  diagramForm.hidden = false;
  diagramTitle.value = config.title;
  sourceCode.value = config.sampleCode;
  resultPanel.hidden = true;
  plantumlResult.textContent = "";
  diagramPreview.innerHTML = "";
  currentPlantuml = "";
  currentDiagramTitle = config.title;
  setExportActionsEnabled(false);
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
  sourceCode.focus();
}

function openHistoryDiagram(diagram) {
  const plantuml = diagram.plantuml || buildDemoPlantuml(diagram.title);
  selectedDiagramType = diagram.type || "class";
  modalTitle.textContent = diagram.title;
  diagramForm.hidden = true;
  resultStatus.textContent = "salvo";
  showGeneratedResult(plantuml, selectedDiagramType, diagram.title);
  modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function getGatewayEndpoint(type) {
  const endpoints = {
    class: "/diagram/class",
    architecture: "/diagram/architecture",
    cloud: "/diagram/cloud",
    persona: "/diagram/profiles",
    process: "/diagram/flow",
    er: "/diagram/class",
  };

  return endpoints[type] || "/diagram/class";
}

function buildGatewayPayload(type) {
  const currentProjectContext = getProjectContext();
  const basePayload = {
    project_id: currentProjectContext.project_id,
    project_name: currentProjectContext.project_name,
    company_id: currentProjectContext.company_id,
  };

  if (type === "architecture") {
    return {
      ...basePayload,
      description: sourceCode.value || "Gerar arquitetura do sistema",
    };
  }

  if (type === "cloud") {
    return {
      ...basePayload,
      description: sourceCode.value || "Gerar infraestrutura cloud",
    };
  }

  if (type === "persona") {
    return {
      ...basePayload,
      description: sourceCode.value || "Gerar perfis de usuário",
      profiles: ["Desenvolvedor", "Tech Lead", "Gerente de Projetos"],
    };
  }

  if (type === "process") {
    return {
      ...basePayload,
      description: sourceCode.value || "Gerar fluxo de processo",
    };
  }

  return {
    ...basePayload,
    title: diagramTitle.value,
    source_code: sourceCode.value,
    diagram_type: type === "er" ? "er" : "uml-class",
    type,
  };
}

async function generateDiagram() {
  const gatewayUrl = defaultGatewayUrl.replace(/\/$/, "");
  const endpoint = getGatewayEndpoint(selectedDiagramType);
  const payload = buildGatewayPayload(selectedDiagramType);

  setLoading(true);

  try {
    const response = await fetch(`${gatewayUrl}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gateway respondeu HTTP ${response.status}`);
    }

    const data = await response.json();
    const plantuml = extractPlantuml(data);

    showGeneratedResult(
      plantuml || JSON.stringify(data, null, 2),
      selectedDiagramType,
      payload.title || diagramTitle.value,
    );

    resultStatus.textContent = "pronto";

    saveGeneratedDiagram({
      title: payload.title || diagramTitle.value,
      type: selectedDiagramType,
      plantuml,
      elements: countElements(plantuml, selectedDiagramType),
      createdAt: new Date().toISOString(),
      sourceCode: sourceCode.value,
      projectId,
      companyId,
      projectName,
    });

    renderGeneratedDiagrams();
    showToast("Diagrama gerado com sucesso.");
  } catch (error) {
    resultPanel.hidden = false;
    resultStatus.textContent = "erro";
    plantumlResult.textContent = error.message;
    diagramPreview.innerHTML = "<p>Nao foi possivel gerar o diagrama.</p>";
    currentPlantuml = "";
    setExportActionsEnabled(false);
    showToast("Erro ao chamar o Gateway API.");
  } finally {
    setLoading(false);
  }
}

function showGeneratedResult(plantuml, type = selectedDiagramType, title = diagramTitle.value) {
  const resultText = plantuml || "";
  const hasPlantuml = isPlantuml(resultText);

  currentPlantuml = hasPlantuml ? resultText : "";
  currentDiagramTitle = title || diagramTitle.value || "diagrama";
  plantumlResult.textContent = resultText || "Nenhum PlantUML foi retornado.";
  diagramPreview.innerHTML = renderDiagramPreview(plantuml, type, title);
  resultPanel.hidden = false;
  setExportActionsEnabled(Boolean(currentPlantuml));
  window.lucide?.createIcons();
}

function setExportActionsEnabled(enabled) {
  [downloadPumlButton, downloadPngButton, downloadSvgButton].forEach((button) => {
    if (button) {
      button.disabled = !enabled;
    }
  });
}

function setLoading(isLoading) {
  const submitButton = diagramForm.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  submitButton.innerHTML = isLoading
    ? '<span class="loader"></span> Gerando...'
    : '<i data-lucide="send"></i> Gerar Diagrama';
  window.lucide?.createIcons();
}

function seedDemoHistory() {
  if (!localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, JSON.stringify(demoDiagrams));
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveGeneratedDiagram(diagram) {
  const history = getHistory();
  history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...diagram,
  });
  localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 12)));
}

function renderGeneratedDiagrams(history = getHistory()) {
  const filteredHistory = history.filter((diagram) => !diagram.projectId || diagram.projectId === projectId);
  diagramCount.textContent = String(filteredHistory.length);

  if (filteredHistory.length === 0) {
    generatedGrid.innerHTML = '<div class="empty-state">Nenhum diagrama gerado ainda.</div>';
    return;
  }

  generatedGrid.innerHTML = filteredHistory
    .map((diagram) => {
      const config = diagramTypes[diagram.type] || diagramTypes.class;
      return `
        <button class="generated-card ${config.theme}" type="button" data-diagram-id="${escapeHtml(diagram.id)}">
          <span class="element-badge">${escapeHtml(diagram.elements || 0)} elementos</span>
          <i class="generated-icon" data-lucide="${config.icon}"></i>
          <div class="generated-info">
            <h3>${escapeHtml(diagram.title)}</h3>
            <p>${formatDate(diagram.createdAt)}</p>
          </div>
        </button>
      `;
    })
    .join("");
  window.lucide?.createIcons();
}

function extractPlantuml(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  const candidates = [
    data.plantuml,
    data.uml,
    data.diagram,
    data.content,
    data.result?.plantuml,
    data.result?.uml,
    data.result?.diagram,
    data.data?.plantuml,
    data.data?.uml,
    data.data?.diagram,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim()) || "";
}

function getPlantUmlUrls(plantumlText) {
  if (!isPlantuml(plantumlText)) {
    return null;
  }

  const encoded = encodePlantUmlForUrl(plantumlText);

  return {
    png: `https://www.plantuml.com/plantuml/png/${encoded}`,
    svg: `https://www.plantuml.com/plantuml/svg/${encoded}`,
  };
}

function encodePlantUmlForUrl(plantumlText) {
  if (window.plantumlEncoder?.encode) {
    return window.plantumlEncoder.encode(plantumlText);
  }

  return `~h${bytesToHex(new TextEncoder().encode(plantumlText))}`;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function renderDiagramPreview(plantuml, type, title) {
  const urls = getPlantUmlUrls(plantuml);

  if (urls) {
    return `
      <div class="plantuml-image-frame">
        <img class="plantuml-preview-image" src="${urls.svg}" alt="Preview do diagrama" />
        <p class="plantuml-preview-caption">Imagem renderizada pelo PlantUML Server</p>
      </div>
    `;
  }

  return renderLocalDiagramPreview(plantuml, type, title);
}

function renderLocalDiagramPreview(plantuml, type, title) {
  if (type === "architecture") return renderArchitecturePreview();
  if (type === "cloud") return renderCloudPreview();
  if (type === "er") return renderEntityPreview(plantuml);
  if (type === "persona") return renderPersonaPreview();
  if (type === "process") return renderProcessPreview();
  return renderClassPreview(plantuml, title);
}

function renderClassPreview(plantuml, title) {
  const classes = parsePlantumlClasses(plantuml);
  const fallback = [{ name: title || "Classe", attributes: ["atributos detectados"], methods: ["metodos detectados"] }];
  const items = classes.length ? classes : fallback;

  return `
    <div class="uml-board">
      ${items
        .map(
          (item) => `
            <article class="uml-class">
              <header>${escapeHtml(item.name)}</header>
              <ul>${item.attributes.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
              <ul>${item.methods.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderArchitecturePreview() {
  return `
    <div class="flow-preview">
      <div class="flow-node"><i data-lucide="monitor"></i><span>Frontend</span></div>
      <strong>-></strong>
      <div class="flow-node"><i data-lucide="route"></i><span>Gateway API</span></div>
      <div class="flow-branches">
        <div class="flow-node"><i data-lucide="scan-search"></i><span>Parser API</span></div>
        <div class="flow-node"><i data-lucide="workflow"></i><span>Diagram API</span></div>
      </div>
      <strong>-></strong>
      <div class="flow-node"><i data-lucide="database"></i><span>Banco</span></div>
    </div>
  `;
}

function renderCloudPreview() {
  return `
    <div class="cloud-preview">
      <article><i data-lucide="cloud"></i><strong>Static Web App</strong><span>Frontend</span></article>
      <article><i data-lucide="server"></i><strong>App Service</strong><span>Gateway</span></article>
      <article><i data-lucide="server-cog"></i><strong>App Service</strong><span>Parser</span></article>
      <article><i data-lucide="boxes"></i><strong>App Service</strong><span>Diagram</span></article>
      <article><i data-lucide="database"></i><strong>PostgreSQL</strong><span>Persistencia</span></article>
    </div>
  `;
}

function renderEntityPreview(plantuml) {
  const classes = parsePlantumlClasses(plantuml);
  const entities = classes.length
    ? classes
    : [
        { name: "Usuario", attributes: ["id", "nome", "email"], methods: [] },
        { name: "Pedido", attributes: ["id", "usuario_id", "total"], methods: [] },
        { name: "Produto", attributes: ["id", "nome", "preco"], methods: [] },
      ];

  return `
    <div class="entity-preview">
      ${entities
        .slice(0, 4)
        .map(
          (entity) => `
            <article class="entity-card">
              <header>${escapeHtml(entity.name)}</header>
              ${(entity.attributes.length ? entity.attributes : ["id", "nome"])
                .map((attribute) => `<span>${escapeHtml(attribute.replace(/[+\-#~]/, "").trim())}</span>`)
                .join("")}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPersonaPreview() {
  return `
    <div class="persona-preview">
      <article><i data-lucide="shield-check"></i><strong>Tech Lead</strong><span>Audita arquitetura e documentacao tecnica</span></article>
      <article><i data-lucide="presentation"></i><strong>PM</strong><span>Gera status, relatorios e apresentacoes</span></article>
      <article><i data-lucide="code-2"></i><strong>Desenvolvedor</strong><span>Consulta modulos e entende legado</span></article>
    </div>
  `;
}

function renderProcessPreview() {
  const steps = ["Codigo", "Gateway", "Parser", "Diagram API", "Historico"];
  return `
    <div class="process-preview">
      ${steps.map((step) => `<div class="process-step"><strong>${step}</strong></div>`).join("<strong>-></strong>")}
    </div>
  `;
}

function parsePlantumlClasses(plantuml) {
  if (!plantuml) return [];
  const blocks = [...plantuml.matchAll(/class\s+["']?([\w\s.-]+)["']?\s*\{([\s\S]*?)\}/g)];

  if (blocks.length === 0) {
    return [...plantuml.matchAll(/\bclass\s+["']?([\w\s.-]+)["']?/g)].map((match) => ({
      name: match[1].trim(),
      attributes: [],
      methods: [],
    }));
  }

  return blocks.map((match) => {
    const lines = match[2].split("\n").map((line) => line.trim()).filter(Boolean);
    return {
      name: match[1].trim(),
      attributes: lines.filter((line) => !line.includes("(")),
      methods: lines.filter((line) => line.includes("(")),
    };
  });
}

function buildDemoPlantuml(title) {
  return `@startuml
title ${title}
class Projeto {
  +nome : String
  +gerarDiagrama() : void
}
@enduml`;
}

function isPlantuml(value) {
  return typeof value === "string" && /@start(uml|mindmap|salt|gantt|wbs|json|yaml)/i.test(value);
}

function getDownloadFileName(extension) {
  const baseName = (currentDiagramTitle || diagramTitle.value || "diagrama")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return `${baseName || "diagrama"}.${extension}`;
}

function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

async function downloadFromUrl(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PlantUML Server respondeu HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
}

async function exportRenderedDiagram(format) {
  if (!currentPlantuml) {
    showToast("Nenhum diagrama disponivel para exportacao.");
    return;
  }

  const urls = getPlantUmlUrls(currentPlantuml);

  if (!urls) {
    showToast("Renderizador PlantUML indisponivel.");
    return;
  }

  try {
    await downloadFromUrl(urls[format], getDownloadFileName(format));
    showToast(`${format.toUpperCase()} exportado com sucesso.`);
  } catch {
    showToast(`Erro ao exportar ${format.toUpperCase()}.`);
  }
}

function countElements(plantuml, type = "class") {
  if (["architecture", "cloud", "process"].includes(type)) return 5;
  if (type === "persona" || type === "er") return 3;
  if (!plantuml) return 0;
  return Math.max((plantuml.match(/\bclass\b/g) || []).length, 1);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

