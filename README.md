# ClaudeCode

Aplicacion web en React + Vite + TypeScript con dos rutas:

- `/` Home de herramientas
- `/agentes` Generador de briefs para Agency Agents (155 agentes)

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
```

El artefacto final se genera en `dist/`.

## Deploy con Nginx

Config de ejemplo: `deploy/nginx-claudecode.conf.example`.

Puntos clave:

- `root /var/www/html/claudecode/dist;`
- `try_files $uri $uri/ /index.html;` para soportar rutas SPA como `/agentes`.

Flujo recomendado en servidor:

```bash
cd /var/www/html/claudecode
git pull
npm install
npm run build
sudo nginx -t && sudo systemctl reload nginx
```
