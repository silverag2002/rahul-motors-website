"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { userService } from "../../../lib/api";
import { AdminUser } from "../../../types";
import { toast } from "sonner";
import {
  Plus, Search, RefreshCw, Edit, Trash2, KeyRound,
  ShieldCheck, ShieldOff, ChevronLeft, ChevronRight,
  Users, X, Loader2, Eye, EyeOff, Check, AlertTriangle
} from "lucide-react";
import { formatDate } from "../../../lib/utils";

const USER_TYPE_BADGE: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-amber-100 text-amber-700 border-amber-200",
  user: "bg-gray-100 text-gray-600 border-gray-200",
};

const USER_TYPE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

// ─── Create/Edit User Modal ─────────────────────────────────────────────────
interface UserFormModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: () => void;
}
function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
  const { jwt } = useAuth();
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    user_type: user?.user_type || ("user" as AdminUser["user_type"]),
    confirmed: user?.confirmed ?? true,
  });
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt) return;
    if (!form.username.trim() || !form.email.trim()) { toast.error("Username and email are required"); return; }
    if (!isEdit && !form.password) { toast.error("Password is required for new users"); return; }
    if (!isEdit && form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await userService.updateUser(jwt, user!.id, {
          username: form.username.trim(),
          email: form.email.trim(),
          user_type: form.user_type,
          confirmed: form.confirmed,
        });
        toast.success("User updated");
      } else {
        await userService.createUser(jwt, {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          user_type: form.user_type,
          confirmed: form.confirmed,
        });
        toast.success("User created");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username *</label>
              <input
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="e.g. rahul_admin"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={form.user_type}
                onChange={(e) => setForm(f => ({ ...f, user_type: e.target.value as AdminUser["user_type"] }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, confirmed: !f.confirmed }))}
              className={`w-10 h-5.5 rounded-full transition-colors relative ${form.confirmed ? "bg-amber-500" : "bg-gray-300"}`}
              style={{ height: "22px" }}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.confirmed ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700">Account confirmed (can log in)</span>
          </label>
        </form>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-gray-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ──────────────────────────────────────────────────
interface ChangePasswordModalProps {
  user: AdminUser;
  onClose: () => void;
}
function ChangePasswordModal({ user, onClose }: ChangePasswordModalProps) {
  const { jwt } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (!jwt) return;
    setLoading(true);
    try {
      await userService.changePassword(jwt, user.id, password);
      toast.success(`Password changed for ${user.username}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.username} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoFocus
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {confirm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {confirm === password ? (
                    <Check size={15} className="text-green-500" />
                  ) : (
                    <X size={15} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="pt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password || password !== confirm}
              className="px-5 py-2 text-sm font-semibold text-gray-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────
function DeleteUserDialog({ user, onConfirm, onCancel }: { user: AdminUser; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
        </div>
        <p className="text-sm text-gray-600 mb-1">Permanently delete user account:</p>
        <p className="font-semibold text-gray-900">{user.username}</p>
        <p className="text-sm text-gray-400 mb-4">{user.email}</p>
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-5">
          This cannot be undone. All their data and access will be removed.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center justify-center gap-1.5">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { jwt, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 20;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [changePwdUser, setChangePwdUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async (p = page) => {
    if (!jwt) return;
    setLoading(true);
    try {
      const result = await userService.listUsers(jwt, { search: search || undefined, user_type: filterType || undefined, page: p, pageSize });
      setUsers(result.data);
      setTotal(result.meta.total);
      setPageCount(result.meta.pageCount);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [jwt, page, search, filterType]);

  useEffect(() => { load(page); }, [jwt, page]);
  useEffect(() => { if (page === 1) load(1); else setPage(1); }, [search, filterType]);

  const handleToggleBlock = async (user: AdminUser) => {
    if (!jwt) return;
    setTogglingId(user.id);
    try {
      const updated = await userService.toggleBlock(jwt, user.id);
      toast.success(updated.blocked ? `${user.username} blocked` : `${user.username} unblocked`);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!jwt || !deleteUser) return;
    try {
      await userService.deleteUser(jwt, deleteUser.id);
      toast.success(`${deleteUser.username} deleted`);
      setDeleteUser(null);
      load(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to delete user");
    }
  };

  const getInitials = (username: string) => username.slice(0, 2).toUpperCase();

  const avatarColors = ["bg-amber-500", "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-rose-500", "bg-cyan-500"];
  const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex-1 flex gap-2 min-w-[200px]">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium text-sm rounded-lg transition">
              Search
            </button>
          </form>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button onClick={() => load(page)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { setEditUser(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm rounded-lg transition shrink-0"
          >
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 transition ${user.blocked ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${getAvatarColor(user.id)} rounded-xl flex items-center justify-center shrink-0`}>
                          <span className="text-xs font-bold text-white">{getInitials(user.username)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-1.5">
                            {user.username}
                            {me && user.id === Number(me.id) && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">You</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 sm:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${USER_TYPE_BADGE[user.user_type] || "bg-gray-100 text-gray-600"}`}>
                        {USER_TYPE_LABEL[user.user_type] || user.user_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {user.blocked ? (
                          <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-medium">Blocked</span>
                        ) : user.confirmed ? (
                          <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">Active</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-medium">Unconfirmed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => { setEditUser(user); setShowForm(true); }}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit user info"
                        >
                          <Edit size={14} />
                        </button>
                        {/* Change password */}
                        <button
                          onClick={() => setChangePwdUser(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Change password"
                        >
                          <KeyRound size={14} />
                        </button>
                        {/* Block/Unblock */}
                        <button
                          onClick={() => handleToggleBlock(user)}
                          disabled={togglingId === user.id || (me ? user.id === Number(me.id) : false)}
                          className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                            user.blocked
                              ? "text-gray-400 hover:text-green-600 hover:bg-green-50"
                              : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                          }`}
                          title={user.blocked ? "Unblock user" : "Block user"}
                        >
                          {togglingId === user.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : user.blocked ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <ShieldOff size={14} />
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteUser(user)}
                          disabled={me ? user.id === Number(me.id) : false}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {pageCount} · {total} users</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(5, pageCount))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, pageCount - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-lg transition ${p === page ? "bg-amber-500 text-gray-900 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowForm(false); setEditUser(null); }}
          onSuccess={() => { setShowForm(false); setEditUser(null); load(page); }}
        />
      )}
      {changePwdUser && (
        <ChangePasswordModal
          user={changePwdUser}
          onClose={() => setChangePwdUser(null)}
        />
      )}
      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </div>
  );
}
