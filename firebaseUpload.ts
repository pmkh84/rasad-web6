// اگر توی فایل جدا نوشتی اینو هم بیار:
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './src/firebase';  // این همون فایل firebase.ts مرحله 4 هست

export async function uploadExcelToFirebase(fileBlob: Blob, fileName: string) {
  const storageRef = ref(storage, `excels/${fileName}`); // مسیر ذخیره در Firebase

  // آپلود فایل Blob
  const snapshot = await uploadBytes(storageRef, fileBlob);

  // گرفتن لینک دانلود فایل آپلود شده
  const downloadURL = await getDownloadURL(snapshot.ref);
  console.log('Excel uploaded. Download URL:', downloadURL);

  return downloadURL;
}
