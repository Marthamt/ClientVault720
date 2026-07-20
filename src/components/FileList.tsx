import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  FileText, 
  Image as ImageIcon, 
  FileArchive, 
  Video, 
  Music, 
  Code, 
  File, 
  Trash2, 
  Download,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2
} from "lucide-react";
import { ClientFile } from "../types";

interface FileListProps {
  files: ClientFile[];
  onDeleteFile: (fileId: string) => Promise<void>;
  userId: string;
}

// Format bytes into readable sizes
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Get appropriate icon and color based on file type/extension
export function getFileIcon(fileName: string, fileType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const type = fileType.toLowerCase();

  if (type.includes("image") || ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
    return { icon: ImageIcon, color: "text-emerald-500 bg-emerald-50 border-emerald-100" };
  }
  if (type.includes("pdf") || ["pdf"].includes(ext)) {
    return { icon: FileText, color: "text-rose-500 bg-rose-50 border-rose-100" };
  }
  if (type.includes("zip") || type.includes("compressed") || ["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { icon: FileArchive, color: "text-amber-500 bg-amber-50 border-amber-100" };
  }
  if (type.includes("video") || ["mp4", "mov", "avi", "mkv"].includes(ext)) {
    return { icon: Video, color: "text-indigo-500 bg-indigo-50 border-indigo-100" };
  }
  if (type.includes("audio") || ["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return { icon: Music, color: "text-sky-500 bg-sky-50 border-sky-100" };
  }
  if (type.includes("javascript") || type.includes("json") || type.includes("html") || type.includes("css") || ["js", "ts", "tsx", "json", "html", "css", "py", "rs"].includes(ext)) {
    return { icon: Code, color: "text-violet-500 bg-violet-50 border-violet-100" };
  }
  return { icon: File, color: "text-slate-500 bg-slate-50 border-slate-100" };
}

export default function FileList({ files, onDeleteFile, userId }: FileListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "size" | "uploadedAt">("uploadedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "size") {
      comparison = a.size - b.size;
    } else if (sortField === "uploadedAt") {
      comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    }
    return sortDirection === "desc" ? -comparison : comparison;
  });

  const handleSort = (field: "name" | "size" | "uploadedAt") => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleDelete = async (fileId: string) => {
    setConfirmingId(null);
    setDeletingId(fileId);
    try {
      await onDeleteFile(fileId);
    } catch (error) {
      console.error("Failed to delete file", error);
    } finally {
      setDeletingId(null);
    }
  };

  const getSortIcon = (field: "name" | "size" | "uploadedAt") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-3 w-3 inline-block ml-1" /> : <ChevronDown className="h-3 w-3 inline-block ml-1" />;
  };

  const handleShare = async (file: ClientFile) => {
    const downloadUrl = `${window.location.origin}/api/files/download/${userId}/${file.id}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: `Check out this file: ${file.name}`,
          url: downloadUrl,
        });
      } else {
        await navigator.clipboard.writeText(downloadUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="p-4 border border-slate-100 bg-white rounded-2xl shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-slate-400"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing {sortedFiles.length} of {files.length} portal files
        </div>
      </div>

      {/* Empty State */}
      {sortedFiles.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center shadow-xs">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100/80">
            <File className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {searchQuery ? "No matching files" : "No files uploaded yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            {searchQuery 
              ? "Try adjusting your search terms to find your file." 
              : "Let your clients securely upload and manage their project assets here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* File Header */}
          <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">
            <button 
              className="flex-1 text-left flex items-center hover:text-slate-600 transition-colors select-none font-bold"
              onClick={() => handleSort("name")}
            >
              <span>Name</span>
              {getSortIcon("name")}
            </button>
            <button 
              className="w-32 text-left flex items-center hover:text-slate-600 transition-colors select-none font-bold"
              onClick={() => handleSort("size")}
            >
              <span>Size</span>
              {getSortIcon("size")}
            </button>
            <button 
              className="w-40 text-left flex items-center hover:text-slate-600 transition-colors select-none font-bold"
              onClick={() => handleSort("uploadedAt")}
            >
              <span>Date Modified</span>
              {getSortIcon("uploadedAt")}
            </button>
            <div className="w-32 text-right">Actions</div>
          </div>

          {/* File List Items */}
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {sortedFiles.map((file) => {
                const { icon: Icon, color } = getFileIcon(file.name, file.type);
                const isDeleting = deletingId === file.id;

                return (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 shadow-xs transition-all duration-150 group"
                  >
                    {/* Name column */}
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium truncate font-mono">
                          {file.type || "unknown filetype"}
                        </p>
                      </div>
                    </div>

                    {/* Size Column */}
                    <div className="w-32 text-sm text-slate-500 font-medium">
                      {formatBytes(file.size)}
                    </div>

                    {/* Date Modified Column */}
                    <div className="w-40 text-sm text-slate-500">
                      {new Date(file.uploadedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* Actions Column */}
                    <div className="w-32 flex justify-end items-center gap-1">
                      {confirmingId === file.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                          <span className="text-[10px] text-rose-500 font-bold mr-1">Sure?</span>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Share link */}
                          <button
                            onClick={() => handleShare(file)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                            title="Share File"
                          >
                            <Share2 className="h-4.5 w-4.5" />
                          </button>

                          {/* Download link */}
                          <a
                            href={`/api/files/download/${userId}/${file.id}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`}
                            download={file.name}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                            title="Download File"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </a>

                          {/* Delete action */}
                          <button
                            onClick={() => setConfirmingId(file.id)}
                            disabled={isDeleting}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                            title="Delete File"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
