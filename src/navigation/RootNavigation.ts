import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function isNavigationReady() {
  return navigationRef.isReady();
}

/**
 * Reset app to the Auth -> Login stack (works even if Auth isn't mounted now)
 */
export function resetToLogin() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          // Reset the root to the Auth route and then the nested Login screen
          name: 'Auth',
          state: { routes: [{ name: 'Login' }] },
        },
      ],
    })
  );
}

/**
 * Reset app to Student main tabs
 */
export function resetToStudent() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Student' }],
    })
  );
}

/**
 * Reset app to Admin main tabs
 */
export function resetToAdmin() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Admin' }],
    })
  );
}
