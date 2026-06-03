# Jira to PR - GitHub Agentic Workflow

Convierte un ticket de Jira en un Pull Request automaticamente usando GitHub Agentic Workflows con un patron de orquestacion multi-agente.

## Como funciona

```
Jira issue creado
      |
      v
repository_dispatch --> jira-orchestrator
                              |
                        Paso 0: Lee el ticket via MCP de Atlassian
                              |
                        Paso 1: Diseno  (historias de usuario y requisitos)
                              |
                        Paso 2: Arquitectura  (pila tecnologica y estructura)
                              |
                        Paso 3: Desarrollo  (clona repo destino, escribe codigo)
                              |
                        Paso 4: Calidad  (revision con ciclo de correccion, max 3 iter)
                              |
                        Paso 5: Pull Request en draft + asigna Copilot
```

## Requisitos

- `gh` CLI con extension `gh aw` v0.77.5+
- Cuenta de GitHub con GitHub Copilot
- Cuenta de Jira Cloud (free o superior) con acceso de admin a la org de Atlassian

## Fork y configuracion

### 1. Forkear y clonar

```bash
git clone https://github.com/<tu-usuario>/demo-jira-flow-aw
cd demo-jira-flow-aw
```

### 2. Ajustar el repo destino del codigo

En `.github/workflows/jira-orchestrator.md` cambia el valor por defecto del repo donde se crearan las ramas y PRs:

```yaml
# safe-outputs
allowed-repos:
  - <tu-usuario>/<tu-repo-destino>
```

Recompila despues de cualquier cambio al `.md`:

```bash
gh aw compile --approve
```

### 3. Configurar secretos en GitHub

En el repo > **Settings > Secrets and variables > Actions**, agrega:

| Secreto | Como obtenerlo |
|---|---|
| `COPILOT_GITHUB_TOKEN` | Token con permiso Copilot Requests en tu org de GitHub |
| `ATLASSIAN_BASIC_AUTH` | `echo -n "tu@email.com:TU_API_TOKEN_ATLASSIAN" \| base64` |
| `TARGET_REPO_PAT` | PAT clasico con scope `repo` con acceso al repo destino |

Para el token de Atlassian: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### 4. Habilitar autenticacion por API token en Atlassian

Atlassian admin > **Security > Rovo MCP Server** > activar **Allow authentication via API tokens**.

Sin esto el MCP rechaza la conexion.

### 5. Crear la automatizacion en Jira

En tu proyecto Jira > **Project settings > Automation > Create rule**:

- **Trigger:** `Issue created`
- **Action:** `Send web request`
  - **URL:** `https://api.github.com/repos/<tu-usuario>/demo-jira-flow-aw/dispatches`
  - **Method:** `POST`
  - **Headers:**
    - `Authorization: Bearer <tu-PAT-de-github-con-scope-repo>`
    - `Content-Type: application/json`
  - **Body:**
    ```json
    {
      "event_type": "jira-ticket",
      "client_payload": { "ticket_id": "{{issue.key}}" }
    }
    ```

## Uso

### Ejecucion manual

```bash
gh aw run jira-orchestrator -f ticket_id=PROJ-1
```

### Ver logs en tiempo real

```bash
gh aw logs jira-orchestrator
```

### Auditar un run fallido

```bash
gh aw audit <run-id-or-url>
```

## Tip: repo destino dinamico

Para que el agente cree el codigo en un repo diferente segun el ticket, incluye en la descripcion del issue de Jira:

```
target_repo: <owner>/<repo>
```

El agente lo lee automaticamente. Si no esta presente, usa el repo por defecto configurado en `allowed-repos`.

## Estructura del repo

```
.github/
  workflows/
    jira-orchestrator.md        # Workflow principal - editar aqui
    jira-orchestrator.lock.yml  # Generado por gh aw compile - no editar
  agents/
    Diseno.agent.md             # Rol: historias de usuario y requisitos
    Arquitectura.agent.md       # Rol: pila tecnologica y estructura
    Desarrollo.agent.md         # Rol: escritura de codigo
    Calidad.agent.md            # Rol: revision y correccion
  CODEOWNERS
CLAUDE.md                       # Referencia tecnica de sintaxis gh aw
README.md
```
