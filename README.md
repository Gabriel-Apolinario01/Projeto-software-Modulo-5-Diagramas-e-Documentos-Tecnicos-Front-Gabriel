# DocuIA Frontend - Modulo de Diagramas

Frontend do modulo de Diagramas e Documentos Tecnicos da plataforma DocuIA.

Este repositorio representa a interface usada pelo usuario para criar, visualizar e acompanhar diagramas gerados a partir de codigo-fonte. Ele faz parte da arquitetura de microsservicos do projeto, mas sua responsabilidade e somente a camada visual.

## Objetivo

O objetivo do frontend e permitir que o usuario escolha um tipo de diagrama, envie um trecho de codigo e visualize o resultado retornado pelos servicos do backend.

A tela segue o padrao visual da plataforma DocuIA, com menu lateral, area principal do modulo, tipos de diagrama e historico de diagramas gerados.

## Funcionalidades

- Selecao de tipos de diagrama.
- Criacao de novo diagrama.
- Campo para envio de codigo-fonte.
- Comunicacao com o Gateway API.
- Exibicao do PlantUML retornado pelo backend.
- Historico local dos diagramas gerados no navegador.

## Tipos de Diagrama

O modulo apresenta seis opcoes de diagramas:

- UML de Classes.
- Arquitetura de Sistema.
- Infraestrutura Cloud.
- Diagrama ER.
- Perfis de Usuario.
- Fluxo de Processo.

Essas opcoes representam tipos de artefatos tecnicos que o usuario pode gerar. Elas nao sao microsservicos separados.

## Arquitetura

O frontend se comunica apenas com o Gateway API. O Gateway e responsavel por acionar os outros servicos do fluxo.

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

## Papel dos Repositorios

| Repositorio | Responsabilidade |
| --- | --- |
| `docula-frontend` | Interface do modulo de diagramas |
| `docula-gateway-api` | Orquestracao entre frontend, banco e APIs internas |
| `docula-parser-api` | Analise do codigo-fonte enviado |
| `docula-diagram-api` | Geracao do diagrama em PlantUML, Mermaid ou PNG |

## Fluxo Principal

1. O usuario abre a pagina de diagramas.
2. Escolhe o tipo de diagrama.
3. Informa ou cola o codigo-fonte.
4. O frontend envia os dados para o Gateway API.
5. O Gateway aciona o Parser API e o Diagram API.
6. O resultado volta para o frontend.
7. O usuario visualiza o diagrama gerado e o historico local.

## Rodar Localmente

Entre na pasta do projeto:

```powershell
cd "C:\Users\gabri\Downloads\Projeto - Modulo 5 (front)"
```

Inicie um servidor local:

```powershell
python -m http.server 5173
```

Acesse no navegador:

```text
http://127.0.0.1:5173
```

Para testar a integracao completa, o Gateway API tambem precisa estar rodando em:

```text
http://127.0.0.1:8000
```

## Escopo deste Repositorio

Este repositorio contem somente o frontend do modulo 5. A logica de parser, geracao de PlantUML, persistencia em banco e orquestracao de microsservicos fica nos repositorios de backend do grupo.

## Versao

Versao inicial do frontend:

```text
v0.1.0
```
