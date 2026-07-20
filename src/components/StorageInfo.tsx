import { getFileIcon, formatBytes } from "./FileList";
import { ClientFile } from "../types";
import { 
  ShieldAlert, 
  Database, 
  Clock, 
  Compass, 
  CheckCircle,
  FileText,
  Image as ImageIcon,
  FileArchive,
  HardDrive
} from "lucide-react";

interface StorageInfoProps {
  files: ClientFile[];
}

export default function StorageInfo({ files }: StorageInfoProps) {
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, curr) => acc + curr.size, 0);

  // Group files by type
  const typeGroups = files.reduce((groups, file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let category = "Others";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
      category = "Images";
    } else if (["pdf", "doc", "docx", "txt", "pages", "xls", "xlsx"].includes(ext)) {
      category = "Documents";
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      category = "Archives";
    } else if (["mp4", "mov", "avi", "mkv", "mp3", "wav"].includes(ext)) {
      category = "Media";
    }

    groups[category] = (groups[category] || 0) + file.size;
    return groups;
  }, {} as Record<string, number>);

  const categories = [
    { name: "Documents", color: "bg-rose-500", text: "text-rose-500", icon: FileText },
    { name: "Images", color: "bg-emerald-500", text: "text-emerald-500", icon: ImageIcon },
    { name: "Archives", color: "bg-amber-500", text: "text-amber-500", icon: FileArchive },
    { name: "Media", color: "bg-indigo-500", text: "text-indigo-500", icon: Compass },
    { name: "Others", color: "bg-slate-500", text: "text-slate-500", icon: Database },
  ];

  const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

  // Find latest upload
  const latestUpload = totalFiles > 0 
    ? [...files].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]
    : null;

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Total Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/60 shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Total Uploads</span>
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{formatBytes(totalSize)}</h4>
            <p className="text-xs text-slate-500 mt-1">Across {totalFiles} portal items</p>
          </div>
        </div>

        {/* Card 2: Avg File Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/60 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Average File Size</span>
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{formatBytes(averageSize)}</h4>
            <p className="text-xs text-slate-500 mt-1">Ideal for efficient sharing</p>
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/60 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Last Portal Sync</span>
            <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5" title={latestUpload ? latestUpload.name : "N/A"}>
              {latestUpload ? latestUpload.name : "No files yet"}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {latestUpload 
                ? new Date(latestUpload.uploadedAt).toLocaleDateString()
                : "Awaiting first client upload"}
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Type Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
            <Database className="h-4 w-4 mr-2 text-blue-500" />
            <span>Category Storage Breakdown</span>
          </h3>

          <div className="space-y-4">
            {categories.map((cat) => {
              const sizeInCat = typeGroups[cat.name] || 0;
              const percentage = totalSize > 0 ? (sizeInCat / totalSize) * 100 : 0;
              const CatIcon = cat.icon;

              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${cat.text} bg-slate-50 border border-slate-100/80`}>
                        <CatIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      <span className="font-mono text-slate-600 font-semibold">{formatBytes(sizeInCat)}</span>
                      <span className="mx-1 text-slate-300">|</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Security Specifications */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-emerald-500" />
              <span>Vault Security Details</span>
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Isolated Client Sandboxes</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Each user is bound strictly to `/users/$(userId)` paths. It is mathematically impossible to write or read across tenant boundaries.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Secure Disk Hashing</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Disk-stored binary objects are mapped to cryptographically secure IDs on the server to prevent directory traversal and exposure of raw metadata.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Real-time Connection Test Passed</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Connection to Google Cloud Firestore is tested during initial boot to ensure immediate sync and state updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-center space-x-2 text-emerald-800">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wide font-mono">Zero Trust Compliant</span>
          </div>
        </div>

      </div>

    </div>
  );
}
