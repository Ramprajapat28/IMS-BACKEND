const { ACCESS_ROLES } = require("../accessmanagement/roleConstants");
const USER_ROLES_INFO = require("../../models/libs/seedConstants");
const AccessPermissionError = require("../../errorhandlers/AccessPermissionError");

class AccessManagement {
  static checkIfAccessGrantedOrThrowError = (allowedRoles = [], { roles }) => {
    // Grant access immediately if allowedRoles includes ALL (no role check needed)
    if (allowedRoles.includes(ACCESS_ROLES.ALL)) {
      return true;
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      throw new AccessPermissionError();
    }

    // Normalize role names from DB for safe comparison
    const roleNames = roles
      .map(r => r?.role_name?.trim().toLowerCase())
      .filter(Boolean);

    // Admin check (case-insensitive)
    if (
      allowedRoles.includes(ACCESS_ROLES.ACCOUNT_ADMIN) &&
      roleNames.includes(ACCESS_ROLES.ACCOUNT_ADMIN.trim().toLowerCase())
    ) {
      return true;
    }
    
    // Super Admin check (case-insensitive)
    if (
      allowedRoles.includes(ACCESS_ROLES.ACCOUNT_SUPER_ADMIN) &&
      roleNames.includes(ACCESS_ROLES.ACCOUNT_SUPER_ADMIN.trim().toLowerCase())
    ) {
      return true;
    }

    // If none of the above match, throw permission error
    throw new AccessPermissionError();
  };
}

module.exports = AccessManagement;
