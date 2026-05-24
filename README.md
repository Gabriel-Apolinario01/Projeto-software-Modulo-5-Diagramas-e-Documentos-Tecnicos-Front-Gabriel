# DoculA Frontend — Módulo de Diagramas

## Descrição

Este repositório contém o frontend do Módulo 5 — Diagramas e Documentos Técnicos da plataforma DoculA/DocuIA. A aplicação é a interface visual usada pelo usuário para gerar, visualizar, exportar e acompanhar diagramas técnicos a partir de código-fonte colado manualmente ou de artefatos reais do projeto vindos do Módulo 2 — Upload/Ingestão.

O frontend não executa parser, IA ou persistência diretamente. Ele se comunica com o Gateway API, que orquestra as chamadas para Parser API, Diagram API, serviço de IA e integrações com outros módulos.

## Objetivo

O objetivo do frontend é permitir que o usuário:

- escolha um tipo de diagrama;
- cole código-fonte manualmente;
- carregue artefatos reais do projeto vindos do Módulo 2;
- selecione arquivos do projeto;
- gere diagramas com IA;
- visualize o resultado em PlantUML;
- exporte diagramas;
- salve diagramas gerados no Módulo 2;
- navegue de forma integrada ao Módulo 1.

## Arquitetura

Fluxo principal entre módulos técnicos:

```txt
Módulo 1
   ↓ envia token, project_id e company_id
Frontend Módulo 5
   ↓
Gateway API
   ↓
Parser API
   ↓
Diagram API
```

Fluxo com o Módulo 2:

```txt
Frontend Módulo 5
   ↓
Gateway API
   ↓
Módulo 2 Upload/Ingestão
   ↓
Artefatos do projeto
   ↓
Gateway API
   ↓
IA / Parser / Diagram API
   ↓
Frontend
```

## Deploy em produção

Frontend:

https://docula-modulo5-front-gabriel-gcgmcjbeg2dze3bs.canadacentral-01.azurewebsites.net/projetos

Gateway API:

https://docula-gateway-api-dzgfg8ghghadeedd.eastus-01.azurewebsites.net/

Swagger/OpenAPI do Gateway:

https://docula-gateway-api-dzgfg8ghghadeedd.eastus-01.azurewebsites.net/docs

Parser API:

https://diagramas-parser-e6dzc7f5ateae3ce.canadacentral-01.azurewebsites.net

Diagram API:

https://diagramas-diagram-eugce0h0bygfdqhf.canadacentral-01.azurewebsites.net

Módulo 2 Upload API:

https://docuia-api-upload.azurewebsites.net

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Fetch API
- LocalStorage
- SessionStorage
- PlantUML Encoder
- PlantUML Server
- Lucide Icons
- Azure App Service

## Funcionalidades

- Seleção de tipos de diagrama.
- Geração de UML de Classes.
- Geração de Arquitetura de Sistema.
- Geração de Infraestrutura Cloud.
- Geração de Diagrama ER.
- Geração de Perfis de Usuário.
- Geração de Fluxo de Processo.
- Entrada manual de código-fonte.
- Entrada por artefatos do projeto vindos do Módulo 2.
- Busca por nome ou tipo dos artefatos.
- Seleção de múltiplos artefatos.
- Geração com IA via Gateway.
- Fallback para fluxo padrão caso IA esteja indisponível.
- Visualização do PlantUML.
- Preview/renderização do diagrama.
- Exportação `.puml`.
- Exportação `.png`.
- Exportação `.svg`.
- Histórico local de diagramas.
- Limpeza do histórico local.
- Integração com JWT do Módulo 1.
- Envio de `Authorization: Bearer TOKEN` ao Gateway.
- Envio de `project_id` e `company_id` ao Gateway.
- Opção de salvar o diagrama gerado no Módulo 2.
- Navegação de retorno para o projeto no Módulo 1.

## Tipos de diagrama

O frontend apresenta cards para os seguintes tipos de diagrama:

- UML de Classes;
- Arquitetura de Sistema;
- Infraestrutura Cloud;
- Diagrama ER;
- Perfis de Usuário;
- Fluxo de Processo.

O frontend seleciona o tipo solicitado pelo usuário e envia essa informação ao Gateway API. O Gateway decide o fluxo técnico adequado para cada tipo de diagrama.

## Integração com Gateway API

Todas as chamadas de geração e integração passam pelo Gateway API. O frontend centraliza a interação do usuário, mas delega processamento, IA, parser, renderização técnica e persistência para os serviços de backend.

Endpoints usados pelo frontend:

- `POST /diagram/class`
- `POST /diagram/architecture`
- `POST /diagram/cloud`
- `POST /diagram/profiles`
- `POST /diagram/flow`
- `POST /api/modulo5/diagramas/gerar-ia`
- `GET /api/modulo5/diagramas/projetos/{projeto_id}/artefatos`

