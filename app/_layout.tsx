import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '@/providers/AuthContext';
import { DraftCountProvider } from '@/providers/DraftCountContext';
import { useAuthMigration } from '@/hooks/useAuthMigration';

import { useColorScheme } from '@/hooks/use-color-scheme';

function AuthMigrationGate({ children }: { children: React.ReactNode }) {
  useAuthMigration();
  return <>{children}</>;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

          /* Custom Premium Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.01);
          }
          ::-webkit-scrollbar-thumb {
            background: ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
          }

          /* Fluid Liquid Blobs with slow organic morphing keyframes */
          [data-css-class~="liquid-blob-1"] {
            filter: blur(120px) !important;
            -webkit-filter: blur(120px) !important;
            animation: morphBlob1 32s infinite alternate ease-in-out;
            will-change: transform, border-radius;
          }
          [data-css-class~="liquid-blob-2"] {
            filter: blur(140px) !important;
            -webkit-filter: blur(140px) !important;
            animation: morphBlob2 28s infinite alternate ease-in-out;
            will-change: transform, border-radius;
          }
          [data-css-class~="liquid-blob-3"] {
            filter: blur(130px) !important;
            -webkit-filter: blur(130px) !important;
            animation: morphBlob3 30s infinite alternate ease-in-out;
            will-change: transform, border-radius;
          }

          @keyframes morphBlob1 {
            0% {
              border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
              transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
              border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
              transform: translate(40px, 25px) rotate(45deg) scale(1.05);
            }
            100% {
              border-radius: 30% 70% 40% 60% / 50% 60% 40% 50%;
              transform: translate(-20px, 45px) rotate(90deg) scale(0.95);
            }
          }
          @keyframes morphBlob2 {
            0% {
              border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
              transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
              border-radius: 30% 70% 70% 30% / 50% 30% 70% 50%;
              transform: translate(-50px, -20px) rotate(-60deg) scale(1.08);
            }
            100% {
              border-radius: 60% 40% 50% 50% / 40% 60% 50% 50%;
              transform: translate(25px, -40px) rotate(-120deg) scale(0.92);
            }
          }
          @keyframes morphBlob3 {
            0% {
              border-radius: 60% 40% 60% 40% / 40% 60% 40% 60%;
              transform: translate(0, 0) rotate(0deg) scale(1);
            }
            50% {
              border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
              transform: translate(30px, -30px) rotate(30deg) scale(1.06);
            }
            100% {
              border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
              transform: translate(-35px, 20px) rotate(60deg) scale(0.96);
            }
          }

          /* Glassmorphism Blurs - Cinematic & Clean */
          [data-css-class~="glass-blur"] {
            backdrop-filter: blur(60px) saturate(160%) !important;
            -webkit-backdrop-filter: blur(60px) saturate(160%) !important;
          }
          [data-css-class~="glass-blur-sidebar"] {
            backdrop-filter: blur(90px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(90px) saturate(140%) !important;
          }
          [data-css-class~="glass-blur-button"] {
            backdrop-filter: blur(30px) saturate(120%) !important;
            -webkit-backdrop-filter: blur(30px) saturate(120%) !important;
          }

          /* Remove default browser focus outline on inputs & textareas and replace with premium soft glow */
          input:focus, textarea:focus, [contenteditable="true"]:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} !important;
            border-color: ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)'} !important;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          /* Cinematic Hover & Interactive Classes */
          [data-css-class~="glass-card"] {
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s ease !important;
          }
          [data-css-class~="glass-card"]:hover {
            transform: translateY(-2px) scale(1.002);
            box-shadow: ${colorScheme === 'dark'
              ? '0 12px 32px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(255, 255, 255, 0.1) inset'
              : '0 8px 24px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(255, 255, 255, 0.8) inset'} !important;
            border-color: ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)'} !important;
          }

          [data-css-class~="glass-button"] {
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
          }
          [data-css-class~="glass-button"]:hover {
            transform: translateY(-1px) scale(1.005);
            box-shadow: 0 4px 12px ${colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)'} !important;
          }
          [data-css-class~="glass-button"]:active {
            transform: translateY(0) scale(0.98);
          }

          [data-css-class~="sidebar-item"] {
            transition: background-color 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease !important;
          }
          [data-css-class~="sidebar-item"]:hover {
            background-color: ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'} !important;
            transform: translateX(4px);
            box-shadow: ${colorScheme === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.01)'} !important;
          }
          [data-css-class~="sidebar-item"]:active {
            transform: translateX(2px) scale(0.98);
          }

          /* Respect Reduce Motion preference */
          @media (prefers-reduced-motion: reduce) {
            [data-css-class~="liquid-blob-1"],
            [data-css-class~="liquid-blob-2"],
            [data-css-class~="liquid-blob-3"] {
              animation: none !important;
              will-change: auto !important;
            }
            [data-css-class~="glass-card"],
            [data-css-class~="glass-button"],
            [data-css-class~="sidebar-item"] {
              transition: none !important;
            }
            [data-css-class~="glass-card"]:hover,
            [data-css-class~="glass-button"]:hover,
            [data-css-class~="sidebar-item"]:hover {
              transform: none !important;
            }
          }
        ` }} />
      )}
      <DraftCountProvider>
      <AuthProvider>
        <AuthMigrationGate>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="theme-editor" options={{ presentation: 'modal', title: '自定义主题' }} />
            <Stack.Screen name="source-library" options={{ presentation: 'modal', title: '来源库' }} />
            <Stack.Screen name="auth" options={{ presentation: 'modal', title: '登录/注册', headerShown: false }} />
          </Stack>
        </AuthMigrationGate>
      </AuthProvider>
      </DraftCountProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
