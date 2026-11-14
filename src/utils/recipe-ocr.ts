import TextRecognition, {
  TextRecognitionScript,
} from '@react-native-ml-kit/text-recognition';
import { Platform } from 'react-native';

export async function recognizeRecipeImage(imageUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Tekstherkenning werkt alleen in de mobiele development build.');
  }

  const result = await TextRecognition.recognize(imageUri, TextRecognitionScript.LATIN);
  return result.text;
}
