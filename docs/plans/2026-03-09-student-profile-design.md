# Diseño: Perfil del alumno — métricas de asistencia y conducta

**Fecha:** 2026-03-09
**Objetivo:** Crear una página de perfil por alumno que consolide asistencia acumulada (con tendencia y desglose por materia) y bitácora de conducta, permitiendo además crear reportes directamente desde ahí.

---

## Contexto

El maestro actualmente tiene que navegar entre `/groups/[groupId]` (asistencia sesión por sesión) y `/reports` (conducta) para entender el historial de un alumno. No existe vista del acumulado de asistencia ni tendencia en el tiempo. Esta feature cierra esa brecha.

**Usuario principal:** Maestro
**Dolores resueltos:**
1. No hay acumulado de asistencia por alumno — solo se ve sesión por sesión
2. No hay tendencias (¿está mejorando o empeorando?)
3. Información fragmentada entre páginas distintas

---

## Solución: Ruta `/students/[studentId]`

### Navegación

- **Puntos de entrada:**
  - `/groups/[groupId]` → tocar cualquier fila de alumno
  - `/reports/group/[groupId]` → tocar el nombre de un alumno en un reporte
- **Vuelta:** `router.back()` en el TopBar — funciona desde cualquier punto de entrada

### Estructura de la página

```
TopBar: ← (back)  |  Nombre del alumno
──────────────────────────────────────
[Header]
  Nombre completo + badge del grupo (ej. "2do B")

[Sección: Asistencia]
  • Tarjetas de métricas globales: % presente · total faltas · total tardanzas
  • Gráfica de tendencia — últimas 8 semanas (recharts BarChart)
  • Desglose por materia — lista de clases con % propio, faltas y tardanzas

[Sección: Conducta]
  • Total de incidentes + pills por tipo (Tardanza · Uniforme · Actitud…)
  • Lista cronológica de reportes (fecha, tipo, nota)

[FAB +]  → abre CreateReportDrawer pre-cargado con el alumno
```

---

## Capa de datos

**Sin nuevas migraciones SQL.** Queries nuevas sobre tablas existentes (`attendance_records`, `attendance_sessions`, `classes`, `conduct_reports`).

### Nuevas funciones en `src/lib/queries.ts`

```ts
// Estadísticas globales del alumno en el ciclo
getStudentAttendanceStats(studentId: string): Promise<{
  percentPresent: number
  totalAbsent: number
  totalLate: number
  totalSessions: number
}>

// Agregado semanal para la gráfica (últimas N semanas, default 8)
getStudentAttendanceTrend(studentId: string, weeks?: number): Promise<{
  week: string       // "YYYY-WW" o label "Sem 1"
  present: number
  absent: number
  late: number
}[]>

// Desglose por materia/clase
getStudentAttendanceByClass(studentId: string): Promise<{
  classId: string
  className: string
  percentPresent: number
  totalAbsent: number
  totalLate: number
}[]>

// Conducta — sin cambios, ya existe
getConductReports({ student_id: string })
```

**Fuente de datos:**
- `attendance_records` JOIN `attendance_sessions` JOIN `classes` → asistencia
- `conduct_reports` → bitácora (sin cambios)

---

## Componentes nuevos

| Archivo | Responsabilidad |
|---|---|
| `src/app/students/[studentId]/page.tsx` | Página principal — orquesta todas las secciones |
| `src/components/students/AttendanceStats.tsx` | Tarjetas de métricas globales (%, faltas, tardanzas) |
| `src/components/students/AttendanceTrend.tsx` | Gráfica recharts BarChart — 8 semanas |
| `src/components/students/AttendanceByClass.tsx` | Lista de materias con % individual |
| `src/components/students/ConductSummary.tsx` | Pills por tipo + lista cronológica de reportes |

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/queries.ts` | Agregar 3 nuevas funciones de asistencia |
| `src/app/groups/[groupId]/page.tsx` | Filas de alumnos → link a `/students/[studentId]` |
| `src/app/reports/group/[groupId]/page.tsx` | Nombre del alumno → link a `/students/[studentId]` |

---

## Dependencia nueva

- `recharts` — gráfica de barras para la tendencia de asistencia semanal

---

## Fuera de alcance

- Paginación de reportes de conducta (lista completa desde el inicio)
- Optimización con RPC/SQL para asistencia (se hace client-side; se puede migrar si hay performance issues)
- Vista para padres
- Filtros en el perfil (se agregan en iteración futura)
