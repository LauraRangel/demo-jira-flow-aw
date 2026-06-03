---
on:
  repository_dispatch:
    types: [jira-ticket]
  workflow_dispatch:
    inputs:
      ticket_id:
        description: 'ID del ticket de Jira (ejemplo: DEMO-1)'
        required: true
engine:
  id: copilot
  model: haiku
timeout-minutes: 15

env:
  JIRA_BASE_URL: "${{ vars.ATLASSIAN_SITE_URL }}"

permissions:
  contents: read
  pull-requests: read
  issues: read

tools:
  cli-proxy: true
  github:
    mode: gh-proxy
    toolsets: [default]
  bash: true
  edit:

network:
  allowed:
    - defaults
    - mcp.atlassian.com

mcp-servers:
  jira:
    type: http
    url: "https://mcp.atlassian.com/v1/mcp/authv2"
    headers:
      Authorization: "Basic ${{ secrets.ATLASSIAN_BASIC_AUTH }}"

steps:
  - name: Copy event payload to sandbox-accessible location
    run: |
      if [ ! -f "$GITHUB_EVENT_PATH" ]; then
        echo "::error::Event file not found at $GITHUB_EVENT_PATH"
        exit 1
      fi
      cp "$GITHUB_EVENT_PATH" /tmp/gh-aw/event.json

safe-outputs:
  create-pull-request:
    draft: true
---

# Orquestador Jira a PR

Eres el orquestador. Tu trabajo es convertir un ticket de Jira en codigo listo para revision, ejecutando cuatro fases especializadas en secuencia.

## Paso 0 - Obtener el ticket

Extrae el ID del ticket leyendo el archivo de evento con bash:

```bash
cat /tmp/gh-aw/event.json | jq -r '.client_payload["ticket_id"] // .inputs.ticket_id'
```

Con ese ID, usa las dos herramientas del MCP en secuencia para leer el contenido completo:

1. Llama a `getTeamworkGraphContext` con estos tres argumentos exactos:
   - `cloudId`: `${{ env.JIRA_BASE_URL }}`
   - `objectType`: `JiraWorkItem`
   - `objectIdentifier`: el ID del ticket (ej. `SCRUM-5`)

2. Llama a `getTeamworkGraphObject` con estos dos argumentos exactos (los ARIs vienen del paso anterior):
   - `cloudId`: `${{ env.JIRA_BASE_URL }}`
   - `objects`: un array JSON con los ARIs, por ejemplo: `'["ari:cloud:jira:UUID:issue/ID"]'`
   
   Ejemplo de llamada correcta:
   ```
   jira getTeamworkGraphObject --cloudId https://lauraisa43.atlassian.net --objects '["ari:cloud:jira:4b99d454-...:issue/10036"]'
   ```
   No uses `--objectType` en esta llamada, no es un argumento valido para `getTeamworkGraphObject`.

Del contenido del ticket extrae el campo `target_repo`. Si no existe, usa `LauraRangel/demo-jira-flow-aw`.

Luego lee UNA SOLA VEZ los archivos relevantes del repo (`docs/`) y guarda su contenido en memoria. No los vuelvas a leer en los pasos siguientes.

Si no puedes obtener el ticket, detente y reporta el error.

## Paso 1 - Fase de Diseno

Usando el contenido del ticket (ya lo tienes en memoria, NO lo releas), produce en maximo 10 lineas:
- **Objetivo:** una frase.
- **Historias de usuario:** 2 a 3 (formato: "Como X quiero Y para Z").
- **Requisitos concretos:** lista de puntos claros.

No leas archivos. No escribas codigo.

## Paso 2 - Fase de Arquitectura

Usando la salida del Paso 1 y el contenido del repo (ya en memoria, NO releas), produce en maximo 10 lineas:
- **Decision tecnica:** que cambiar y donde.
- **Archivos a modificar:** lista con nombre y cambio especifico.

No leas archivos. No escribas codigo.

## Paso 3 - Fase de Desarrollo

1. Crea la rama PRIMERO antes de cualquier edicion: `git checkout -b feature/ticket-${{ github.event.inputs.ticket_id }}-${{ github.run_id }}`
2. Edita SOLO los archivos necesarios en `docs/` segun el Paso 2. No leas archivos que ya tienes en memoria.
3. Codigo completo, sin fragmentos.

Si Calidad te devuelve el codigo, correge y vuelve a entregar sin releer todo.

## Paso 4 - Fase de Calidad

Usando el contenido en memoria (NO releas archivos), verifica:
1. El codigo cumple cada requisito del ticket.
2. No hay errores obvios ni codigo incompleto.

- Si hay problemas: lista numerada y vuelve al Paso 3. Maximo 3 iteraciones.
- Si esta bien: **VEREDICTO: APROBADO** y continua.

## Paso 5 - Pull Request

Crea el PR en draft. Descripcion debe incluir el ID del ticket, los cambios realizados y una nota de que requiere revision humana.

## Reglas generales

- NO releas archivos que ya leiste en el Paso 0.
- Trabaja paso a paso, sin saltarte pasos.
- Si algo falla, detente y reporta.
