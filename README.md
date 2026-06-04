# 좌우지간 Mobile

Expo React Native client for 좌우지간.

Default API target:

EXPO_PUBLIC_API_BASE_URL=https://jwj.zuu3.kr
EXPO_PUBLIC_WEB_LOGIN_URL=https://jwj.zuu3.kr

Mobile auth flow:

1. Expo AuthSession gets a Google id token.
2. The app posts it to /api/auth/mobile/google.
3. Next verifies the Google token and returns a mobile JWT.
4. The app stores the JWT in SecureStore and sends it as Bearer token.

Required app env:

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=

Required Next env:

MOBILE_AUTH_SECRET=use-a-long-random-secret
MOBILE_GOOGLE_CLIENT_IDS=comma,separated,google,client,ids

Run on iPhone with Expo Go:

pnpm install
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) pnpm exec expo start --lan --clear
