import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock para localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock para Web Audio API
class AudioContextMock {
  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: {
        setValueAtTime: vi.fn()
      },
      type: 'sine'
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      }
    };
  }

  get currentTime() {
    return 0;
  }

  get destination() {
    return {};
  }
}

// Asegurar que ambas variantes de AudioContext sean mockeadas correctamente
window.AudioContext = vi.fn().mockImplementation(() => new AudioContextMock()) as any;
(window as any).webkitAudioContext = vi.fn().mockImplementation(() => new AudioContextMock());

// Silenciar los logs en las pruebas
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
