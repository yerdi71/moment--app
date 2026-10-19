import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
export const SCREEN = { W: width, H: height };

export const COLORS = {
  bg: '#0b0815',
  purple: '#8b5cf6',
  purpleLight: '#c4b5fd',
  white: '#ffffff',
  textMuted: 'rgba(255,255,255,0.62)',
  textFaint: 'rgba(255,255,255,0.40)',
  cardBg: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.12)',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.15)',
  star: '#c4b5fd',
};

export const ACCENTS = ['#8b5cf6', '#f472b6', '#60a5fa', '#4ade80', '#fde68a', '#c4b5fd'];
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };