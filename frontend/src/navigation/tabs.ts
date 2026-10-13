import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList, TabKey } from './types';

type Navigation = NavigationProp<RootStackParamList>;

export function navigateToTab(navigation: Navigation, active: TabKey) {
  return (key: TabKey) => {
    if (key === active) return;
    switch (key) {
      case 'Home':
        navigation.navigate('Home');
        break;
      case 'Subjects':
        navigation.navigate('Subjects');
        break;
      case 'Practice':
        navigation.navigate('Practice');
        break;
      case 'Progress':
        navigation.navigate('Progress');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };
}
