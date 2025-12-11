import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language } from '../types';

const translations = {
  en: {
    browse: "Browse",
    liveTv: "Live TV",
    request: "Request",
    admin: "Admin",
    settings: "Settings",
    login: "Login",
    logout: "Logout",
    search_placeholder: "Search titles...",
    search_channels: "Search channels...",
    favorites: "Favorites",
    history: "History",
    all: "All",
    hits: "HITS",
    watch_now: "Watch Now",
    quality: "Quality",
    added_by: "Added by",
    comments: "Comments",
    post: "Post",
    human_check: "Human Check",
    episodes: "Episodes",
    season: "Season",
    episode: "Episode",
    delete: "Delete",
    edit: "Edit",
    update: "Update",
    cancel: "Cancel",
    save: "Save",
    title: "Title",
    description: "Description",
    categories: "Categories",
    my_history: "My Watch History",
    change_password: "Change Password",
    avatar_url: "Avatar URL",
    new_password: "New Password",
    save_changes: "Save Changes",
    no_content: "No content found.",
    welcome_back: "Welcome Back",
    create_account: "Create Account",
    footer_text: "Created by eddit.me | services",
    ban_user: "Ban User",
    unban_user: "Unban User",
    mark_hit: "Mark as HIT",
    // New
    notifications: "Notifications",
    add_notification: "Add Notification",
    message: "Message",
    sticky: "Sticky (Always Visible)",
    dismissible: "Dismissible",
    registered_at: "Registered",
    last_active: "Last Active",
    profile_stats: "Profile Stats"
  },
  pl: {
    browse: "Przeglądaj",
    liveTv: "Telewizja",
    request: "Prośby",
    admin: "Panel Admina",
    settings: "Ustawienia",
    login: "Zaloguj",
    logout: "Wyloguj",
    search_placeholder: "Szukaj...",
    search_channels: "Szukaj kanałów...",
    favorites: "Ulubione",
    history: "Historia",
    all: "Wszystkie",
    hits: "HITY",
    watch_now: "Oglądaj",
    quality: "Jakość",
    added_by: "Dodane przez",
    comments: "Komentarze",
    post: "Opublikuj",
    human_check: "Weryfikacja",
    episodes: "Odcinki",
    season: "Sezon",
    episode: "Odcinek",
    delete: "Usuń",
    edit: "Edytuj",
    update: "Aktualizuj",
    cancel: "Anuluj",
    save: "Zapisz",
    title: "Tytuł",
    description: "Opis",
    categories: "Kategorie",
    my_history: "Historia Oglądania",
    change_password: "Zmień Hasło",
    avatar_url: "Link do Avatara",
    new_password: "Nowe Hasło",
    save_changes: "Zapisz Zmiany",
    no_content: "Brak treści.",
    welcome_back: "Witaj ponownie",
    create_account: "Stwórz konto",
    footer_text: "Stworzone przez eddit.me | services",
    ban_user: "Zbanuj",
    unban_user: "Odbanuj",
    mark_hit: "Oznacz jako HIT",
    // New
    notifications: "Powiadomienia",
    add_notification: "Dodaj Powiadomienie",
    message: "Wiadomość",
    sticky: "Przypięte (Zawsze widoczne)",
    dismissible: "Można zamknąć",
    registered_at: "Rejestracja",
    last_active: "Ostatnia aktywność",
    profile_stats: "Statystyki profilu"
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('pl'); // Default PL

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
