const gatewayUrlInput = document.querySelector("#gatewayUrl");
const newDiagramButton = document.querySelector("#newDiagramButton");
const modalBackdrop = document.querySelector("#modalBackdrop");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelButton = document.querySelector("#cancelButton");
const diagramForm = document.querySelector("#diagramForm");
const diagramTitle = document.querySelector("#diagramTitle");
const sourceCode = document.querySelector("#sourceCode");
const generatedGrid = document.querySelector("#generatedGrid");
const diagramCount = document.querySelector("#diagramCount");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const plantumlResult = document.querySelector("#plantumlResult");
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
  },
  {
    id: "demo-cloud",
    title: "Infraestrutura Cloud",
    type: "cloud",
    elements: 15,
    createdAt: "2026-05-16T18:12:00",
  },
  {
    id: "demo-er",
    title: "Diagrama ER",
    type: "er",
    elements: 18,
    createdAt: "2026-05-16T17:58:00",
  },
];

gatewayUrlInput.value = defaultGatewayUrl;
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
  showToast("Histórico limpo.");
});

diagramForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await generateDiagram();
});

function openModal(title) {
  diagramTitle.value = title.includes("UML") ? "Diagrama UML" : title;
  resultPanel.hidden = true;
  plantumlResult.textContent = "";
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  sourceCode.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
}

async function generateDiagram() {
  const gatewayUrl = gatewayUrlInput.value.replace(/\/$/, "");
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
    const plantuml = data.plantuml || data.diagram || data.result || "";
    plantumlResult.textContent = plantuml || JSON.stringify(data, null, 2);
    resultPanel.hidden = false;
    resultStatus.textContent = "pronto";

    saveGeneratedDiagram({
      title: payload.title,
      type: "class",
      plantuml,
      elements: countElements(plantuml),
      createdAt: new Date().toISOString(),
    });
    renderGeneratedDiagrams();
    showToast("Diagrama gerado com sucesso.");
  } catch (error) {
    resultPanel.hidden = false;
    resultStatus.textContent = "erro";
    plantumlResult.textContent = error.message;
    showToast("Erro ao chamar o Gateway API.");
  } finally {
    setLoading(false);
  }
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
        <article class="generated-card ${theme}">
          <span class="element-badge">${escapeHtml(diagram.elements || 0)} elementos</span>
          <i class="generated-icon" data-lucide="workflow"></i>
          <div class="generated-info">
            <h3>${escapeHtml(diagram.title)}</h3>
            <p>${formatDate(diagram.createdAt)}</p>
          </div>
        </article>
      `;
    })
    .join("");
  window.lucide?.createIcons();
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
