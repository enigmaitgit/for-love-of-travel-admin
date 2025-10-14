import React, { useState, useEffect } from "react";

const roles = {
  super_admin: ["All permissions"],
  admin: ["Manage users", "Assign roles", "View reports"],
  editor: ["Edit content", "Publish content"],
  contributor: ["View content only"],
};

export default function ChangeRoleDialog({
  open,
  user,
  onClose,
  onRoleUpdate,
}) {
  const [newRole, setNewRole] = useState("contributor");
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (user && user.role && roles[user.role]) {
      setNewRole(user.role);
    } else {
      setNewRole("contributor");
    }
  }, [user]);

  if (!open || !user) return null;

  const handleSave = () => {
    if (!newRole) return;
    onRoleUpdate(user._id, newRole);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowWarning(true);
    }
  };

  const handleWarningClose = () => {
    setShowWarning(false);
    onClose();
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm mx-4 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Close Dialog?</h3>
                <p className="text-sm text-gray-600">Are you sure you want to close without saving changes?</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleWarningCancel}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWarningClose}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 p-6 animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Change Role
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Update role for <span className="font-medium">{user.name}</span>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Role</label>
          <select
            value={newRole}
            onChange={(e) => {
              const selectedRole = e.target.value;
              if (roles[selectedRole]) {
                setNewRole(selectedRole);
              }
            }}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          >
            {Object.keys(roles).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium">Permissions:</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {(roles[newRole] || []).map((perm, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 border text-gray-700"
              >
                {perm}
              </span>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
