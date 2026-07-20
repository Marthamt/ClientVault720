import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDocFromServer, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { auth, db, OperationType, handleFirestoreError } from "./lib/firebase";
import Sidebar from "./components/Sidebar";
import Auth from "./components/Auth";
import UploadZone from "./components/UploadZone";
import FileList, { formatBytes } from "./components/FileList";
import StorageInfo from "./components/StorageInfo";
import AdminDashboard from "./components/AdminDashboard";
import { ClientFile } from "./types";
import { Calendar, Server, Cloud, ShieldCheck, Folder, HardDrive, User as UserIcon } from "lucide-react";

// Validate Firestore Connection on App boot as required by rules
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("ClientVault Firestore connection tested successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: Client is offline.");
    } else {
      // Common network or permission error, but Firestore is initialized correctly
      console.log("Firestore initialized and ready.");
    }
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>("files");
  const [isUploading, setIsUploading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize Connection check and Auth state listener
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore files subcollection in real-time when authenticated
  useEffect(() => {
    if (!user) {
      setFiles([]);
      return;
    }

    const filesRef = collection(db, "users", user.uid, "files");
    const unsubscribeFiles = onSnapshot(
      filesRef,
      (snapshot) => {
        const fileList: ClientFile[] = [];
        snapshot.forEach((doc) => {
          fileList.push({ id: doc.id, ...doc.data() } as ClientFile);
        });
        setFiles(fileList);
      },
      (error) => {
        console.error("Error subscribing to files:", error);
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/files`);
      }
    );

    return () => unsubscribeFiles();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!user) return;
    setIsUploading(true);

    try {
      // 1. Read file as base64 string
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read file as base64 string."));
          }
        };
        reader.onerror = (err) => reject(err);
      });

      reader.readAsDataURL(file);
      const base64Content = await base64Promise;

      // 2. Post file to custom Express upload endpoint
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          content: base64Content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to upload file to backend storage.");
      }

      const { fileId } = await response.json();

      // 3. Store file metadata in Firestore (secured under user path)
      const fileDocRef = doc(db, "users", user.uid, "files", fileId);
      try {
        await setDoc(fileDocRef, {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          ownerId: user.uid,
          uploadedAt: new Date().toISOString(),
        });
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${user.uid}/files/${fileId}`);
      }

    } catch (err: any) {
      console.error("Upload file error:", err);
      alert(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;

    try {
      // 1. Delete physical object from server disk
      const response = await fetch(`/api/files/delete/${user.uid}/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.warn("Backend was unable to delete local file or file was not found.");
      }

      // 2. Delete metadata document from Firestore
      const fileDocRef = doc(db, "users", user.uid, "files", fileId);
      try {
        await deleteDoc(fileDocRef);
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.DELETE, `users/${user.uid}/files/${fileId}`);
      }

    } catch (err: any) {
      console.error("Delete file error:", err);
      alert(err.message || "An unexpected error occurred while deleting file metadata.");
    }
  };

  // Render Loader during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-3 font-semibold font-sans">Connecting to ClientVault...</p>
      </div>
    );
  }

  // If user is not logged in, render Auth component
  if (!user) {
    return <Auth />;
  }

  // If user is the system admin, render Admin Dashboard
  if (user.uid === "WZbfGiIXCjZLGfr7WOiANyYlXLm1") {
    return (
      <AdminDashboard 
        userEmail={user.email || ""} 
        onSignOut={handleSignOut} 
      />
    );
  }

  // Calculate totals
  const totalSizeBytes = files.reduce((acc, curr) => acc + curr.size, 0);
  const totalSizeFormatted = formatBytes(totalSizeBytes);
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-800">
      
      {/* Dark Navy Sidebar */}
      <Sidebar
        userEmail={user.email || ""}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSizeFormatted={totalSizeFormatted}
        fileCount={files.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Portal Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
              Client Dashboard
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{user.email}</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white border border-slate-100 py-2.5 px-4 rounded-xl shadow-xs">
            <Calendar className="h-4 w-4 text-slate-400 animate-pulse" />
            <span>{currentDate}</span>
          </div>
        </header>

        {/* Tab View Switcher */}
        {activeTab === "files" ? (
          <div className="space-y-6">
            
            {/* Dashboard Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Files</p>
                  <p className="text-2xl font-bold text-slate-900 font-mono">{files.length}</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100/50">
                  <Folder className="h-6 w-6" />
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Storage Used</p>
                  <p className="text-2xl font-bold text-slate-900 font-mono">{totalSizeFormatted}</p>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100/50">
                  <HardDrive className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Account Status</p>
                  <p className="text-xl font-bold text-emerald-600 flex items-center">
                    Active <ShieldCheck className="h-5 w-5 ml-2" />
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100/50">
                  <UserIcon className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Split layout for action items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Upload Zone (Left/Top) */}
              <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                  <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                  <span>Secure Upload</span>
                </h3>
                <UploadZone onFileSelect={handleUploadFile} isUploading={isUploading} />
              </div>
            </div>

            {/* File List Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider text-[11px] font-mono">Uploaded Assets</h3>
              <FileList files={files} onDeleteFile={handleDeleteFile} userId={user.uid} />
            </div>

          </div>
        ) : (
          <StorageInfo files={files} />
        )}

      </main>
    </div>
  );
}
