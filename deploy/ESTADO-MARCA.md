# Estado de marca — `/estado-marca`

Consulta pública del trámite de registro.

## Búsqueda

1. **Principal:** CI / RUC (`applicant.dni`) → `GET /api/brands/dni/:dni`
2. **Secundaria:** código UPK → `GET /api/brand/upk/:code`

- 1 resultado con UPK → abre el timeline.
- 2+ resultados → **tarjetas**; al elegir una se abre el detalle.

## Identificador del detalle

El enlace canónico usa el **código UPK generado**:

- `https://ia.ulpik.com/estado-marca/UPK-8N66LY`
- `https://ia.ulpik.com/estado-marca?upk=UPK-8N66LY`
- iframe interno: `/estado-marca/timeline.html?upk=UPK-8N66LY`

## Archivos

| Archivo | Rol |
|---------|-----|
| `public/estado-marca/index.html` | UI de búsqueda |
| `public/estado-marca/timeline.html` | Timeline / detalle (bundle) |
| `server/routes/estadoMarca.ts` | Proxy al brands-manager |

## Proxy

ClaudeCode reenvía a Monorepo:

```bash
BRANDS_API_BASE_URL=http://127.0.0.1:3000
```

El backend Monorepo debe devolver `upk_code` / `upkCode` en la búsqueda por DNI (`findBrandByDni.ts`).
