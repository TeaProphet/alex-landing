import { API_CONFIG, apiHeaders } from './api';

export interface ContactsData {
  id: number;
  documentId: string;
  telegramLogin?: string;
  instagramLogin?: string;
  whatsappPhone?: string;
  phoneNumber?: string;
  emailAddress?: string;
  mainPhoto?: {
    url: string;
    alternativeText?: string;
  };
  greeting?: string;
  aboutInfo?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

export interface MediaItem {
  url: string;
  alternativeText?: string;
  mime?: string;
  name?: string;
}

export interface ServiceBlockData {
  id: number;
  documentId: string;
  title: string;
  text: string;
  photos: MediaItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

export async function fetchContacts(): Promise<ContactsData> {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/contacts?populate=*`, {
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
    const response = await fetch(`${API_CONFIG.baseURL}/services-block?populate=*`, {
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

export function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  const baseUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  return `${baseUrl}${imageUrl}`;
}

export function getMediaUrl(mediaUrl: string): string {
  return getImageUrl(mediaUrl); // Same logic for all media
}

export function isVideoMimeType(mimeType?: string): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('video/');
}

export function convertPhotosToMedia(photos: MediaItem[]): Array<{url: string; type: 'image' | 'video'; alternativeText?: string}> {
  return photos.map(photo => ({
    url: getMediaUrl(photo.url),
    type: isVideoMimeType(photo.mime) ? 'video' : 'image',
    alternativeText: photo.alternativeText
  }));
}