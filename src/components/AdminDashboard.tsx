import { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { 
  ShieldAlert, 
  Users, 
  FileText, 
  Search, 
  Download, 
  Calendar, 
  LogOut,
  FolderOpen,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { db } from "../lib/firebase";
import { ClientFile } from "../types";
import { formatBytes, getFileIcon } from "./FileList";

interface AdminDashboardProps {
  userEmail: string;
  onSignOut: () => Promise<void>;
}

interface AdminUserItem {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  role?: string;
  fileCount: number;
  totalSize: number;
  loadingStats: boolean;
}

export default function AdminDashboard({ userEmail, onSignOut }: AdminDashboardProps) {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserFiles, setSelectedUserFiles] = useState<ClientFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  
  const [currentView, setCurrentView] = useState<"users" | "files">("users");

  // 1. Fetch user accounts in real-time
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      async (snapshot) => {
        const userList: AdminUserItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || "",
            displayName: data.displayName || "",
            createdAt: data.createdAt || "",
            role: data.role || "client",
            fileCount: 0,
            totalSize: 0,
            loadingStats: true,
          };
        });

        setUsers(userList);
        setLoadingUsers(false);

        // Fetch file stats for each user immediately after profiles are loaded
        fetchFileStatsForUsers(userList);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Fetch stats (file count & storage total size) for all users
  const fetchFileStatsForUsers = async (userList: AdminUserItem[]) => {
    try {
      const updatedUsers = await Promise.all(
        userList.map(async (u) => {
          try {
            const filesRef = collection(db, "users", u.id, "files");
            const filesSnap = await getDocs(filesRef);
            
            let totalSize = 0;
            const fileCount = filesSnap.size;
            
            filesSnap.forEach((doc) => {
              const fileData = doc.data();
              totalSize += fileData.size || 0;
            });

            return {
              ...u,
              fileCount,
              totalSize,
              loadingStats: false,
            };
          } catch (err) {
            console.error(`Error loading stats for user ${u.id}:`, err);
            return {
              ...u,
              loadingStats: false,
            };
          }
        })
      );
      setUsers(updatedUsers);
    } catch (err) {
      console.error("Error fetching file stats:", err);
    }
  };

  // 3. Fetch files of the selected user
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserFiles([]);
      return;
    }

    setLoadingFiles(true);
    const filesRef = collection(db, "users", selectedUserId, "files");
    const filesQuery = query(filesRef, orderBy("uploadedAt", "desc"));

    const unsubscribe = onSnapshot(
      filesQuery,
      (snapshot) => {
        const fileList: ClientFile[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Untitled",
            size: data.size || 0,
            type: data.type || "application/octet-stream",
            ownerId: data.ownerId || selectedUserId,
            uploadedAt: data.uploadedAt || "",
          };
        });
        setSelectedUserFiles(fileList);
        setLoadingFiles(false);
      },
      (error) => {
        console.error("Error subscribing to selected user files:", error);
        setLoadingFiles(false);
      }
    );

    return () => unsubscribe();
  }, [selectedUserId]);

  // Handle downloading file
  const handleDownload = (file: ClientFile) => {
    if (!selectedUserId) return;
    const downloadUrl = `/api/files/download/${selectedUserId}/${file.id}?name=${encodeURIComponent(
      file.name
    )}&type=${encodeURIComponent(file.type)}`;
    window.location.href = downloadUrl;
  };

  const handleManageData = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView("files");
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setCurrentView("users");
  };

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      (u.displayName && u.displayName.toLowerCase().includes(term))
    );
  });

  // Filter selected user's files
  const filteredFiles = selectedUserFiles.filter((f) => {
    return f.name.toLowerCase().includes(fileSearch.toLowerCase());
  });

  // Find the selected user info
  const activeUser = users.find((u) => u.id === selectedUserId);

  const totalUsersCount = users.length;
  const globalFilesCount = users.reduce((sum, u) => sum + u.fileCount, 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 mt-2">
          <div className="bg-red-600 rounded-xl p-2.5 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">Admin</h1>
            <p className="text-[10px] text-red-500 font-bold tracking-widest uppercase mt-0.5">Control Panel</p>
          </div>
        </div>

        <div className="px-4 py-4 flex-1 mt-4">
          <button 
            onClick={() => setCurrentView("users")}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl mb-8 transition-colors ${currentView === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Users className="h-5 w-5" />
            <span className="font-semibold text-sm">Users</span>
          </button>

          <div className="mb-3 px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logs & Activity</span>
          </div>
          <button className="w-full flex items-center space-x-3 text-slate-400 hover:text-white hover:bg-slate-800/50 px-4 py-3 rounded-2xl transition-colors cursor-not-allowed opacity-70">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold text-sm">History</span>
          </button>
        </div>

        <div className="p-6 pb-8">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center justify-center space-x-2 border border-slate-700 bg-[#0f172a] hover:bg-slate-800 text-slate-300 px-4 py-3 rounded-2xl transition-colors cursor-pointer text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {currentView === "users" ? (
        <div className="flex-1 overflow-auto bg-slate-50/80">
          <div className="p-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Users</h2>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-slate-500 font-medium">Managing</span>
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-md border border-red-100">Master Repository</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 pt-1">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">System Admin</p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">Authorized Access</p>
                </div>
                <div className="h-11 w-11 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm border-2 border-white">
                  AD
                </div>
              </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Total Users</p>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">{loadingUsers ? "..." : totalUsersCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Global Files</p>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">{loadingUsers ? "..." : globalFilesCount}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Server Status</p>
                <div className="flex items-center space-x-2.5 mt-4">
                  <span className="h-3.5 w-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-lg font-bold text-emerald-600">Healthy</span>
                </div>
              </div>
            </div>

            {/* Search & List container */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-2/5">User</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Files</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const formattedDate = u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A";
                      const initials = (u.displayName || u.email || "U").substring(0, 1).toUpperCase();

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200 shrink-0 text-sm">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{u.displayName || "Client User"}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                            {formattedDate}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span>{u.loadingStats ? "..." : u.fileCount}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => handleManageData(u.id)}
                              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <span>Manage Data</span>
                              <ChevronRight className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && !loadingUsers && (
                  <div className="p-10 text-center text-sm text-slate-500 font-medium">No users found matching your search.</div>
                )}
                {loadingUsers && (
                  <div className="p-10 text-center text-sm text-slate-500 font-medium">Loading user data...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-slate-50/80">
          <div className="p-10 max-w-5xl mx-auto">
            <button 
              onClick={handleBackToUsers}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 mb-8 font-bold transition-colors text-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Users</span>
            </button>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-[600px]">
              {/* Explorer Header */}
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold border border-slate-200 text-xl">
                    {(activeUser?.displayName || activeUser?.email || "U").substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {activeUser?.displayName || "Client User"}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">{activeUser?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-slate-50 rounded-2xl px-5 py-3 border border-slate-200 text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Storage</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                      {formatBytes(selectedUserFiles.reduce((sum, f) => sum + f.size, 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Files */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-3 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-y-auto">
                {loadingFiles ? (
                  <div className="p-16 text-center flex flex-col items-center">
                    <div className="h-6 w-6 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-sm text-slate-500 font-medium">Loading files...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center">
                    <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                      <FolderOpen className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No files found</p>
                    <p className="text-xs text-slate-500 mt-1">This user hasn't uploaded any files yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredFiles.map(file => {
                      const { icon: Icon, color } = getFileIcon(file.name, file.type);
                      const fileDate = file.uploadedAt
                        ? new Date(file.uploadedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A";
                        
                      return (
                        <div key={file.id} className="p-5 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl border ${color} bg-white shadow-xs`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">{file.name}</p>
                              <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono tracking-widest uppercase">{file.type.split("/")[1] || "unknown"}</span>
                                <span>•</span>
                                <span>{fileDate}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <span className="text-xs font-mono font-medium text-slate-500">{formatBytes(file.size)}</span>
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 hover:text-red-600 text-slate-600 rounded-xl transition-all cursor-pointer shadow-xs"
                              title="Download"
                            >
                              <Download className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

