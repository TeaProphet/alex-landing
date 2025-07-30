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
  media?: Array<{
    directus_files_id: {
      id: string;
      filename_disk: string;
      type: string;
      title?: string;
    };
  }>; // Nested junction data with file metadata
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
    // Fetch services with their media relationships
    const response = await fetch(
      `${API_CONFIG.baseURL}/items/services_blocks?fields=*,media.directus_files_id.*&sort=sort`,
      {
        headers: apiHeaders,
      }
    );

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
  return `${baseUrl}/assets/${fileId}`;
}


export interface FileMetadata {
  id: string;
  filename_disk: string;
  type: string;
  title?: string;
  url?: string; // Direct URL from junction collection
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
    const url = file.url || getImageUrl(file.id);
    const isVideo = file.type.startsWith('video/') || isVideoFile(file.filename_disk);
    const type = isVideo ? 'video' : 'image';
    
    return {
      url,
      type,
      alternativeText: file.title
    };
  });
}

// New function to convert nested service media to FileMetadata format
export function convertServiceMediaToFiles(serviceBlock: ServiceBlockData): FileMetadata[] {
  if (!serviceBlock.media || !Array.isArray(serviceBlock.media)) {
    return [];
  }
  
  return serviceBlock.media
    .filter(item => item.directus_files_id) // Filter out null references
    .map(item => ({
      id: item.directus_files_id.id,
      filename_disk: item.directus_files_id.filename_disk || '',
      type: item.directus_files_id.type || 'image/jpeg',
      title: item.directus_files_id.title,
      url: `${API_CONFIG.baseURL}/files/${item.directus_files_id.id}`
    }));
}

