module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de errores
        'docs',     // Documentación
        'style',    // Cambios de formato
        'refactor', // Refactorización
        'test',     // Tests
        'chore',    // Mantenimiento
        'perf',     // Mejoras de rendimiento
        'ci',       // CI/CD
        'build',    // Sistema de build
        'revert'    // Revertir commits
      ]
    ],
    
    // Ámbitos permitidos (opcional pero recomendado)
    'scope-enum': [
      1, // warning, not error
      'always',
      [
        'auth',     // Autenticación
        'tasks',    // Gestión de tareas
        'ui',       // Interfaz de usuario
        'api',      // Lógica de API
        'db',       // Base de datos
        'config',   // Configuración
        'tests',    // Sistema de testing
        'docs',     // Documentación
        'timer',    // Sistema de temporizador
        'hooks',    // React hooks
        'utils',    // Utilidades
        'components' // Componentes React
      ]
    ],
    
    // El tipo debe estar en minúsculas
    'type-case': [2, 'always', 'lower-case'],
    
    // El ámbito debe estar en minúsculas
    'scope-case': [2, 'always', 'lower-case'],
    
    // La descripción debe empezar en minúsculas
    'subject-case': [2, 'always', 'lower-case'],
    
    // La descripción no debe terminar con punto
    'subject-full-stop': [2, 'never', '.'],
    
    // La descripción no debe estar vacía
    'subject-empty': [2, 'never'],
    
    // La descripción debe tener al menos 10 caracteres
    'subject-min-length': [2, 'always', 10],
    
    // La descripción no debe exceder 72 caracteres
    'subject-max-length': [2, 'always', 72],
    
    // El header no debe exceder 100 caracteres
    'header-max-length': [2, 'always', 100],
    
    // Las líneas del cuerpo no deben exceder 100 caracteres
    'body-max-line-length': [1, 'always', 100],
    
    // El pie no debe exceder 100 caracteres por línea
    'footer-max-line-length': [1, 'always', 100]
  }
};
