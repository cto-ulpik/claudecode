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
GOOGLE_SHEETS_COMPRA_WEBAPP_URL=https://script.google.com/macros/s/AKfycbzcVAk_FTVu_gy6Zfe597ElY5s86wfNcoPoAhbbHIvAS7eT3-ngk-o_MBcYozLCsV-B/exec
```

## Verificar escritura

```bash
./deploy/test-compra.sh
```

La respuesta de `GET ?data=` **debe** incluir `"row":{...}` con `"version":"2026-09-21-col-N-Q"`. Si solo devuelve `"message":"Encuesta proceso de compra ULPIK activa"`, el despliegue está desactualizado y **no guarda filas**.

Verificar versión:

```bash
curl -sL "$GOOGLE_SHEETS_COMPRA_WEBAPP_URL"
# Debe mostrar: "version":"2026-09-21-col-N-Q"
```

## Frontend

`https://ia.ulpik.com/compra` → `POST /api/compra` → Apps Script → nueva fila en el Sheet.

## Mapeo real de columnas

El Sheet ya traía preguntas propias (J, K, N, O) de un formulario anterior que el
webapp actual no pregunta o que coinciden con una pregunta que sí agregamos. El
mapeo real, verificado contra los encabezados existentes, es:

| Col | Header en el Sheet | Campo JSON | Notas |
|-----|---------------------|------------|-------|
| J | ¿Habías contratado antes servicios con Ulpik? | — | no se pide en el form actual, queda vacía |
| K | ¿Cuál es la facturación anual aproximada de tu negocio? | — | no se pide en el form actual, queda vacía |
| N | ¿Cómo te enteraste de ULPIK? | `conocio` | pregunta nueva del form (paso 3). Si elige "Otro", se escribe `"Otro: <detalle>"` en esta misma columna — no se usa una columna aparte |
| O | Desearías recibir las notificaciones periódicas... | — | no se pide en el form actual, queda vacía |
| P | Columna 1 (genérico/legacy) | — | no se usa |
| Q | ¿Qué podríamos hacer para que su calificación sea un 10/10? ¿Qué faltó? | `npsMejora` | recomendación < 10 |
| R, S | (libres) | — | sin uso |

Redesplegar `Code.gs` con la nueva versión para que el mapeo tome efecto.
