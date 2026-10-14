import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Platform } from 'react-native';

// ═══════════════════════════════════════════
// KOLORY
// ═══════════════════════════════════════════

export const COLORS = {
  light: {
    // Tła
    bg: '#FAF7F2',           // ciepła kremowa biel
    card: '#FFFFFF',         // czysta biel
    cardAlt: '#F5EDE0',      // jasny beż (karta cytatu)
    elevated: '#ECE1D6',     // uniesiona beż
    border: '#E8DED0',       // subtelna ciepła ramka
    overlay: 'rgba(0,0,0,0.4)',
    
    // Tekst
    text: '#2B2620',         // ciemny ciepły brąz (prawie czarny)
    textSecondary: '#7A6E60', // ciepły szary
    textTertiary: '#A89B8C',  // jasny ciepły szary
    
    // Akcent (beż z dokumentu)
    accent: '#D7B895',       // ciepły beż / bursztyn
    accentDark: '#C4A384',   // ciemniejszy beż
    accentLight: '#F5EDE0',  // bardzo jasny beż
    
    // Neutralne
    black: '#1A1614',        // prawie czarny
    white: '#FFFFFF',
    success: '#6B8E5A',      // ciepła zieleń
    danger: '#B85C4A',       // ciepła czerwień
  },
  
  dark: {
    // Tła
    bg: '#0F0D0B',           // głęboka ciepła czerń
    card: '#1A1714',         // ciemna karta
    cardAlt: '#221E1A',      // ciemna karta alt
    elevated: '#2A2520',     // uniesiona
    border: '#2F2A24',       // subtelna ramka
    overlay: 'rgba(0,0,0,0.7)',
    
    // Tekst
    text: '#FAF7F2',         // ciepła biel
    textSecondary: '#A89B8C', // ciepły szary
    textTertiary: '#6B5F52', // ciemny ciepły szary
    
    // Akcent
    accent: '#D7B895',
    accentDark: '#C4A384',
    accentLight: '#3A332A',
    
    // Neutralne
    black: '#000000',
    white: '#FFFFFF',
    success: '#8FB878',
    danger: '#D4715A',
  },
};

// ═══════════════════════════════════════════
// TYPOGRAFIA
// ═══════════════════════════════════════════

const FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const TYPOGRAPHY = {
  display: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  heading: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 26,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
  },
};

// ═══════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  card: 16,
  button: 12,
  input: 12,
  pill: 24,
  circle: 100,
};

// ═══════════════════════════════════════════
// HELPER — zwraca paletę kolorów
// ═══════════════════════════════════════════

export const getColors = (mode = 'light') => {
  return mode === 'dark' ? COLORS.dark : COLORS.light;
};

// ═══════════════════════════════════════════
// KOMPONENT: Button
// ═══════════════════════════════════════════

export const Button = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  colors, 
  disabled = false,
  style,
  ...props 
}) => {
  const variants = {
    primary: {
      backgroundColor: colors.text,
      color: colors.white,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.accent,
      color: colors.text,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.text,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text,
      borderWidth: 0,
    },
    white: {
      backgroundColor: colors.white,
      color: colors.text,
      borderWidth: 0,
    },
  };
  
  const v = variants[variant] || variants.primary;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        {
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: RADIUS.button,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          backgroundColor: v.backgroundColor,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          TYPOGRAPHY.button,
          { color: v.color },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════
// KOMPONENT: Card
// ═══════════════════════════════════════════

export const Card = ({ 
  children, 
  colors, 
  variant = 'default',
  style,
  ...props 
}) => {
  const variants = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    alt: {
      backgroundColor: colors.cardAlt,
      borderWidth: 0,
    },
    plain: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  };
  
  const v = variants[variant] || variants.default;
  
  return (
    <View
      style={[
        {
          padding: SPACING.m,
          borderRadius: RADIUS.card,
          backgroundColor: v.backgroundColor,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════
// KOMPONENT: Input
// ═══════════════════════════════════════════

export const Input = ({ 
  value, 
  onChangeText, 
  placeholder, 
  colors, 
  multiline = false,
  maxLength,
  autoFocus = false,
  style,
  ...props 
}) => {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      multiline={multiline}
      maxLength={maxLength}
      autoFocus={autoFocus}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        {
          backgroundColor: colors.card,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: RADIUS.input,
          padding: SPACING.m,
          fontSize: 16,
          lineHeight: 24,
          minHeight: multiline ? 140 : 52,
        },
        TYPOGRAPHY.body,
        { color: colors.text },
        style,
      ]}
      {...props}
    />
  );
};

// ═══════════════════════════════════════════
// HELPER: style helpers (opcjonalne)
// ═══════════════════════════════════════════

export const shadowSoft = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export const shadowStrong = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 20,
  elevation: 6,
};