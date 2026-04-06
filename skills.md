# Skills del proyecto (Ionic)

Este proyecto es una **app Ionic sin backend** (solo frontend/móvil). A continuación se listan las habilidades/tecnologías relevantes para desarrollarlo y mantenerlo.

## Stack principal

- **Ionic Framework**
- **Angular**
- **TypeScript**
- **HTML5 / CSS3**

## UI / Estilos

- **Ionic UI Components** (ion-button, ion-list, ion-modal, etc.)
- **Responsive design** (mobile-first)
- **Theming** (variables CSS de Ionic, modo claro/oscuro)
- **Accesibilidad** (labels, focus, tamaños táctiles, contraste)

## Navegación y estructura

- **Ionic Router / Angular Router**
- **Lazy loading** de páginas/módulos
- **Guards** y control de acceso *solo del lado cliente*

## Estado y datos (sin backend)

- **Servicios de Angular** para encapsular lógica
- **State management liviano** (RxJS con `BehaviorSubject`, o patrón store simple)
- **Persistencia local**
  - `localStorage` / `sessionStorage`
  - **Ionic Storage**
  - **Capacitor Preferences**

## Capacitor / Funcionalidades nativas (opcional)

- **Capacitor** (build a Android/iOS)
- Plugins típicos:
  - Storage/Preferences
  - Camera
  - Filesystem
  - Share
  - Push Notifications

## Buenas prácticas

- Separación de responsabilidades (páginas vs. componentes vs. servicios)
- Componentes reutilizables
- Tipado estricto en TypeScript
- Manejo consistente de errores y estados de carga
- Optimización básica (evitar renders innecesarios, `trackBy` en listas grandes)
