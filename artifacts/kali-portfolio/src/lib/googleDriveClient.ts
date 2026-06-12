const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "517807643557-kbak0nkoq9k0qihoqgsqfe60hdfn1obn.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient: any;
let accessToken: string | null = null;

export const initGoogleDrive = (onSuccess: () => void) => {
  if (typeof window === "undefined") return;

  const loadGsi = () => {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error !== undefined) {
          throw response;
        }
        accessToken = response.access_token;
        onSuccess();
      },
    });
  };

  if (!(window as any).google) {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = loadGsi;
    document.body.appendChild(script);
  } else {
    loadGsi();
  }
};

export const authorizeGoogleDrive = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  }
};

export const isGoogleDriveAuthorized = () => !!accessToken;

export const getDriveFileRawUrl = (id: string) => {
  if (!accessToken) return "";
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&access_token=${accessToken}`;
};

export const fetchDriveFiles = async () => {
  if (!accessToken) throw new Error("Not authorized");
  
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='1pmF8nCh1NtN61lWdUjYJhIgK_goTgmhb' in parents and trashed=false&fields=files(id,name,size,webContentLink,mimeType,createdTime)&orderBy=createdTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch Google Drive files");
  const data = await res.json();
  
  return data.files.map((f: any) => ({
    id: f.id,
    file_name: f.name,
    file_size: parseInt(f.size || "0", 10),
    file_url: getDriveFileRawUrl(f.id) || f.webContentLink || "",
    created_at: f.createdTime,
    mime_type: f.mimeType
  }));
};

export const uploadDriveFile = async (file: File) => {
  if (!accessToken) throw new Error("Not authorized");
  
  // 1. Create file with metadata
  const metadata = {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    parents: ["1pmF8nCh1NtN61lWdUjYJhIgK_goTgmhb"],
  };
  
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,webContentLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  
  if (!createRes.ok) throw new Error("Failed to create file metadata in Google Drive");
  const uploadData = await createRes.json();
  const fileId = uploadData.id;

  // 2. Upload file content to the created file ID via PATCH
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload file content to Google Drive");
  
  // Fetch final metadata to return the webContentLink properly
  const finalRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webContentLink`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return finalRes.json();
};

export const deleteDriveFile = async (id: string) => {
  if (!accessToken) throw new Error("Not authorized");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to delete from Google Drive");
};

export const renameDriveFile = async (id: string, newName: string) => {
  if (!accessToken) throw new Error("Not authorized");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: "PATCH",
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error("Failed to rename on Google Drive");
  return res.json();
};
