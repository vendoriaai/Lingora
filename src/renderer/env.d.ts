/// <reference types="vite/client" />

// import.meta.env typings. Defining here means the only VITE_ keys that can be
// read by the renderer are the ones we explicitly type.
interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_ID?: string;
  readonly VITE_PUBLIC_ORIGIN?: string;
  readonly VITE_DEV_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
