import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, putFile, ref } from '@react-native-firebase/storage';

import { getFirebaseAuth, getFirebaseStorage } from './firebase';

export type SelectedImage = {
  mimeType?: string | null;
  uri: string;
};

export async function pickProfilePhoto(): Promise<SelectedImage | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Photo library permission is needed to add a profile photo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.82,
  });

  if (result.canceled) {
    return undefined;
  }

  const asset = result.assets[0];
  return { mimeType: asset.mimeType, uri: asset.uri };
}

export async function takeSelfie(): Promise<SelectedImage | undefined> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Camera permission is needed to submit a verification selfie.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    cameraType: ImagePicker.CameraType.front,
    mediaTypes: ['images'],
    quality: 0.84,
  });

  if (result.canceled) {
    return undefined;
  }

  const asset = result.assets[0];
  return { mimeType: asset.mimeType, uri: asset.uri };
}

export async function chooseSelfie(): Promise<SelectedImage | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Photo library permission is needed to choose a selfie.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ['images'],
    quality: 0.84,
  });

  if (result.canceled) {
    return undefined;
  }

  const asset = result.assets[0];
  return { mimeType: asset.mimeType, uri: asset.uri };
}

export async function uploadProfilePhoto(image: SelectedImage): Promise<string> {
  return uploadImage(image, 'profile-photos');
}

export async function uploadVerificationSelfie(
  image: SelectedImage,
): Promise<string> {
  return uploadImage(image, 'verification-selfies', true);
}

async function uploadImage(
  image: SelectedImage,
  folder: string,
  returnStoragePath = false,
): Promise<string> {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error('Sign in before uploading a photo.');
  }

  const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
  const storageRef = ref(
    getFirebaseStorage(),
    `${folder}/${user.uid}/${Date.now()}.${extension}`,
  );

  await putFile(storageRef, image.uri, {
    contentType: image.mimeType ?? `image/${extension}`,
  });

  return returnStoragePath ? storageRef.fullPath : getDownloadURL(storageRef);
}
