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

const storageKey = "docula.frontend.diagrams.v1";
const defaultGatewayUrl = window.DOCULA_GATEWAY_URL || "http://127.0.0.1:8000";
const sampleCode = `public class Usuario {
    private String nome;
    private String email;

    public void login() { }
    public void logout() { }
}`;

const demoDiagrams = [
  {
    id: "demo-architecture",
    title: "Arquitetura de Sistema",
    type: "architecture",
    elements: 24,
    createdAt: "2026-05-16T18:21:00",
    plantuml: buildDemoPlantuml("Arquitetura de Sistema"),
  },
  {
    id: "demo-cloud",
    title: "Infraestrutura Cloud",
    type: "cloud",
    elements: 15,
    createdAt: "2026-05-16T18:12:00",
    plantuml: buildDemoPlantuml("Infraestrutura Cloud"),
  },
  {
    id: "demo-er",
    title: "Diagrama ER",
    type: "er",
    elements: 18,
    createdAt: "2026-05-16T17:58:00",
    plantuml: buildDemoPlantuml("Diagrama ER"),
  },
];

sourceCode.value = sampleCode;
seedDemoHistory();
renderGeneratedDiagrams();
window.lucide?.createIcons();

newDiagramButton.addEventListener("click", () => openModal("UML de Classes"));
closeModalButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);

document.querySelectorAll(".type-card").forEach((card) => {
  card.addEventListener("click", () => {
    openModal(card.dataset.title || "UML de Classes");
  });
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

function openModal(title) {
  modalTitle.textContent = "Novo Diagrama";
  diagramForm.hidden = false;
  diagramTitle.value = title.includes("UML") ? "Diagrama UML" : title;
  resultPanel.hidden = true;
  plantumlResult.textContent = "";
  diagramPreview.innerHTML = "";
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  sourceCode.focus();
}

function openHistoryDiagram(diagram) {
  const plantuml = diagram.plantuml || buildDemoPlantuml(diagram.title);
  modalTitle.textContent = diagram.title;
  diagramForm.hidden = true;
  resultStatus.textContent = "salvo";
  showGeneratedResult(plantuml);
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
}

async function generateDiagram() {
  const gatewayUrl = defaultGatewayUrl.replace(/\/$/, "");
  const payload = {
    title: diagramTitle.value,
    source_code: sourceCode.value,
  };

  setLoading(true);

  try {
    const response = await fetch(`${gatewayUrl}/diagram/class`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gateway respondeu HTTP ${response.status}`);
    }

    const data = await response.json();
    const plantuml = extractPlantuml(data);
    showGeneratedResult(plantuml || JSON.stringify(data, null, 2));
    resultStatus.textContent = "pronto";

    saveGeneratedDiagram({
      title: payload.title,
      type: "class",
      plantuml,
      elements: countElements(plantuml),
      createdAt: new Date().toISOString(),
      sourceCode: payload.source_code,
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

function showGeneratedResult(plantuml) {
  plantumlResult.textContent = plantuml || "Nenhum PlantUML foi retornado.";
  diagramPreview.innerHTML = renderDiagramPreview(plantuml);
  resultPanel.hidden = false;
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
  diagramCount.textContent = String(history.length);

  if (history.length === 0) {
    generatedGrid.innerHTML = '<div class="empty-state">Nenhum diagrama gerado ainda.</div>';
    return;
  }

  generatedGrid.innerHTML = history
    .map((diagram, index) => {
      const theme = ["blue", "green", "orange", "purple"][index % 4];
      return `
        <button class="generated-card ${theme}" type="button" data-diagram-id="${escapeHtml(diagram.id)}">
          <span class="element-badge">${escapeHtml(diagram.elements || 0)} elementos</span>
          <i class="generated-icon" data-lucide="workflow"></i>
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

function renderDiagramPreview(plantuml) {
  const classes = parsePlantumlClasses(plantuml);

  if (classes.length === 0) {
    return '<div class="preview-empty">O PlantUML foi recebido, mas nao foi possivel montar a visualizacao.</div>';
  }

  return `
    <div class="uml-board">
      ${classes
        .map(
          (item) => `
            <article class="uml-class">
              <header>${escapeHtml(item.name)}</header>
              <ul>
                ${item.attributes.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
              </ul>
              <ul>
                ${item.methods.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
              </ul>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function parsePlantumlClasses(plantuml) {
  if (!plantuml) {
    return [];
  }

  const blocks = [...plantuml.matchAll(/class\s+["']?([\w\s.-]+)["']?\s*\{([\s\S]*?)\}/g)];

  if (blocks.length === 0) {
    const inlineClasses = [...plantuml.matchAll(/\bclass\s+["']?([\w\s.-]+)["']?/g)];
    return inlineClasses.map((match) => ({
      name: match[1].trim(),
      attributes: [],
      methods: [],
    }));
  }

  return blocks.map((match) => {
    const lines = match[2]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

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

function countElements(plantuml) {
  if (!plantuml) {
    return 0;
  }
  const classCount = (plantuml.match(/\bclass\b/g) || []).length;
  const relationCount = (plantuml.match(/--|<\|--|\*--|o--/g) || []).length;
  return Math.max(classCount + relationCount, 1);
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
