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
  model: gpt-4o-mini
timeout-minutes: 15

env:
  JIRA_BASE_URL: "${{ vars.ATLASSIAN_SITE_URL }}"

permissions:
  contents: read
  pull-requests: read
  issues: read

checkout:
  - repository: LauraRangel/agentic-workflows-presentation-gcd26
    github-token: ${{ secrets.TARGET_REPO_PAT }}

tools:
  cli-proxy: true
  github:
    mode: gh-proxy
    toolsets: [default]
    github-token: ${{ secrets.TARGET_REPO_PAT }}
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
    github-token: ${{ secrets.TARGET_REPO_PAT }}
    draft: true
    allowed-repos:
      - LauraRangel/agentic-workflows-presentation-gcd26
  assign-to-agent:
    name: copilot
    target: "*"
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

Del contenido del ticket extrae tambien el campo `target_repo` (formato `owner/repo`). Si el ticket no lo incluye, usa `LauraRangel/agentic-workflows-presentation-gcd26` como valor por defecto.

Si no puedes obtener el ticket, detente y reporta el error.

## Paso 1 - Fase de Diseno

Actua como el agente de diseno. Lee el ticket y produce:
- **Objetivo del ticket:** una frase.
- **Historias de usuario:** lista de 2 a 4 (formato: "Como [usuario] quiero [accion] para [beneficio]").
- **Requisitos concretos:** lista de puntos claros.

No escribas codigo todavia. No decidas tecnologias todavia.

## Paso 2 - Fase de Arquitectura

Actua como el agente de arquitectura. Usando la salida del paso anterior, produce:
- **Pila tecnologica:** lista corta con una justificacion por eleccion. Prefiere soluciones simples y estandar.
- **Estructura de archivos:** arbol simple de carpetas y archivos.
- **Notas de seguridad y rendimiento:** solo si aplican, maximo 3 puntos.

## Paso 3 - Fase de Desarrollo

Actua como el agente de desarrollo. El repo destino ya esta clonado en el workspace actual. Usando el diseno y la arquitectura:
1. Crea una rama nueva desde el workspace actual: `git checkout -b feature/ticket-${{ github.event.inputs.ticket_id }}-${{ github.run_id }}`
2. Escribe el codigo fuente completo y funcional en los archivos definidos.
3. Sigue exactamente la pila tecnologica del paso anterior.
4. Escribe codigo completo, no fragmentos a medias.

Si el agente de calidad te devuelve el codigo con problemas, correlos uno por uno y vuelve a entregar.

## Paso 4 - Fase de Calidad

Actua como el agente de calidad. Usando los requisitos del ticket y el codigo escrito:
1. Verifica que el codigo cumple con cada requisito.
2. Revisa que no haya errores obvios, codigo incompleto o malas practicas.
3. Verifica que sigue la arquitectura definida.

- Si encuentras problemas: lista los problemas numerados y vuelve al Paso 3. Maximo 3 iteraciones en total.
- Si el codigo esta bien: escribe **VEREDICTO: APROBADO** y continua al Paso 5.

## Paso 5 - Pull Request

Crea un Pull Request en draft con todo el codigo implementado.

La descripcion del PR debe incluir:
- El ID del ticket de Jira.
- Las funcionalidades implementadas.
- Las decisiones de arquitectura mas importantes.
- Una nota de que el codigo fue generado por agentes y requiere revision humana.

Despues de crear el PR, asigna Copilot al PR recien creado para que pueda continuar con la revision y mejoras.

## Reglas generales

- Trabaja paso a paso, en orden.
- Mantén un registro corto de lo que hace cada fase.
- No saltes pasos.
- Si algo falla en un paso, detente y reporta que ocurrio.
