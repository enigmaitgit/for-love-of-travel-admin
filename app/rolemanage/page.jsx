 "use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import ChangeRoleDialog from "../../components/CheckDialogBox";
import { getUsers, updateUserRole } from "../../lib/api-client";

export default function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchParams = {
        search: searchTerm || undefined,
        role: 'all',
        status: 'all',
        page: 1,
        limit: 50
      };

      const response = await getUsers(searchParams);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount and when search term changes
  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  // Filter users based on search term (now handled by API, but keeping for local filtering if needed)
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual checkbox selection
  const handleUserSelect = (userId) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
    setSelectAll(newSelectedUsers.size === filteredUsers.length);
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((_, index) => index)));
    }
    setSelectAll(!selectAll);
  };

  // Handle opening role change dialog
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle saving role changes
  const handleSaveRole = async (userId, newRole) => {
    try {
      // Call API to update user role
      const updatedUser = await updateUserRole(userId, newRole);
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? updatedUser : user
        )
      );
      
      setDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side - Title and Description */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-1">
                Manage RBAC for Admin / Editor / Contributor
              </p>
            </div>
            
            {/* Right Side - View Profile Button */}
            <div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Table Header with Title and Search */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Side - Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
              </div>
              
              {/* Right Side - Search Bar */}
              <div className="relative max-w-md w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Selection Info - Below title and search */}
            {selectedUsers.size > 0 && (
              <div className="mt-4 flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                    Edit Selected
                  </button>
                  <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-700 text-sm border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 border-r border-gray-200 font-semibold text-center w-12">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 border-r border-gray-200 font-semibold text-left">
                    <div className="flex items-center space-x-2">
                      <span>👤</span>
                      <span>Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 border-r border-gray-200 font-semibold text-left">
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span>Email Address</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 border-r border-gray-200 font-semibold text-left">
                    <div className="flex items-center space-x-2">
                      <span>🔐</span>
                      <span>Current Role</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 border-r border-gray-200 font-semibold text-left">
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>Last Modified</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span>⚙️</span>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-lg font-medium">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-red-500">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-4xl">⚠️</span>
                        <span className="text-lg font-medium">Error loading users</span>
                        <span className="text-sm">{error}</span>
                        <button 
                          onClick={fetchUsers}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                <tr
                  key={user._id || index}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        selectedUsers.has(index) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-4 border-r border-gray-200 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(index)}
                          onChange={() => handleUserSelect(index)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={user.avatar || "/media/avatars/300-1.png"}
                              alt={`${user.name} avatar`}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <span className="text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : user.role === 'editor' 
                            ? 'bg-blue-100 text-blue-800' 
                            : user.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                      <td className="px-6 py-4 border-r border-gray-200">
                        <span className="text-gray-500">
                          {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150" 
                            title="Edit User Role"
                          >
                            ✏️
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150" title="Delete User">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-4xl">🔍</span>
                        <span className="text-lg font-medium">No users found</span>
                        <span className="text-sm">Try adjusting your search criteria</span>
                      </div>
                  </td>
                </tr>
                )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Role Change Dialog */}
      <ChangeRoleDialog
        user={selectedUser}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onRoleUpdate={handleSaveRole}
      />
    </div>
  );
}
