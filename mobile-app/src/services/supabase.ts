import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  institution: string | null;
  plan: 'free' | 'premium' | 'team';
  created_at: string;
}

export interface Disclosure {
  id: string;
  user_id: string;
  assignment_type: string;
  ai_tools: string[];
  usage_description: string;
  generated_disclosure: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  prompt_text: string;
  score: number;
  feedback: string;
  tool_used: string | null;
  created_at: string;
}
