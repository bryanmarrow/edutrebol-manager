---
description: Apply the Talkee English Course template graphic style to the project
---

# 🎨 Talkee Design System Skill

Este documento define las reglas de estilo gráfico basadas en el template "Talkee" de Framer. Debe ser utilizado por agentes IA (como Claude o Gemini) para mantener coherencia visual al crear o modificar componentes, pantallas y layouts en todo el proyecto.

---

## 1. Valores Fundamentales (Design Tokens)

### 1.1 Paleta de Colores (Color Palette)

Añadir y utilizar estrictamente esta paleta en la configuración de la aplicación (e.g., `tailwind.config.ts` o variables CSS).

| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| **Página/Fondo Base** | `#F5F5F5` | Color de fondo principal de las pantallas. |
| **Superficies Claras** | `#FFFFFF` | Tarjetas, contenedores interiores, modales, barras superiores. |
| **Superficies Oscuras** | `#181818` | Interfaz invertida, pie de página, o textos principales muy oscuros. |
| **Gris Medio** | `#8E8E8E` | Textos secundarios, descripciones, íconos inactivos. |
| **Gris Claro (Bordes)** | `#E0E0E0` | Líneas divisorias, bordes sutiles. |
| **Verde Lima (Primario)** | `#BBF451` | Botones principales (CTA), acentos destacados, decoraciones. |
| **Lima Oscuro (Hover)** | `#A6DB46` | Estado activo/hover sobre botones verde lima. |
| **Azul (Secundario)** | `#007AFF` | Enlaces, acentos secundarios, botones informativos. |
| **Azul Oscuro (Hover)** | `#0061D6` | Estado activo/hover sobre botones azules. |

### 1.2 Tipografías (Typography)

El diseño usa fuentes limpias, sin serifa, con ajuste ligeramente apretado para dar un toque moderno.

- **Aileron** (o similar moderna como *Outfit* o *Inter* si Aileron no está disponible): **Fuente Primaria.** Usar para todos los títulos, botones y elementos destacados de la interfaz.
- **Inter**: **Fuente Secundaria.** Usar para cuerpos de texto, descripciones largas, etiquetas y textos pequeños del sistema.
- **Fragment Mono**: Usar para elementos monoespaciados (etiquetas de código, números de versiones, etc).

**Jerarquía Tipográfica (Desktop / Mobile)**:
- `h1`: 80px / 44px, Regular o SemiBold (400-600), interletraje (tracking/letter-spacing) a `-0.02em`.
- `h2`: 60px / 40px, SemiBold (600), interletraje `-0.02em`.
- `h3`: 44px / 32px, SemiBold (600), interletraje `-0.02em`.
- `h4`: 32px / 24px, SemiBold (600), interletraje `-0.02em`.
- `h5`: 24px / 18px, SemiBold (600), interletraje `-0.02em`.
- `p` (Destacado): 20px / 16px, Regular, interletraje `-0.01em`.
- `p` (Cuerpo Normal): 16px / 14px, interletraje natural a `0em` o `-0.01em`.

> 💡 **Regla de oro tipográfica**: Aplicar *tracking negativo* (ej. `tracking-tight` o `tracking-tighter` en Tailwind) en encabezados grandes es obligatorio para replicar la estética comprimida y moderna.

### 1.3 Formas y Espaciados (Shapes & Spacing)

- **Border Radius**:
  - Contenedores grandes, tarjetas de secciones, modales: `24px` (Tailwind: `rounded-3xl` o custom).
  - Elementos medianos (inputs, barras herramientas): `16px` (Tailwind: `rounded-2xl`).
  - Botones principales: Píldora `100px` (`rounded-full`) o bien `16px` según contexto y botones redondeados.
  - Avatares e iconos decorativos: Circulares `50%` (`rounded-full`).

- **Gaps y Márgenes (Regla del 8px)**:
  - Todo espaciado debe ser múltiplo de 8px: `8px, 16px, 24px, 32px, 40px, 64px, 80px`.
  - Las secciones principales tienen aire abundante (p.ej., `py-10` a `py-20` en Tailwind).

## 2. Componentes Clave

### 2.1 Botones (Buttons)
- **Botón Primario**: Fondo `#BBF451`, Texto Oscuro `#181818`, Fuente en negrita, redondos, Hover escalado ligero (`scale-95`) o cambio suave a `#A6DB46`.
- **Botón Secundario**: Fondo `#007AFF`, Texto Blanco `#FFFFFF`, Hover `#0061D6`.
- **Botón Terciario (Ghost/Text)**: Texto gris oscurecido, hover con fondo gris muy claro (`#E0E0E0`).

### 2.2 Glassmorphism y Elevaciones
Para paneles flotantes, modales o tooltips, el diseño original de Talkee utiliza el efecto difuminado:
- **Vidrio Esmerilado Oscuro**: Background `#181818` con ~8-14% opacidad (ej: `rgba(24, 24, 24, 0.08)`) combinado con `backdrop-filter: blur(10px)` (Tailwind: `backdrop-blur-md`).
- **Superficies Sueltas**: Sutil sombra flotante y borde superior semi-transparente como luz incidente (`border-t border-white/20`).

### 2.3 Tablas / Grillas
- Bordes redondeados y colores claros con divisiones tenues (`#E0E0E0`).

---

## 3. Guía de Ejecución para Tailwind CSS

Al configurar el diseño en **Tailwind**, se deben agregar los siguientes valores en la extensión del Theme en `tailwind.config.ts`:

```typescript
// tailwind.config.ts snippet
theme: {
  extend: {
    colors: {
      talkee: {
        bg: '#F5F5F5',
        surface: '#FFFFFF',
        dark: '#181818',
        gray: '#8E8E8E',
        lightGray: '#E0E0E0',
        lime: '#BBF451',
        limeHover: '#A6DB46',
        blue: '#007AFF',
        blueHover: '#0061D6'
      }
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Aileron', 'sans-serif'], // O la equivalente moderna configurada
      mono: ['Fragment Mono', 'monospace'],
    }
  }
}
```

Usar estas combinaciones directamente en las vistas, favoreciendo grandes bloques contrastantes (Una sección en #181818 con tipografía en blanco e iconos en verde lima #BBF451, y la siguiente sección en #F5F5F5).
