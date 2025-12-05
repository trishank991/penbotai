import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Constants from 'expo-constants';

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Copilot',
  'Perplexity',
  'Grammarly AI',
  'Other',
];

const ASSIGNMENT_TYPES = [
  'Essay',
  'Research Paper',
  'Lab Report',
  'Presentation',
  'Thesis',
  'Homework',
  'Other',
];

export default function DisclosureScreen() {
  const { profile } = useAuth();
  const [assignmentType, setAssignmentType] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [usageDescription, setUsageDescription] = useState('');
  const [generatedDisclosure, setGeneratedDisclosure] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const generateDisclosure = async () => {
    if (!assignmentType) {
      Alert.alert('Error', 'Please select an assignment type');
      return;
    }
    if (selectedTools.length === 0) {
      Alert.alert('Error', 'Please select at least one AI tool');
      return;
    }
    if (!usageDescription.trim()) {
      Alert.alert('Error', 'Please describe how you used AI');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl || '';
      const response = await fetch(`${apiUrl}/disclosure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentType,
          aiTools: selectedTools,
          usageDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate disclosure');
      }

      setGeneratedDisclosure(data.disclosure);

      // Save to database
      if (profile) {
        await supabase.from('disclosures').insert({
          user_id: profile.id,
          assignment_type: assignmentType,
          ai_tools: selectedTools,
          usage_description: usageDescription,
          generated_disclosure: data.disclosure,
        });
      }
    } catch (error) {
      console.error('Error generating disclosure:', error);
      Alert.alert('Error', 'Failed to generate disclosure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareDisclosure = async () => {
    try {
      await Share.share({
        message: generatedDisclosure,
        title: 'AI Disclosure Statement',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = async () => {
    // In React Native, you'd use @react-native-clipboard/clipboard
    // For simplicity, we'll use Share
    Alert.alert('Success', 'Use the share option to copy the text');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment Type</Text>
        <View style={styles.chipContainer}>
          {ASSIGNMENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                assignmentType === type && styles.chipSelected,
              ]}
              onPress={() => setAssignmentType(type)}
            >
              <Text
                style={[
                  styles.chipText,
                  assignmentType === type && styles.chipTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Tools Used</Text>
        <View style={styles.chipContainer}>
          {AI_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool}
              style={[
                styles.chip,
                selectedTools.includes(tool) && styles.chipSelected,
              ]}
              onPress={() => toggleTool(tool)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedTools.includes(tool) && styles.chipTextSelected,
                ]}
              >
                {tool}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How did you use AI?</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Describe how you used AI tools in your work (e.g., 'Used ChatGPT to brainstorm ideas and Claude to help with grammar checking')"
          value={usageDescription}
          onChangeText={setUsageDescription}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.generateButton, loading && styles.buttonDisabled]}
        onPress={generateDisclosure}
        disabled={loading}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.generateButtonText}>
          {loading ? 'Generating...' : 'Generate Disclosure'}
        </Text>
      </TouchableOpacity>

      {generatedDisclosure && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your Disclosure Statement</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity onPress={copyToClipboard} style={styles.actionButton}>
                <Ionicons name="copy-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareDisclosure} style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{generatedDisclosure}</Text>
          </View>
        </View>
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
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    padding: 16,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  spacer: {
    height: 32,
  },
});
