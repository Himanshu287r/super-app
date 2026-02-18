import { ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param chatId - The chat ID where the file is being uploaded
 * @param userId - The user ID uploading the file
 * @returns Promise with download URL and file metadata
 */
export async function uploadFile(
    file: File,
    chatId: string,
    userId: string
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `chats/${chatId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot: UploadResult = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        return {
            url,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file');
    }
}

/**
 * Upload a profile picture to Firebase Storage
 * @param file - The image file to upload
 * @param userId - The user ID uploading the profile picture
 * @returns Promise with download URL
 */
export async function uploadProfilePicture(
    file: File,
    userId: string
): Promise<string> {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_${userId}_${timestamp}.${fileExtension}`;
    const filePath = `profilePictures/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot: UploadResult = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw new Error('Failed to upload profile picture');
    }
}

/**
 * Determine message type based on file type
 */
export function getMessageTypeFromFile(file: File): 'image' | 'video' | 'file' {
    if (file.type.startsWith('image/')) {
        return 'image';
    }
    if (file.type.startsWith('video/')) {
        return 'video';
    }
    return 'file';
}
