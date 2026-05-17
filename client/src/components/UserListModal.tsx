import React from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

interface User {
  _id: string;
  name: string;
  profileImage?: string;
  headline?: string;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
}

export default function UserListModal({ isOpen, onClose, title, users }: UserListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden relative flex flex-col animate-fade-in transition-colors">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 italic">No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl hover:border-indigo-100 dark:hover:border-indigo-500/50 hover:shadow-sm transition">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img 
                    src={u.profileImage || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                    alt={u.name} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-600 flex-shrink-0"
                  />
                  <div className="truncate">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.headline || "Member"}</p>
                  </div>
                </div>
                <Link 
                  to={`/profile/${u._id}`}
                  onClick={onClose}
                  className="ml-3 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition whitespace-nowrap"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
