# Task Manager - Guía de Testing

Esta guía documenta el enfoque de testing para la aplicación Task Manager, incluyendo las pruebas unitarias implementadas, cómo ejecutarlas y las mejores prácticas a seguir.

## Índice

1. [Introducción](#introducción)
2. [Estructura de pruebas](#estructura-de-pruebas)
3. [Casos de prueba](#casos-de-prueba)
4. [Cómo ejecutar las pruebas](#cómo-ejecutar-las-pruebas)
5. [Cobertura de código](#cobertura-de-código)
6. [Mocks y fixtures](#mocks-y-fixtures)
7. [Contribución](#contribución)

## Introducción

La aplicación Task Manager cuenta con un conjunto completo de pruebas unitarias que cubren los componentes, hooks y utilidades principales. Las pruebas están implementadas utilizando:

- **Vitest**: Framework de pruebas rápido compatible con el ecosistema Vite
- **React Testing Library**: Para probar componentes de React desde la perspectiva del usuario
- **jsdom**: Para simular el DOM durante las pruebas

### Enfoque de Testing

Seguimos las mejores prácticas de testing, priorizando:

- **Testing centrado en el usuario**: Probamos la aplicación como lo haría un usuario real
- **Accesibilidad**: Verificamos que los componentes sean accesibles (etiquetas, títulos, roles ARIA)
- **Robustez**: Las pruebas deben ser resistentes a cambios en la implementación

## Estructura de pruebas

El código de prueba está organizado en la carpeta `src/test` con la siguiente estructura:

```
src/
└── test/
    ├── setup.ts              # Configuración global de pruebas
    ├── components/           # Pruebas de componentes React
    │   ├── App.test.tsx
    │   ├── TaskBoard.test.tsx
    │   ├── TaskItem.test.tsx
    │   ├── TaskTimer.test.tsx
    │   ├── TaskTree.test.tsx
    │   └── TimeStatsView.test.tsx
    ├── hooks/               # Pruebas de hooks personalizados
    │   └── useTasks.test.tsx
    └── utils/               # Pruebas de funciones de utilidad
        └── taskUtils.test.ts
```

## Casos de prueba

### Componente App (`App.test.tsx`)

1. Renderiza la aplicación con botones de navegación
2. Muestra la vista Board por defecto (verificado usando atributos y clases)
3. Cambia a vista Tree cuando se hace clic en el botón Tree
4. Cambia a vista Time Stats cuando se hace clic en el botón Stats
5. Crea una nueva tarea usando TaskForm
6. Importa/exporta tareas usando funcionalidad CSV
7. Mantiene el estado del temporizador al cambiar entre vistas

### Componente TaskTimer (`TaskTimer.test.tsx`)

1. Renderiza correctamente con tiempo transcurrido inicial
2. Muestra botón de pausa cuando el temporizador está activo
3. Llama al callback onStart cuando se hace clic en el botón de inicio
4. Llama al callback onPause cuando se hace clic en el botón de pausa
5. Actualiza la visualización del tiempo cada segundo cuando está activo
6. Reproduce un sonido de notificación después de 10 minutos

### Hook useTasks (`useTasks.test.tsx`)

1. Inicializa con tareas vacías
2. Crea una nueva tarea con valores por defecto correctos
3. Crea una subtarea con relación correcta con el padre
4. Elimina una tarea y todas sus subtareas
5. Actualiza las propiedades de la tarea
6. Inicia el temporizador de la tarea y actualiza su estado
7. Pausa el temporizador de la tarea y actualiza el tiempo transcurrido
8. Obtiene tiempo transcurrido para un temporizador activo
9. Pausa el temporizador cuando la tarea se marca como completada
10. Obtiene estadísticas de tiempo para un período específico

### Utilidades de tareas (`taskUtils.test.ts`)

1. Verifica si una tarea puede completarse (sin hijos)
2. Verifica si una tarea puede completarse (todos los hijos completados)
3. Verifica si una tarea no puede completarse (algunos hijos no completados)
4. Construye un árbol a partir de una lista plana de tareas
5. Formatea fechas correctamente
6. Identifica tareas vencidas
7. Obtiene colores de estado correctos
8. Obtiene iconos de estado correctos

### Componente TaskItem (`TaskItem.test.tsx`)

1. Renderiza el título y estado de la tarea
2. Renderiza la descripción de la tarea cuando está expandida
3. Abre el menú al hacer clic en el botón de menú
4. Llama a onUpdateTask al cambiar el estado de la tarea
5. Muestra el componente TaskTimer con tiempo transcurrido
6. Llama a onStartTimer cuando se hace clic en el botón de inicio
7. Llama a onDeleteTask cuando se hace clic en la opción de eliminar

### Componente TaskBoard (`TaskBoard.test.tsx`)

1. Renderiza el tablero con columnas y tareas correctas
2. Renderiza el botón "Add Task" en cada columna
3. Llama a onCreateTask cuando se hace clic en el botón "Add Task"
4. Renderiza el componente TaskTimer para las tareas
5. Muestra detalles de la tarea cuando se hace clic en una tarea

### Componente TaskTree (`TaskTree.test.tsx`)

1. Renderiza el árbol de tareas con tareas padre e hijas
2. Aplica la indentación correcta para tareas anidadas
3. Renderiza componentes TaskTimer para cada tarea
4. Propaga eventos del temporizador al componente padre
5. Pasa el tiempo transcurrido a los componentes hijos correctamente

### Componente TimeStatsView (`TimeStatsView.test.tsx`)

1. Renderiza la vista de estadísticas de tiempo con selector de período
2. Muestra estadísticas de tiempo para tareas
3. Llama a getTimeStatistics con el período seleccionado
4. Muestra entradas de fecha personalizadas cuando se selecciona período "custom"
5. Actualiza el rango de fechas personalizado y obtiene nuevas estadísticas
6. Muestra tiempo total acumulado de todas las tareas
7. Maneja estadísticas vacías de forma elegante

## Cómo ejecutar las pruebas

### Requisitos previos

Asegúrate de tener todas las dependencias instaladas:

```bash
npm install
```

### Ejecutar todas las pruebas

Para ejecutar todas las pruebas en modo watch:

```bash
npm test
```

### Ejecutar pruebas específicas

Para ejecutar un conjunto específico de pruebas:

```bash
npm test -- components/TaskTimer
```

### Ejecutar con cobertura

Para ejecutar las pruebas con informe de cobertura:

```bash
npm run test:coverage
```

Esto generará un informe de cobertura HTML en la carpeta `coverage/`.

### Interfaz de usuario para pruebas (opcional)

Para ejecutar pruebas con una interfaz visual:

```bash
npm run test:ui
```

## Cobertura de código

Nuestro objetivo es mantener una cobertura de código superior al 80% en los módulos críticos:

- `src/components/TaskTimer.tsx`: Enfoque principal en la funcionalidad de notificación de sonido
- `src/hooks/useTasks.ts`: Lógica central de manejo de tareas y temporizadores
- `src/utils/`: Funciones utilitarias que son ampliamente utilizadas

## Mocks y fixtures

En `src/test/setup.ts` se han configurado los siguientes mocks:

- **localStorage**: Mock completo para simular persistencia
- **AudioContext**: Mock para probar la funcionalidad de sonido
- **Temporizadores**: Mock para controlar el tiempo en pruebas con `vi.useFakeTimers()`

## Buenas Prácticas de Accesibilidad

Para asegurar que la aplicación sea accesible y las pruebas sean robustas, seguimos estas prácticas:

1. **Atributos `title` en botones**: Todos los botones deben tener un atributo `title` descriptivo para facilitar su identificación tanto por lectores de pantalla como por los tests.

2. **Asociación de etiquetas e inputs**: Siempre asociar las etiquetas (`label`) con sus campos de entrada (`input`) mediante los atributos `htmlFor` e `id`.

3. **Textos descriptivos**: Usar textos descriptivos que indiquen claramente la función de cada elemento UI.

4. **Roles ARIA**: Utilizar roles ARIA apropiados cuando sea necesario para mejorar la accesibilidad.

5. **Consultas de testing robustas**: Al escribir pruebas:
   - Preferir `getByRole` sobre `getByText` cuando sea posible
   - Usar `getAllByText` o `getAllByTitle` cuando un elemento puede aparecer múltiples veces
   - Implementar selectores específicos para evitar ambigüedades

## Contribución

Al agregar nuevas características, sigue estas pautas para mantener la calidad de las pruebas:

1. Escribe primero las pruebas antes de implementar la funcionalidad (TDD)
2. Asegúrate de que cada componente nuevo tenga un archivo de prueba correspondiente
3. Para nuevos hooks o utilidades, crea pruebas dedicadas
4. Utiliza los mocks existentes para localStorage y AudioContext
5. Ejecuta el conjunto completo de pruebas antes de enviar un PR

---

Con esta guía, cualquier desarrollador puede entender la estrategia de pruebas, ejecutar las pruebas existentes y contribuir con nuevas pruebas para mantener la calidad del código.
