import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as roleService from "../services/roleService";
import * as permissionService from "../services/permissionService";

const RolePermissionsModal = ({ roleId, roleName, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [modules, setModules] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all permissions
      const permResponse = await permissionService.getAllPermissionsApi();
      setPermissions(permResponse.data || []);

      // Extract unique modules
      const uniqueModules = [
        ...new Set(
          (permResponse.data || [])
            .filter((p) => p.module_name)
            .map((p) => p.module_name)
        ),
      ];
      setModules(uniqueModules);

      // Fetch role permissions
      const rolePermResponse = await roleService.getRolePermissionsApi(roleId);
      const assignedIds = rolePermResponse.data
        .filter((p) => p.is_assigned)
        .map((p) => p.id);
      setRolePermissions(rolePermResponse.data || []);
      setSelectedPermissions(assignedIds);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch permissions");
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  // Fetch permissions and role permissions on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Get current assigned permissions
      const currentAssigned = rolePermissions
        .filter((p) => p.is_assigned)
        .map((p) => p.id);

      // Permissions to add
      const toAdd = selectedPermissions.filter((id) => !currentAssigned.includes(id));

      // Permissions to remove
      const toRemove = currentAssigned.filter((id) => !selectedPermissions.includes(id));

      // Add new permissions
      for (const permissionId of toAdd) {
        await roleService.assignPermissionApi({
          role_id: roleId,
          permission_id: permissionId,
        });
      }

      // Remove revoked permissions
      for (const permissionId of toRemove) {
        await roleService.removePermissionApi({
          role_id: roleId,
          permission_id: permissionId,
        });
      }

      setSuccess(t("admin.updateRolePermissionsSuccess"));
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save permissions");
      console.error("Error saving permissions:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter permissions based on search and module
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !selectedModule || permission.module_name === selectedModule;

    return matchesSearch && matchesModule;
  });

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const module = perm.module_name || "General";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("admin.assignPermissionsToRole")}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("admin.role")}: <span className="font-semibold">{roleName}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder={t("admin.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-52 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("admin.allModules")}</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {t("common.loading")}...
            </div>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("admin.noPermissionsFound")}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    📦 {module}
                  </h3>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handleTogglePermission(permission.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {permission.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.code}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            permission.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {permission.status === "active"
                            ? t("admin.statusActive")
                            : t("admin.statusInactive")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionsModal;
