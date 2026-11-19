/** Shared by the root layout (server) and ThemeProvider (client). */
export type Theme = "dark" | "light";
export const THEME_KEY = "theme";

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");document.documentElement.style.colorScheme=t==="light"?"light":"dark";}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
