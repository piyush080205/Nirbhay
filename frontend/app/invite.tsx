import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';

import { API_URL } from '../services/api';

export default function InviteScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setInviteVerified } = useTripStore();

  const handleValidate = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter an invite code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/validate-invite?code=${encodeURIComponent(trimmed)}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'approved') {
          await setInviteVerified(true);
          // The layout will automatically navigate to the main app
        }
      } else {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || 'Invalid or already used invite code';
        setError(message);
      }
    } catch (err) {
      console.error('Invite validation error:', err);
      setError('Could not connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={64} color="#ff4757" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Nirbhay</Text>
        <Text style={styles.subtitle}>Autonomous Women Safety System</Text>

        {/* Invite Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={22} color="#ff4757" />
            <Text style={styles.cardTitle}>Enter Invite Code</Text>
          </View>
          <Text style={styles.cardDescription}>
            You need a valid invite code to access the app. Contact the admin to get one.
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="e.g. NIRB-0001"
            placeholderTextColor="#555"
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              if (error) setError('');
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color="#ff4757" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleValidate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.buttonText}>Verify Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Protected access • Invite only
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 71, 87, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 40,
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1.5,
    borderColor: '#333',
    letterSpacing: 3,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ff4757',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 13,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#555',
    fontSize: 12,
    marginTop: 30,
    letterSpacing: 1,
  },
});
