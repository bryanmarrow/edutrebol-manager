# Diseño: CRUD de Clases con Bottom Drawer

**Fecha:** 2026-02-24
**Estado:** Aprobado

## Contexto

El sistema de asistencia (`asistencia-secu`) actualmente lista las clases del maestro en `/classes`, pero no permite crear, editar ni eliminar clases desde la interfaz. Las clases solo podían agregarse vía SQL/seed. Este diseño agrega un CRUD completo accesible desde la misma página.

## Objetivo

Permitir que el maestro autenticado gestione sus clases (crear, editar, eliminar) directamente desde la app, incluyendo la configuración de horario (días y horas) en el mismo formulario.

## Decisiones de Diseño

- **Patrón UI:** Bottom Drawer (panel deslizable desde abajo, ~80% pantalla) — consistente con el diseño mobile-first de la app
- **Punto de entrada:** Toolbar en la parte superior de `/classes` con botón `+ Nueva Clase`
- **Reutilización:** Un solo componente `ClassFormDrawer` sirve tanto para crear como para editar (modo determinado por prop `classData?`)
- **Sin cambios al schema:** La tabla `classes` ya tiene todos los campos necesarios

## Archivos Afectados

| Archivo | Acción |
|---|---|
| `src/components/ClassFormDrawer.tsx` | Nuevo componente |
| `src/app/classes/page.tsx` | Agregar toolbar y manejo de estado del drawer |
| `src/components/ClassCard.tsx` | Agregar botones de editar y eliminar |
| `src/lib/queries.ts` | Agregar `createClass`, `updateClass`, `deleteClass` |

## Formulario

Campos en el drawer:
- **Nombre de la clase** — texto libre, requerido (ej. "Historia")
- **Grupo** — texto libre, requerido (ej. "1° A")
- **Días** — selector visual tipo chip (L M X J V S D), selección múltiple
- **Hora inicio** — input `time`, requerido
- **Hora fin** — input `time`, requerido

## Flujo de Interacciones

### Crear
1. Toolbar en `/classes` → botón `+ Nueva Clase`
2. Bottom drawer sube con formulario vacío
3. Maestro llena campos → `Guardar`
4. `createClass()` guarda en Supabase con `teacher_id` del maestro autenticado
5. Drawer cierra → lista refresca

### Editar
1. Ícono de lápiz en cada `ClassCard`
2. Drawer sube con datos pre-llenados
3. Maestro modifica → `Guardar`
4. `updateClass()` actualiza en Supabase → lista refresca

### Eliminar
1. Ícono de basura en cada `ClassCard`
2. Confirmación inline en la card (`¿Eliminar?` / `Cancelar`)
3. Confirma → `deleteClass()` → card desaparece de la lista

## Seguridad

- `teacher_id` siempre se obtiene de `getCurrentTeacher()` — nunca del formulario
- Las RLS policies de Supabase ya garantizan que los maestros solo acceden a sus propias clases

## Funciones de Base de Datos a Agregar

```typescript
// src/lib/queries.ts
createClass(teacherId: string, data: { name: string, group_name: string, schedule: Schedule }): Promise<ClassGroup>
updateClass(classId: string, data: { name: string, group_name: string, schedule: Schedule }): Promise<ClassGroup>
deleteClass(classId: string): Promise<void>
```
