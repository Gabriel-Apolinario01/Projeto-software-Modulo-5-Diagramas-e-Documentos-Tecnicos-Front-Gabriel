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

const storageKey = "docula.frontend.diagrams.only.v1";
const defaultGatewayUrl = window.DOCULA_GATEWAY_URL || "http://127.0.0.1:8000";

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get("projectId") || urlParams.get("id") || "demo";
const projectName = urlParams.get("projectName") || urlParams.get("name") || "Sistema E-commerce";
backProjectLabel.textContent = "Voltar";

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
  if (window.history.length > 1) {
    window.history.back();
  }
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

async function generateDiagram() {
  const gatewayUrl = defaultGatewayUrl.replace(/\/$/, "");
  const payload = {
    title: diagramTitle.value,
    source_code: sourceCode.value,
    diagram_type: selectedDiagramType,
    type: selectedDiagramType,
    project_id: projectId,
    project_name: projectName,
  };

  setLoading(true);

  try {
    const response = await fetch(`${gatewayUrl}/diagram/class`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gateway respondeu HTTP ${response.status}`);
    }

    const data = await response.json();
    const plantuml = extractPlantuml(data);
    showGeneratedResult(plantuml || JSON.stringify(data, null, 2), selectedDiagramType, payload.title);
    resultStatus.textContent = "pronto";

    saveGeneratedDiagram({
      title: payload.title,
      type: selectedDiagramType,
      plantuml,
      elements: countElements(plantuml, selectedDiagramType),
      createdAt: new Date().toISOString(),
      sourceCode: payload.source_code,
      projectId,
    });
    renderGeneratedDiagrams();
    showToast("Diagrama gerado com sucesso.");
  } catch (error) {
    resultPanel.hidden = false;
    resultStatus.textContent = "erro";
    plantumlResult.textContent = error.message;
    diagramPreview.innerHTML = '<div class="preview-empty">Nao foi possivel gerar o diagrama.</div>';
    showToast("Erro ao chamar o Gateway API.");
  } finally {
    setLoading(false);
  }
}

function showGeneratedResult(plantuml, type = selectedDiagramType, title = diagramTitle.value) {
  plantumlResult.textContent = plantuml || "Nenhum PlantUML foi retornado.";
  diagramPreview.innerHTML = renderDiagramPreview(plantuml, type, title);
  resultPanel.hidden = false;
  window.lucide?.createIcons();
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

function renderDiagramPreview(plantuml, type, title) {
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

