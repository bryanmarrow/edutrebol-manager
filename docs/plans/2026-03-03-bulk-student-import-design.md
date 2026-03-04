# Diseño: Carga en lote de alumnos

**Fecha:** 2026-03-03
**Estado:** Aprobado

## Contexto

La pantalla `/classes/[classId]/students` permite agregar alumnos uno por uno. Los maestros tienen listas de grupo en Excel con el formato estándar SEP:

```
AGUILAR CAMACHO MELISSA JATZITI
AGUIRRE ROMERO CESAR NAHUM
ALDANA MORALES YAZMIN
```

Se necesita una opción para pegar esa lista completa y cargar todos los alumnos en un solo paso.

## Formato de entrada

Una línea por alumno. Las primeras 2 palabras son los apellidos (paterno + materno), el resto son el nombre o nombres.

```
AGUILAR CAMACHO MELISSA JATZITI
→ last_name: "AGUILAR CAMACHO"
→ first_name: "MELISSA JATZITI"

ALDANA MORALES YAZMIN
→ last_name: "ALDANA MORALES"
→ first_name: "YAZMIN"
```

Líneas vacías se ignoran. Líneas con menos de 3 palabras se marcan como inválidas y no se importan.

## Flujo de usuario

1. El maestro toca **"Carga en lote"** (botón junto a "Agregar")
2. Se abre un modal con un `<textarea>` y ejemplo de formato
3. Al escribir/pegar, la app parsea en tiempo real y muestra una preview en tabla
4. Las filas inválidas (< 3 palabras) se marcan en rojo
5. El botón **"Importar N alumnos"** solo se habilita si hay al menos 1 fila válida
6. Al confirmar, se hace un insert en lote a Supabase y se cierra el modal

## Reglas del parser

```
función parsearLínea(línea: string):
  palabras = línea.trim().toUpperCase().split(/\s+/)
  si palabras.length < 3 → inválido
  last_name  = palabras[0] + " " + palabras[1]
  first_name = palabras[2..n].join(" ")
```

## Cambios en el código

| Archivo | Cambio |
|---|---|
| `src/app/classes/[classId]/students/page.tsx` | Botón "Carga en lote" + modal de import con textarea y preview |
| `src/lib/queries.ts` | Nueva función `bulkCreateStudents(classId, students[])` usando `insert` con array |

El modal es auto-contenido en `students/page.tsx`, sin componente separado.

## Función de query

```ts
bulkCreateStudents(classId: string, students: { first_name: string; last_name: string }[])
→ insert masivo en tabla `students` con class_id y active: true
```
