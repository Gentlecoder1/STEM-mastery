import { useProfile } from './profileContext';
import { usePreferences } from './preferencesContext';

export function useDisplayName(): string {
  const { firstName } = useProfile();
  const { userName } = usePreferences();
  return firstName || userName.trim();
}
