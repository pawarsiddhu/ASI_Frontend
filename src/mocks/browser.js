import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW browser worker. Started from main.jsx in development only.
 * In production, MSW is bundled but never started — real API takes over.
 */
export const worker = setupWorker(...handlers);