O frontend usa primeiro o endpoint de IA. Se houver erro, tenta o fluxo padrão como fallback.

## Integração com Módulo 1

O Módulo 1 abre o frontend usando a URL:

```txt
https://docula-modulo5-front-gabriel-gcgmcjbeg2dze3bs.canadacentral-01.azurewebsites.net/projetos?id={PROJECT_ID}&token={JWT_TOKEN}&companyId={COMPANY_ID}
```

No frontend:

- `id` vira `project_id`;
- `companyId` vira `company_id`;
- `token` é salvo como `auth_token`;
- o token é removido da URL depois de salvo;
- o frontend envia `Authorization: Bearer TOKEN` para o Gateway;
- a validação real do JWT acontece no Gateway, não no frontend;
- nome e email do usuário podem ser extraídos do payload para exibição visual.

## Integração com Módulo 2

O usuário pode escolher a opção `Usar arquivos do projeto` no modal de geração. Nesse fluxo:

- o frontend chama o Gateway para listar artefatos;
- o Gateway consulta o Módulo 2;
- o frontend mostra os arquivos em uma lista selecionável;
- há busca por nome ou tipo;
- o usuário seleciona os artefatos desejados;
- o frontend envia `artifact_ids` ao Gateway;
- o Gateway baixa os arquivos, chama IA/Parser/Diagram API e devolve o PlantUML;
- se a opção estiver marcada, o Gateway salva o diagrama gerado no Módulo 2.

## Como rodar localmente

Este projeto é um frontend estático. Para rodar localmente com Python:

```powershell
python -m http.server 5173
```

Acesse:

```txt
http://127.0.0.1:5173
```

O Gateway API deve estar acessível. Para ambiente local, configure em `src/config.js` ou por variável global:

```js
window.DOCULA_GATEWAY_URL
```

## Configuração

O arquivo `src/config.js` define as URLs usadas pelo frontend.

Exemplo:

```js
window.DOCULA_GATEWAY_URL = "https://docula-gateway-api-dzgfg8ghghadeedd.eastus-01.azurewebsites.net";
window.DOCIA_MODULE_ONE_URL = "https://docuia-frontend-hdc8hzfqbqebc6cp.brazilsouth-01.azurewebsites.net";
```

Não há API key no frontend. Tokens reais não devem ser fixados no código.

## Fluxo principal de uso

1. Usuário acessa o Módulo 1.
2. Módulo 1 redireciona para o Módulo 5 com `id`, `companyId` e `token`.
3. Frontend salva o contexto em `sessionStorage`/`localStorage`.
4. Usuário escolhe um tipo de diagrama.
5. Usuário escolhe colar código ou usar arquivos do projeto.
6. Se usar arquivos, carrega artefatos do Módulo 2.
7. Usuário seleciona artefatos.
8. Frontend envia requisição ao Gateway.
9. Gateway gera o diagrama.
10. Frontend exibe PlantUML/preview e permite exportação.
11. Opcionalmente, Gateway salva o resultado no Módulo 2.

## Exportação

- `.puml`: baixa o texto PlantUML.
- `.png`: usa renderização via PlantUML Server.
- `.svg`: usa renderização via PlantUML Server.

O token JWT nunca é enviado ao PlantUML Server. Apenas o texto PlantUML é usado para renderização.

## Histórico local

- Diagramas gerados ficam salvos localmente no navegador.
- O histórico usa LocalStorage.
- É possível limpar o histórico.
- O histórico é filtrado por `project_id`.

## Segurança

- O frontend não valida JWT.
- O frontend apenas repassa `Authorization` ao Gateway.
- O token recebido pela URL é removido visualmente após ser salvo.
- Tokens reais não devem ser commitados.
- Chaves de IA ficam no Gateway, não no frontend.

## Versionamento

Versão final: `v1.0.0`

Histórico:

- `v0.1.0` - Primeira versão visual do frontend.
- `v0.2.0` - Integração dos cards com endpoints do Gateway.
- `v0.3.0` - Integração com JWT e contexto do Módulo 1.
- `v0.4.0` - Seleção de artefatos do Módulo 2.
- `v0.4.1` - Busca em artefatos do projeto.
- `v1.0.0` - Versão final do Frontend para entrega do Módulo 5.

## Status atual

```txt
Frontend online
Gateway integrado
Módulo 1 integrado
Módulo 2 integrado
IA via Gateway funcionando
Seleção de artefatos funcionando
Busca de artefatos funcionando
Exportação .puml/.png/.svg funcionando
Histórico local funcionando
Deploy em Azure funcionando
```
