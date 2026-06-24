# ClaudeCode

Aplicacion web en React + Vite + TypeScript con dos rutas:

- `/` Home de herramientas
- `/agentes` Generador de briefs para Agency Agents (155 agentes)

## Desarrollo local

```bash
npm install
npm run dev
```

Arranca Vite (frontend) y la API con SQLite en el puerto `3001`. Los dashboards del visualizador se guardan en `data/dashboards.db` (compartidos entre navegadores y usuarios con acceso a la app).

## Build de produccion

```bash
npm run build
npm start
```

- `dist/` — frontend estático.
- `data/dashboards.db` — base SQLite (no se sube a git; persiste en el servidor).
- `npm start` sirve API + SPA en el puerto `3001` (`PORT` opcional).

## Deploy con Nginx

Config de ejemplo: `deploy/nginx-claudecode.conf.example`.  
PM2 / variables de entorno: `deploy/ecosystem.config.cjs.example` (incluye URL del Apps Script NPS → Google Sheet).

**Opción A — todo por Node** (`npm start` en `3001`, Nginx hace proxy al puerto):

**Opción B — Nginx sirve `dist/`** y solo hace proxy de `/api` a la API en `3001` (`npm run dev:api` o `tsx server/index.ts` sin `NODE_ENV=production`).

Flujo recomendado en servidor:

```bash
cd /var/www/html/claudecode
git pull
npm install
npm run build
# systemd o pm2: npm start  (o dev:api si Nginx sirve dist)
sudo nginx -t && sudo systemctl reload nginx
```

**Páginas públicas** (`/satisfaccion/`, `/titulo/`): son carpetas estáticas en `public/` que Vite copia a `dist/` con `npm run build`. Nginx solo necesita `try_files $uri $uri/ /index.html` — igual que satisfacción, sin bloques extra. Si `/titulo` muestra el login de “Acceso”, ejecuta `npm run build` y comprueba que exista `dist/titulo/index.html`.

