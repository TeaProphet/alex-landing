import { API_CONFIG, apiHeaders } from './api';

export interface ContactsData {
  id: number;
  telegram_login?: string;
  instagram_login?: string;
  whatsapp_phone?: string;
  phone_number?: string;
  email_address?: string;
  main_photo?: string;
  greeting?: string;
  about_info?: string;
}


export interface ServiceBlockData {
  id: number;
  title: string;
  text: string;
  media?: number[]; // Junction table IDs
  sort?: number;
}

export async function fetchContacts(): Promise<ContactsData> {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/items/contacts`, {
      headers: apiHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

export async function fetchServicesBlocks(): Promise<ServiceBlockData[]> {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/items/services_blocks`, {
      headers: apiHeaders,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching services blocks:', error);
    throw error;
  }
}

export function getImageUrl(fileId: string): string {
  if (fileId.startsWith('http')) {
    return fileId;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
  return `${baseUrl}/files/${fileId}`;
}


export interface FileMetadata {
  id: string;
  filename_disk: string;
  type: string;
  title?: string;
}

// Function to resolve file IDs from junction table without accessing directus_files metadata
export async function resolveMediaIds(junctionIds: number[]): Promise<FileMetadata[]> {
  if (!junctionIds || !Array.isArray(junctionIds)) {
    return [];
  }

  try {
    // Get file IDs from junction table only
    const junctionResponse = await fetch(
      `${API_CONFIG.baseURL}/items/services_blocks_files?filter%5Bid%5D%5B_in%5D=${junctionIds.join(',')}`,
      {
        headers: apiHeaders,
      }
    );

    if (!junctionResponse.ok) {
      throw new Error(`HTTP error! status: ${junctionResponse.status}`);
    }

    const junctionResult = await junctionResponse.json();
    
    // Return minimal metadata with file IDs, using /files/ endpoint
    return junctionResult.data
      .filter((item: any) => item.directus_files_id)
      .map((item: any) => ({
        id: item.directus_files_id,
        filename_disk: '',
        type: 'image/jpeg', // Default, will be determined by browser
        title: undefined
      }));
  } catch (error) {
    console.error('Error resolving media IDs:', error);
    return [];
  }
}

// Utility function to detect if filename is a video
function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  
  return videoExtensions.some(ext => 
    filename.toLowerCase().includes(ext)
  );
}

export function convertFilesToMedia(files: FileMetadata[]): Array<{url: string; type: 'image' | 'video'; alternativeText?: string}> {
  if (!files || !Array.isArray(files)) {
    return [];
  }
  
  return files.map(file => {
    const url = getImageUrl(file.id);
    const isVideo = file.type.startsWith('video/') || isVideoFile(file.filename_disk);
    const type = isVideo ? 'video' : 'image';
    
    return {
      url,
      type,
      alternativeText: file.title
    };
  });
}

