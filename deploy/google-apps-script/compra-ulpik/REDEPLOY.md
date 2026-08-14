# Redesplegar Apps Script compra (obligatorio para guardar)

Si `curl` a la URL devuelve solo:

```json
{"ok":true,"message":"Encuesta proceso de compra ULPIK activa"}
```

**sin** `"version":"2026-06-26-write"`, el despliegue está desactualizado y **no guarda filas**.

## Pasos exactos

1. Abre el spreadsheet **Ulpik - ¿Cómo fue tu proceso de compra...?**
2. **Extensiones → Apps Script**
3. Selecciona **todo** el código y bórralo
4. Pega el contenido completo de `deploy/google-apps-script/compra-ulpik/Code.gs` del repo
5. **Guardar** (Ctrl+S)
6. Menú **Implementar → Gestionar implementaciones**
7. En la fila de tipo **Aplicación web**, clic en el **lápiz (Editar)**
   - Si no hay ninguna, clic **Nueva implementación** → tipo **Aplicación web**
8. Configuración:
   - **Descripción:** compra-write
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier persona
9. Clic **Implementar** (autoriza si pide permisos)
10. Copia la URL `/exec` — debe coincidir con `GOOGLE_SHEETS_COMPRA_WEBAPP_URL`

## Verificar (debe pasar antes de probar /compra)

```bash
curl -sL "https://script.google.com/macros/s/AKfycbzcVAk_FTVu_gy6Zfe597ElY5s86wfNcoPoAhbbHIvAS7eT3-ngk-o_MBcYozLCsV-B/exec"
```

Respuesta esperada:

```json
{"ok":true,"message":"Encuesta proceso de compra ULPIK activa","version":"2026-06-26-write"}
```

Luego:

```bash
./deploy/test-compra.sh
```

Debe mostrar `"row":{...}` y `HTTP:200`.

## Servidor (ya tienes la URL en ecosystem.config.cjs)

```bash
cd /var/www/html/claudecode
git pull && npm run build
pm2 reload ecosystem.config.cjs
```
