import {Platform} from 'react-native';

const LOCAL_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:4242' : 'http://localhost:4242';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_URL;
