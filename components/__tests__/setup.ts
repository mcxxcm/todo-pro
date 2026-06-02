// @ts-nocheck — Jest setup file; uses jest.mock globals and require()
// Central mocks for RNTL tests

// react-native-reanimated - must mock BEFORE any import, no requireActual
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const AnimatedView = ({ children, style }: any) => React.createElement("View", { style }, children);
  AnimatedView.displayName = "AnimatedView";
  const AnimatedText = ({ children, style }: any) => React.createElement("Text", { style }, children);
  AnimatedText.displayName = "AnimatedText";
  const Animated = {
    View: AnimatedView,
    Text: AnimatedText,
    createAnimatedComponent: (Component: any) => Component,
  };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (v) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withSpring: (v) => v,
    withTiming: (v, _, callback) => {
      if (callback) setTimeout(callback, 0);
      return v;
    },
    withRepeat: (v) => v,
    withSequence: (...args) => args[args.length - 1],
    runOnJS: (fn) => fn,
    createAnimatedComponent: (C) => C,
  };
});

// react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const chainable = () => chainable;
  chainable.onBegin = () => chainable;
  chainable.onUpdate = () => chainable;
  chainable.onEnd = () => chainable;
  chainable.activeOffsetX = () => chainable;
  chainable.activeOffsetY = () => chainable;
  return {
    Gesture: {
      Pan: () => chainable,
      Tap: () => chainable,
    },
    GestureDetector: ({ children }) =>
      React.createElement("React.Fragment", null, children),
    gestureHandlerRootHOC: (C) => C,
  };
});

// @expo/vector-icons
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const MockIcon = ({ name, size, color, style }: any) =>
    React.createElement("Text", { style: [{ fontSize: size, color }, style] }, `[${name}]`);
  MockIcon.displayName = "MaterialIcons";
  return MockIcon;
});

// expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 0, Light: 1, Medium: 2 },
}));

// expo-linear-gradient
jest.mock("expo-linear-gradient", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const MockLG = ({ children, style }: any) => React.createElement("View", { style }, children);
  MockLG.displayName = "LinearGradient";
  return { LinearGradient: MockLG };
});

// expo-blur
jest.mock("expo-blur", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const MockBlur = ({ children, style }: any) => React.createElement("View", { style }, children);
  MockBlur.displayName = "BlurView";
  return { BlurView: MockBlur };
});

// AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
