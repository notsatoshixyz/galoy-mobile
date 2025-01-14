module.exports = {
  preset: "react-native",
  setupFiles: ["<rootDir>/jest-ts-auto-mock-config.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/helpers/jest.setup.js"],
  transform: {
    "\\.(ts|tsx)$": "ts-jest",
    "^.+\\.svg$": "jest-transform-stub",
  },
  globals: {
    "ts-jest": {
      compiler: "ttypescript",
      tsconfig: "tsconfig.jest.json",
    },
  },
  testRegex: "(/__tests__/.*\\.(test|spec))\\.(ts|tsx|js)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  rootDir: ".",
  moduleNameMapper: {
    "^@app/(.*)$": ["<rootDir>app/$1"],
    "^@mocks/(.*)$": ["<rootDir>__mocks__/$1"],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native" +
      "|@react-native-community" +
      "|@react-native-firebase" +
      "|@react-native-firebase/auth" +
      "|@react-native" +
      "|@react-navigation" +
      "|react-native-animatable" +
      "|react-native-camera" +
      "|react-native-country-picker-modal" +
      "|react-native-elements" +
      "|react-native-error-boundary" +
      "|react-native-extended-stylesheet" +
      "|react-native-haptic-feedback" +
      "|react-native-image-picker" +
      "|react-native-keyboard-aware-scroll-view" +
      "|react-native-modal" +
      "|react-native-phone-number-input" +
      "|react-native-ratings" +
      "|react-native-reanimated" +
      "|react-native-root-siblings" +
      "|react-native-screens" +
      "|react-native-size-matters" +
      "|react-native-splash-screen" +
      "|react-native-toast-message" +
      "|react-native-vector-icons" +
      "|react-navigation-tabs" +
      ")/)",
  ],
}
