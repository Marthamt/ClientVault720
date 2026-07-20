import { LogOut, ShieldCheck, Folder, HardDrive, User } from "lucide-react";

interface SidebarProps {
  userEmail: string;
  onSignOut: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalSizeFormatted: string;
  fileCount: number;
}

export default function Sidebar({
  userEmail,
  onSignOut,
  activeTab,
  setActiveTab,
  totalSizeFormatted,
  fileCount,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0">
      {/* Brand Section */}
      <div className="p-6">
        <div className="flex items-center gap-3 text-white mb-10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight block">ClientVault</span>
            <span className="text-[10px] text-blue-400 uppercase font-semibold tracking-wider block font-mono">Secure Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("files")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === "files"
                ? "bg-blue-600/10 text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Folder className="h-5 w-5" />
            <span>My Files</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === "info"
                ? "bg-blue-600/10 text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardDrive className="h-5 w-5" />
            <span>Portal Storage</span>
          </button>
        </nav>
      </div>

      {/* Storage Indicator & User Profile */}
      <div className="mt-auto p-6 space-y-4">
        {/* Storage Indicator */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400">STORAGE</span>
            <span className="text-xs font-bold text-white">{totalSizeFormatted}</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mb-2">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, Math.min(100, (fileCount > 0 ? 12 : 0) + (fileCount * 4)))}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500">
            {fileCount} {fileCount === 1 ? 'file' : 'files'} securely stored
          </div>
        </div>

        {/* Logged in User info */}
        <div className="flex items-center gap-3 px-2 py-1 text-slate-400 border-t border-slate-800/60 pt-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 text-xs font-bold shrink-0">
            {userEmail ? userEmail.substring(0, 2).toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-500 uppercase font-semibold font-mono">User Sandbox</p>
            <p className="text-xs text-slate-300 truncate font-medium" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/10 border border-transparent hover:border-rose-900/20 rounded-xl transition-all w-full text-xs font-semibold cursor-pointer active:scale-98"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
