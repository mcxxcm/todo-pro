import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/providers/AuthContext';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, error, clearError } = useAuth();
  const router = useRouter();

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const handleAuth = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace('/');
    } catch {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueLocal = () => {
    clearError();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.card, { backgroundColor: bgColor }]} data-css-class="glass-card">
        <View style={styles.header}>
          <MaterialIcons name="cloud-sync" size={48} color={tintColor} />
          <Text style={[styles.title, { color: textColor }]}>
            {isLogin ? '登录 Todo Pro' : '注册 Todo Pro'}
          </Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            不登录也可以先使用本地收件箱；登录后开启跨端同步
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={[styles.input, { color: textColor, borderColor: tintColor + '40' }]}
          placeholder="邮箱地址"
          placeholderTextColor={textColor + '80'}
          value={email}
          onChangeText={(t) => { setEmail(t); clearError(); }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { color: textColor, borderColor: tintColor + '40' }]}
          placeholder="密码"
          placeholderTextColor={textColor + '80'}
          value={password}
          onChangeText={(t) => { setPassword(t); clearError(); }}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: tintColor }]} 
          onPress={handleAuth}
          disabled={isLoading}
          accessibilityLabel={isLogin ? "登录" : "注册"}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? '登录' : '注册'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => { setIsLogin(!isLogin); clearError(); }}
          accessibilityLabel={isLogin ? "切换到注册" : "切换到登录"}
          accessibilityRole="button"
        >
          <Text style={[styles.switchText, { color: tintColor }]}>
            {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.localButton, { borderColor: tintColor + '40' }]}
          onPress={handleContinueLocal}
          accessibilityLabel="继续本地使用，不登录"
          accessibilityRole="button"
        >
          <Text style={[styles.localButtonText, { color: tintColor }]}>
            继续本地使用
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  localButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginTop: 14,
  },
  localButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});
