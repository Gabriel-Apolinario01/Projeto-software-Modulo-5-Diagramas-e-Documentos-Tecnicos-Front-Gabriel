# DocuIA Frontend - Módulo de Diagramas

Frontend estático do **Módulo de Diagramas** da plataforma DocuIA.

Este repositório representa o `docula-frontend` na divisão de microsserviços do grupo.

## Responsabilidade

O frontend permite que o usuário:

- escolha o tipo de diagrama;
- clique em **Novo Diagrama**;
- cole ou digite o código-fonte;
- envie o código para o Gateway API;
- receba o PlantUML;
- visualize o resultado e o histórico local.

## Arquitetura do Grupo

```text
Frontend
   |
   v
Gateway API
   |
   |--> Parser API
   |
   |--> Diagram API
   |
   v
Banco PostgreSQL
```

## Repositórios

| Repo | Função |
| --- | --- |
| `docula-frontend` | Interface visual do módulo de diagramas |
| `docula-gateway-api` | Orquestra fluxo, banco, parser e diagram API |
| `docula-parser-api` | Extrai classes, atributos, métodos e endpoints |
| `docula-diagram-api` | Gera PlantUML, Mermaid ou PNG |

## Endpoint Chamado pelo Front

```text
POST http://127.0.0.1:8000/diagram/class
```

JSON enviado:

```json
{
  "title": "Diagrama UML",
  "source_code": "public class Usuario { private String nome; public void login() { } }"
}
```

Resposta esperada:

```json
{
  "plantuml": "@startuml\nclass Usuario\n@enduml"
}
```

## Configurar Gateway

Edite o arquivo:

```text
src/config.js
```

Local:

```javascript
window.DOCULA_GATEWAY_URL = "http://127.0.0.1:8000";
```

Azure:

```javascript
window.DOCULA_GATEWAY_URL = "https://SEU-GATEWAY.azurewebsites.net";
```

## Rodar Localmente

Entre na pasta:

```powershell
cd "C:\Users\gabri\Downloads\Projeto - Modulo 5 (front)"
```

Suba um servidor estático:

```powershell
python -m http.server 5173
```

Acesse:

```text
http://127.0.0.1:5173
```

## Testar Integração

1. Rode o Gateway API em `http://127.0.0.1:8000`.
2. Rode este frontend em `http://127.0.0.1:5173`.
3. Clique em **Novo Diagrama**.
4. Cole um código Java.
5. Clique em **Gerar Diagrama**.
6. O front chama `POST /diagram/class`.
7. O PlantUML aparece na tela.

## Deploy na Azure

Este projeto pode ser publicado como **Azure Static Web Apps**.

Configuração sugerida:

```text
App location: /
Output location: /
Build command: vazio
```

Após o deploy, atualize `src/config.js` com a URL pública do Gateway.

## Versionamento

Sugestão de commits:

```text
feat(frontend): release v0.1.0 com tela de diagramas
fix(frontend): corrige chamada ao gateway
docs(frontend): adiciona instruções de deploy
```

Versão atual:

```text
v0.1.0
```
