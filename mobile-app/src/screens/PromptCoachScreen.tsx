import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Constants from 'expo-constants';

interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  rewrittenPrompt?: string;
}

export default function PromptCoachScreen() {
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt to analyze');
      return;
    }

    if (prompt.length < 10) {
      Alert.alert('Error', 'Prompt is too short. Please enter at least 10 characters.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl || '';
      if (!apiUrl) {
        Alert.alert('Configuration Error', 'API URL is not configured. Please check your app settings.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${apiUrl}/prompt-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze prompt');
      }

      setResult(data);

      // Save to database
      if (profile) {
        await supabase.from('prompts').insert({
          user_id: profile.id,
          prompt_text: prompt,
          score: data.score,
          feedback: data.feedback,
        });
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      Alert.alert('Error', 'Failed to analyze prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Your Prompt</Text>
        <Text style={styles.sectionSubtitle}>
          Get feedback on how to write better prompts for AI tools
        </Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="Enter the prompt you want to analyze..."
          value={prompt}
          onChangeText={setPrompt}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{prompt.length} characters</Text>
      </View>

      <TouchableOpacity
        style={[styles.analyzeButton, loading && styles.buttonDisabled]}
        onPress={analyzePrompt}
        disabled={loading}
      >
        <Ionicons name="analytics" size={20} color="#fff" />
        <Text style={styles.analyzeButtonText}>
          {loading ? 'Analyzing...' : 'Analyze Prompt'}
        </Text>
      </TouchableOpacity>

      {result && (
        <>
          {/* Score Card */}
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.score) }]}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(result.score) }]}>
                {result.score}
              </Text>
              <Text style={styles.scoreLabel}>/100</Text>
            </View>
            <Text style={[styles.scoreText, { color: getScoreColor(result.score) }]}>
              {getScoreLabel(result.score)}
            </Text>
          </View>

          {/* Feedback */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <Text style={styles.feedbackText}>{result.feedback}</Text>
          </View>

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <View style={styles.section}>
              <View style={styles.listHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.listTitle}>Strengths</Text>
              </View>
              {result.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{strength}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Improvements */}
          {result.improvements && result.improvements.length > 0 && (
            <View style={styles.section}>
              <View style={styles.listHeader}>
                <Ionicons name="arrow-up-circle" size={20} color="#f97316" />
                <Text style={styles.listTitle}>Areas for Improvement</Text>
              </View>
              {result.improvements.map((improvement, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{improvement}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rewritten Prompt */}
          {result.rewrittenPrompt && (
            <View style={styles.section}>
              <View style={styles.listHeader}>
                <Ionicons name="sparkles" size={20} color="#3b82f6" />
                <Text style={styles.listTitle}>Improved Version</Text>
              </View>
              <View style={styles.improvedBox}>
                <Text style={styles.improvedText}>{result.rewrittenPrompt}</Text>
              </View>
              <TouchableOpacity
                style={styles.useButton}
                onPress={() => setPrompt(result.rewrittenPrompt || '')}
              >
                <Text style={styles.useButtonText}>Use This Prompt</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listBullet: {
    color: '#64748b',
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  improvedBox: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  improvedText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
  },
  useButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  spacer: {
    height: 32,
  },
});
