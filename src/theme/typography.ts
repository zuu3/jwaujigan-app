import { TextStyle } from 'react-native';

export const typography = {
  displayLarge: { fontSize: 26, lineHeight: 36, fontWeight: '700' } satisfies TextStyle,
  headingLarge: { fontSize: 22, lineHeight: 30, fontWeight: '700' } satisfies TextStyle,
  heading: { fontSize: 20, lineHeight: 28, fontWeight: '600' } satisfies TextStyle,
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '600' } satisfies TextStyle,
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' } satisfies TextStyle,
  body: { fontSize: 14, lineHeight: 22, fontWeight: '400' } satisfies TextStyle,
  bodySmall: { fontSize: 13, lineHeight: 20, fontWeight: '400' } satisfies TextStyle,
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' } satisfies TextStyle,
} as const;
