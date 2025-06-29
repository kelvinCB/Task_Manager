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
    │   ├── TaskForm.test.tsx
    │   ├── TaskItem.test.tsx
    │   ├── TaskTimer.test.tsx
    │   ├── TaskTree.test.tsx
    │   └── TimeStatsView.test.tsx
    ├── services/            # Pruebas de servicios
    │   └── openaiService.test.ts
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

### Componente TaskForm (`TaskForm.test.tsx`)

#### Renderizado
1. Renderiza el formulario de creación cuando no se proporciona tarea
2. Renderiza el formulario de edición cuando se proporciona una tarea
3. No renderiza cuando `isOpen` es falso
4. Muestra información de subtarea cuando se proporciona `parentId`

#### Interacciones del Formulario
5. Actualiza los campos del formulario correctamente
6. Llama a `onClose` cuando se hace clic en el botón cancelar
7. Llama a `onClose` cuando se hace clic en el botón X
8. Envía el formulario con datos correctos
9. No envía el formulario sin título
10. Recorta espacios en blanco del título y descripción
11. **Preserva datos de timeTracking al editar tareas existentes**
12. **Usa timeTracking por defecto para tareas nuevas**

#### Funcionalidad AI
13. Muestra el icono AI en el campo de descripción
14. Muestra alerta cuando se hace clic en AI sin título
15. Muestra opciones AI cuando se proporciona título y se hace clic en el botón AI
16. Oculta opciones AI cuando se hace clic en cancelar
17. Genera descripción usando el servicio AI
18. Maneja errores de generación AI
19. Deshabilita el botón generar mientras se está generando

#### Restablecimiento del Formulario
20. Restablece el formulario cuando cambia la prop task
21. Restablece el formulario cuando cambia parentId

### Servicio OpenAI (`openaiService.test.ts`)

#### Constructor
1. Se inicializa con variables de entorno
2. *Nota: Tests de validación de API key omitidos debido a limitaciones de mocking en vitest*

#### Generación de Descripción de Tareas
3. Genera descripción de tarea exitosamente
4. Maneja parámetros de modelo O4 (sin temperature, con max_completion_tokens)
5. Maneja parámetros de modelo GPT estándar (con temperature, max_tokens)
6. Lanza error para título de tarea vacío
7. Lanza error para título de tarea con solo espacios en blanco
8. Maneja respuestas de error de la API
9. Maneja errores de red
10. Maneja opciones vacías en la respuesta
11. Maneja estructuras de respuesta alternativas (campo `text`)
12. Maneja campo de contenido directo
13. Maneja contenido vacío con razón de finalización `length`
14. Maneja contenido de respuesta vacío
15. Maneja estructura de respuesta inválida

#### Configuración
16. Retorna verdadero cuando está correctamente configurado
17. *Nota: Test de API key placeholder omitido por limitaciones de mocking*

#### Instancia Singleton
18. Exporta una instancia singleton

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
- **Iconos de Lucide React**: Los iconos de `lucide-react` se mockean para evitar errores de renderizado y asegurar que los tests no dependan de la implementación real de los iconos. Esto se hace en `src/test/components/App.test.tsx`.
- **Componentes de Vista**: Componentes como `TaskBoard`, `TaskTree` y `TimeStatsView` se mockean para aislar los tests de `App.test.tsx` y evitar dependencias complejas. Se utilizan `data-testid` únicos para asegurar consultas de test robustas.
- **Servicio OpenAI**: En `TaskForm.test.tsx` se mockea el servicio OpenAI para probar la funcionalidad AI sin hacer llamadas reales a la API. Se incluyen mocks para `generateTaskDescription` e `isConfigured`.
- **Variables de Entorno**: Se mockean las variables de entorno necesarias para el servicio OpenAI (`VITE_OPENAI_MODEL`, `VITE_OPENAI_API_KEY`) usando `vi.stubGlobal`.
- **Fetch API**: En `openaiService.test.ts` se mockea `global.fetch` para simular respuestas de la API de OpenAI sin hacer llamadas HTTP reales.

## Contexto de tema y modo oscuro

Los componentes que utilizan el hook `useTheme` del contexto de tema deben estar envueltos en el componente `ThemeProvider` durante las pruebas:

```jsx
import { ThemeProvider } from '../../contexts/ThemeContext';

// En el test
render(
  <ThemeProvider>
    <ComponenteQueUsaTheme />
  </ThemeProvider>
);
```

Esto incluye los siguientes componentes:

- `TaskItem`
- `TaskTree`
- `TaskTimer`
- `TaskBoard`
- `TaskForm`
- `TimeStatsView`

No proporcionar el `ThemeProvider` resultará en un error: "useTheme must be used within a ThemeProvider".

## Buenas Prácticas de Accesibilidad

Para asegurar que la aplicación sea accesible y las pruebas sean robustas, seguimos estas prácticas:

1. **Atributos `title` en botones**: Todos los botones deben tener un atributo `title` descriptivo para facilitar su identificación tanto por lectores de pantalla como por los tests.
2. **Contraste adecuado**: Los componentes tienen estilos diferentes para modo claro y oscuro para mantener un contraste adecuado y asegurar la visibilidad en ambos temas.

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
