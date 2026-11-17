import { SIGNUP } from '@/theme/signup';
import { useTheme } from '@/theme/ThemeProvider';

// The sign-up screens' colours for the scheme (theme/signup.ts).
export function useSignupLook() {
  const { scheme } = useTheme();
  return SIGNUP[scheme];
}

// The words may grow with the system's text size up to this much (the kit's own cap).
export const SIGNUP_FONT_SCALE = 1.3;
