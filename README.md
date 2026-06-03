# Jira to PR - GitHub Agentic Workflow

Convierte un ticket de Jira en un Pull Request automaticamente usando GitHub Agentic Workflows con un patron de orquestacion multi-agente de 4 fases.

## Como funciona

```
Jira issue creado
      |
      v
repository_dispatch --> jira-orchestrator
                              |
                        Paso 0: Lee ticket via MCP de Atlassian + lee archivos del repo
                              |
                        Paso 1: Diseno  (objetivo, historias de usuario, requisitos)
                              |
                        Paso 2: Arquitectura  (decision tecnica, archivos a modificar)
                              |
                        Paso 3: Desarrollo  (crea rama, edita codigo en docs/)
                              |
                        Paso 4: Calidad  (verifica requisitos, max 3 iteraciones)
                              |
                        Paso 5: Pull Request en draft + asigna Copilot
```

## Requisitos previos

- `gh` CLI con extension `gh aw` v0.77.5+
- Cuenta de GitHub con GitHub Copilot
- Cuenta de Jira Cloud con acceso de admin a la org de Atlassian

## Fork y configuracion

### 1. Forkear y clonar

```bash
git clone https://github.com/<tu-usuario>/demo-jira-flow-aw
cd demo-jira-flow-aw
gh aw compile --approve
```

### 2. Configurar GitHub Actions

Repo > **Settings > Actions > General > Workflow permissions** > activar **"Allow GitHub Actions to create and approve pull requests"**.

### 3. Configurar secretos

Repo > **Settings > Secrets and variables > Actions**:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `COPILOT_GITHUB_TOKEN` | Token con permiso Copilot Requests |
| Secret | `ATLASSIAN_BASIC_AUTH` | `echo -n "tu@email.com:API_TOKEN" \| base64` |
| Variable | `ATLASSIAN_SITE_URL` | URL completa de Jira: `https://tu-sitio.atlassian.net` |

Para el token de Atlassian: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### 4. Habilitar API token en Atlassian

Atlassian admin > **Security > Rovo MCP Server** > activar **"Allow authentication via API tokens"**.

### 5. Configurar automatizacion en Jira

Proyecto Jira > **Project settings > Automation > Create rule**:

- **Trigger:** `Issue created`
- **Action:** `Send web request`
  - **URL:** `https://api.github.com/repos/<tu-usuario>/demo-jira-flow-aw/dispatches`
  - **Method:** `POST`
  - **Headers:** `Authorization: Bearer <PAT-con-scope-repo>` y `Content-Type: application/json`
  - **Body:**
    ```json
    {
      "event_type": "jira-ticket",
      "client_payload": {
        "ticket_id": "{{issue.key}}",
        "jira_base_url": "{{baseUrl}}"
      }
    }
    ```

### 6. Activar GitHub Pages

Repo > **Settings > Pages > Branch: main > Folder: /docs** > Save.

La pagina demo queda en `https://<tu-usuario>.github.io/demo-jira-flow-aw/`.

## Uso

### Ejecucion manual (demo en vivo)

```bash
gh aw run jira-orchestrator -f ticket_id=SCRUM-1
```

### Ver logs en tiempo real

```bash
gh aw logs jira-orchestrator
```

### Auditar un run fallido

```bash
gh aw audit <run-id-or-url>
```

### Recompilar despues de cambios al workflow

```bash
gh aw compile --approve
git add .github/workflows/
git commit -m "chore: recompilar workflow"
git push
```

## Ticket de Jira para la demo

El ticket debe incluir en la descripcion el campo `target_repo` para que el agente sepa donde trabajar:

```
target_repo: <owner>/demo-jira-flow-aw
```

Ejemplo de ticket listo para usar:

**Titulo:** Fix broken button  
**Descripcion:**
```
La pagina docs/index.html tiene un boton rojo que llama a showAlert() 
pero esa funcion no existe en docs/app.js, causando un ReferenceError.

Fix: agregar showAlert() en docs/app.js con feedback visible al usuario.

target_repo: <tu-usuario>/demo-jira-flow-aw
```

## Estructura del repo

```
.github/
  workflows/
    jira-orchestrator.md        # Workflow principal - editar aqui
    jira-orchestrator.lock.yml  # Generado por gh aw compile - no editar
  agents/
    Diseno.agent.md
    Arquitectura.agent.md
    Desarrollo.agent.md
    Calidad.agent.md
  CODEOWNERS
docs/
  index.html                    # Pagina demo (GitHub Pages)
  app.js                        # JS con bug para la demo
  style.css
CLAUDE.md                       # Referencia tecnica detallada
README.md
```
