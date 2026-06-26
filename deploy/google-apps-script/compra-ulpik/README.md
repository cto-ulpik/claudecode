# Encuesta proceso de compra → Google Sheet

Spreadsheet: **Ulpik - ¿Cómo fue tu proceso de compra con Ulpik? (Respuestas)**  
Pestaña: **Respuestas de formulario 1**

## Instalación

1. Abre el spreadsheet de respuestas.
2. **Extensiones → Apps Script**.
3. Pega `Code.gs`.
4. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la URL `/exec` y configúrala en el servidor:

```bash
GOOGLE_SHEETS_COMPRA_WEBAPP_URL=https://script.google.com/macros/s/AKfycbwAnTCKxLUYJwb4tMNAAGxPsUIYO_FofertmW-FhXlCPGj5FoNw7pmUMmarK5RUJIQA/exec
```

## Probar

- GET activo: `?` → `{"ok":true,"message":"Encuesta proceso de compra ULPIK activa"}`
- Lectura: `?action=read` o `?action=debug`
- Escritura: `POST` con `{ "action": "append-compra", ...campos }`

## Frontend

`https://ia.ulpik.com/compra` → `POST /api/compra` → Apps Script → nueva fila en el Sheet.
