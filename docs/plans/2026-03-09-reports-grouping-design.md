# Diseño: Reportes agrupados por grupo

**Fecha:** 2026-03-09
**Objetivo:** Mejorar la vista de reportes para detectar alumnos problemáticos y ver incidentes ordenados por grupo.

---

## Contexto

La vista actual (`/reports`) muestra una lista plana sin agrupación ni paginación. Con muchos reportes, el control se pierde. El usuario principal es prefecto/admin que necesita detectar patrones y alumnos reincidentes.

---

## Solución elegida: Opción 1 — Agrupación en `/reports` + página de detalle

### Página `/reports` (refactor)

- La lista plana se reemplaza por **secciones por grupo**.
- Los **filtros existentes** (tipo, fechas) se conservan y afectan a todas las secciones.
- El filtro de grupo pasa a ser opcional: si se selecciona uno, solo aparece esa sección.
- **Orden global de secciones:** grupos con más reportes totales primero.

**Cada sección contiene:**
1. Header con nombre del grupo + total + pills de conteo por tipo (`4 tarde · 3 uniforme · 5 otros`)
2. Hasta 5 reportes, ordenados por alumno con más reportes dentro del grupo primero
3. Botón "Ver todos →" que navega a `/reports/group/[groupId]`

### Página `/reports/group/[groupId]` (nueva)

- **Header:** nombre del grupo + total + pills de conteo por tipo
- **Sub-agrupación por alumno:** cada alumno tiene su mini-sección con total de reportes y lista completa de incidentes (fecha descendente)
- **Orden de alumnos:** más reportes primero
- **Filtros locales:** tipo de incidente + rango de fechas
- **Botón compartir:** link público del grupo (movido desde la página principal)
- **Navegación:** TopBar con botón "← Reportes"

---

## Capa de datos

- **Sin migraciones SQL.**
- `getConductReports()` en `queries.ts` sin cambios.
- Nueva función helper `groupReportsByGroup(reports[])` — transforma el array plano en estructura agrupada client-side:
  ```ts
  {
    group_id, group_grade, group_section,
    total: number,
    countByType: Record<ConductReportType, number>,
    reports: ConductReport[], // ordenados por frecuencia de alumno
  }[]
  ```
- La página de detalle llama `getConductReports({ group_id })` directamente.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/app/reports/page.tsx` | Refactor: lista plana → secciones por grupo |
| `src/app/reports/group/[groupId]/page.tsx` | Nuevo: detalle completo por grupo |
| `src/lib/queries.ts` | Agregar helper `groupReportsByGroup()` |

---

## Fuera de alcance

- Paginación numérica (reemplazada por "Ver todos →")
- Badge de reincidente (descartado, se usa orden por frecuencia)
- Cambios en el esquema de base de datos
