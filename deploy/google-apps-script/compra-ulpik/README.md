# Encuesta proceso de compra → Google Sheet

Spreadsheet: **Ulpik - ¿Cómo fue tu proceso de compra con Ulpik? (Respuestas)**  
Pestaña: **Respuestas de formulario 1**

## Instalación

1. Abre el spreadsheet de respuestas.
2. **Extensiones → Apps Script**.
3. Pega **todo** el contenido de `Code.gs` (debe incluir `doPost` y el bloque `if (p.data)` en `doGet`).
4. **Implementar → Gestionar implementaciones → Editar** (lápiz) en la implementación activa, o **Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la URL `/exec` y configúrala en el servidor:

```bash
GOOGLE_SHEETS_COMPRA_WEBAPP_URL=https://script.google.com/macros/s/AKfycbwAnTCKxLUYJwb4tMNAAGxPsUIYO_FofertmW-FhXlCPGj5FoNw7pmUMmarK5RUJIQA/exec
```

## Verificar escritura

```bash
./deploy/test-compra.sh
```

La respuesta de `GET ?data=` **debe** incluir `"row":{...}`. Si solo devuelve `"message":"Encuesta proceso de compra ULPIK activa"`, el despliegue está desactualizado y **no guarda filas**.

## Frontend

`https://ia.ulpik.com/compra` → `POST /api/compra` → Apps Script → nueva fila en el Sheet.

## Columnas nuevas

| Col | Header | Campo JSON | Condición |
|-----|--------|------------|-----------|
| O | Qué faltó para el 10 (Facilidad) | `facilidadMejora` | facilidad &lt; 10 |
| P | Qué faltó para el 10 (Recomendación) | `npsMejora` | nps &lt; 10 |

Redesplegar `Code.gs` para que se escriban esas columnas. Las filas antiguas quedan con O/P vacías.
