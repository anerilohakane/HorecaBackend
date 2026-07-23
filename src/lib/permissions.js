/**
 * Checks if a user has the required permission for a specific module and action.
 * 
 * @param {Object} user - The user object (usually from request or session).
 * @param {string} module - The name of the module (e.g., 'inventory', 'orders').
 * @param {string} action - The action being performed ('create', 'read', 'update', 'delete').
 * @param {Array<string>} userPermissions - The array of permission strings from the user's department/role.
 * @returns {boolean} - True if the user has permission, false otherwise.
 */
export function hasPermission(user, module, action, userPermissions = []) {
  // 1. View is default for everyone (assuming they are authenticated)
  if (action === 'read') {
    return true;
  }

  // 2. Admin always has full access
  if (user?.role === 'admin') {
    return true;
  }

  // 3. Check for specific granular permission (e.g., 'inventory:create')
  const requiredPermission = `${module}:${action}`;
  
  // If the user's permissions array includes the specific module:action string
  if (userPermissions && Array.isArray(userPermissions)) {
    return userPermissions.includes(requiredPermission);
  }

  return false;
}

/**
 * Helper to be used in Next.js API Routes to quickly authorize requests.
 * 
 * @param {Object} user - The user object.
 * @param {string} module - The name of the module being accessed.
 * @param {string} action - The action being attempted.
 * @param {Array<string>} userPermissions - The permissions array from the database for this user.
 * @returns {Object|null} - Returns an error object (e.g., { status: 403 }) if unauthorized, or null if authorized.
 */
export function authorizeApiRequest(user, module, action, userPermissions) {
    if (!hasPermission(user, module, action, userPermissions)) {
        return {
            error: "Forbidden: You do not have permission to perform this action.",
            status: 403
        };
    }
    return null; // Authorized
}
