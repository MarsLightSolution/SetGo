import { useAuthStore } from '../../Store/authStore';

/**
 * Save the user after an Account settings change.
 *
 * The account hooks used to write the user to storage directly, so the rest of the app (the
 * auth store behind the profile screen, checkout, etc.) kept the old name/email/phone until a
 * restart. This merges the change into the auth store, which also persists it (credentials
 * and tokens stripped, see secureAuthService.setUserData).
 */
export const saveAccountUser = async (updatedUser) => {
  if (!updatedUser) return;
  const { user, updateUser } = useAuthStore.getState();
  await updateUser({ ...(user || {}), ...updatedUser });
};
