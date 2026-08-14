# Auth interna — ia.ulpik.com

Acceso a herramientas internas (`/`, `/agentes`, `/kpi-cto`, etc.) solo para correos Ulpik autorizados.

## Contraseña inicial

Para cuentas **nuevas** (primera vez que arranca la API con la lista):

```
ulpik@2026.
```

Configurable con `AUTH_INITIAL_PASSWORD`. No se sobrescribe si el usuario ya existe en SQLite.

## Sesiones

- Cookie HttpOnly `claudecode_sid`
- Duración máxima: **24 horas**
- Contraseñas: **scrypt** (Node crypto)
- Al cambiar o restablecer contraseña se **revocan todas las sesiones** del usuario

## Flujos

| Ruta | Uso |
|------|-----|
| `/login` | Entrar con correo + contraseña |
| `/olvide-contrasena` | Pide enlace por correo |
| `/restablecer-contrasena?token=…` | Nueva contraseña desde el enlace |
| `/cuenta/contrasena` | Cambiar contraseña (logueado) |

## Correo de renovación

Usa el Apps Script NPS (`GOOGLE_SHEETS_NPS_WEBAPP_URL`) con acción `send-auth-email`.

1. Actualiza `deploy/google-apps-script/nps-ulpik/Code.gs` en el proyecto Apps Script.
2. **Implementar → Nueva implementación** (o editar) como aplicación web.
3. En el servidor:

```bash
APP_BASE_URL=https://ia.ulpik.com
# GOOGLE_SHEETS_NPS_WEBAPP_URL=... (ya suele estar)
pm2 reload ecosystem.config.cjs
```

## Añadir o quitar usuarios

Edita `server/lib/authConfig.ts` (`ALLOWED_USERS`) y reinicia la API. Los nuevos correos se crean con la contraseña inicial; los existentes solo actualizan el nombre.

## APIs

Protegidas: `/api/dashboards`, `/api/sheets`, `/api/send-mailer`  
Públicas: `/api/auth/*` (login/forgot/reset), `/api/compra`, `/api/surveys`, `/api/titulo`, `/api/health`

## Send Mailer

Herramienta interna en `/send-mailer` (requiere sesión). Envía correos por etapa de registro con PDF adjunto vía Apps Script (`action: send-stage-email`). Ver `deploy/SEND-MAILER.md`.
