import { TextStyle } from 'react-native';
const family = 'System';
export const typography = {
  displayLarge: { fontFamily: family, fontSize: 26, lineHeight: 36, fontWeight: '700' } satisfies TextStyle,
  headingLarge: { fontFamily: family, fontSize: 22, lineHeight: 30, fontWeight: '700' } satisfies TextStyle,
  heading: { fontFamily: family, fontSize: 20, lineHeight: 28, fontWeight: '600' } satisfies TextStyle,
  subtitle: { fontFamily: family, fontSize: 16, lineHeight: 24, fontWeight: '600' } satisfies TextStyle,
  bodyLarge: { fontFamily: family, fontSize: 16, lineHeight: 24, fontWeight: '400' } satisfies TextStyle,
  body: { fontFamily: family, fontSize: 14, lineHeight: 22, fontWeight: '400' } satisfies TextStyle,
  bodySmall: { fontFamily: family, fontSize: 13, lineHeight: 20, fontWeight: '400' } satisfies TextStyle,
  caption: { fontFamily: family, fontSize: 12, lineHeight: 18, fontWeight: '400' } satisfies TextStyle,
} as const;
