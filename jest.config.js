module.exports = {
  preset: "jest-expo",
  testMatch: ["**/components/__tests__/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@react-native-async-storage/.*|expo-modules-core|expo-haptics|expo-linear-gradient|expo-blur|expo-notifications|expo-router|expo-device|expo-sharing|expo-file-system|expo-image-picker)",
  ],
  setupFilesAfterEnv: ["<rootDir>/components/__tests__/setup.ts"],
};
