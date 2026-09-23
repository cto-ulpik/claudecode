# Triple Impact Check — Evaluador de briefs (MQI)

Herramienta: `https://ia.ulpik.com/triple_impact` (pública, mismo patrón que `/titulo`).

## Flujo

1. Ingresar empresa y analista (opcional).
2. Subir PDF/DOCX o pegar texto del brief.
3. El navegador extrae el texto (PDF.js / Mammoth).
4. `POST /api/triple-impact/evaluate` envía el texto al servidor.
5. El servidor llama a OpenAI con `OPENAI_API_KEY` (la misma del correo empático) y el prompt MQI.
6. La UI muestra índice, dimensiones, contraste brief vs redes, briefing para Nico y ficha exportable.

## Briefing para Nico

Tras la evaluación se puede **descargar / copiar** un `.txt` con:

1. Ficha rápida  
2. Semáforo triple impacto (planeta / personas / utilidad)  
3. Evidencia vs relato  
4. Contraste brief vs redes  
5. Gancho de entrevista  
6. Preguntas fuertes  
7. Riesgos reputacionales  
8. Fit con la marca MQI  
9. Recomendación final  

## Redes

Campos opcionales en el formulario: URLs + pegado de bios/captions/about. Sin material, el modelo marca hallazgos como `[SUPUESTO]`.

## Variables

En `.env` / `ecosystem.config.cjs` (misma key que correo empático):

```bash
OPENAI_API_KEY=sk-...
# Opcional; por defecto gpt-4o-mini
# OPENAI_MODEL=gpt-4o-mini
```

Health: `GET /api/triple-impact/health` → `{ ok, openaiConfigured }`.

## Despliegue

```bash
cd /var/www/html/claudecode
git pull origin main
npm run build
# Asegurar OPENAI_API_KEY en ecosystem.config.cjs
pm2 restart claudecode-api --update-env
```

Comprobar:

```bash
curl -s https://ia.ulpik.com/api/triple-impact/health
```
