/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL de base du backend en production (ex: https://poc-meteo-backend.onrender.com).
   * Laisser vide en developpement local : le proxy Vite redirige /api vers localhost:8000.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
