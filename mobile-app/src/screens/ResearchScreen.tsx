import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Paper {
  paperId: string;
  title: string;
  abstract: string;
  year: number;
  authors: { name: string }[];
  citationCount: number;
  url: string;
}

export default function ResearchScreen() {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPapers = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);

    try {
      // Using Semantic Scholar API (free, no auth required)
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
          query
        )}&limit=10&fields=paperId,title,abstract,year,authors,citationCount,url`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to search papers');
      }

      setPapers(data.data || []);
    } catch (error) {
      console.error('Error searching papers:', error);
      Alert.alert('Error', 'Failed to search papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPaper = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const generateCitation = (paper: Paper, format: 'APA' | 'MLA' | 'Chicago') => {
    const authors = paper.authors.map((a) => a.name).join(', ');
    const year = paper.year || 'n.d.';

    let citation = '';
    switch (format) {
      case 'APA':
        citation = `${authors} (${year}). ${paper.title}. Retrieved from ${paper.url}`;
        break;
      case 'MLA':
        citation = `${authors}. "${paper.title}." ${year}. Web.`;
        break;
      case 'Chicago':
        citation = `${authors}. "${paper.title}." ${year}. ${paper.url}`;
        break;
    }

    Alert.alert(
      `${format} Citation`,
      citation,
      [
        { text: 'OK' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.title}>Search Academic Papers</Text>
        <Text style={styles.subtitle}>
          Search 200M+ papers from Semantic Scholar
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for papers, topics, authors..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchPapers}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchPapers}
            disabled={loading}
          >
            <Ionicons
              name={loading ? 'hourglass' : 'search'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {papers.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Found {papers.length} papers
          </Text>
          {papers.map((paper) => (
            <TouchableOpacity
              key={paper.paperId}
              style={styles.paperCard}
              onPress={() => openPaper(paper.url)}
            >
              <Text style={styles.paperTitle} numberOfLines={2}>
                {paper.title}
              </Text>
              <Text style={styles.paperAuthors} numberOfLines={1}>
                {paper.authors.map((a) => a.name).join(', ')}
              </Text>
              {paper.abstract && (
                <Text style={styles.paperAbstract} numberOfLines={3}>
                  {paper.abstract}
                </Text>
              )}
              <View style={styles.paperMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <Text style={styles.metaText}>{paper.year || 'N/A'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="document-text-outline" size={14} color="#64748b" />
                  <Text style={styles.metaText}>
                    {paper.citationCount || 0} citations
                  </Text>
                </View>
              </View>
              <View style={styles.citationButtons}>
                <TouchableOpacity
                  style={styles.citationButton}
                  onPress={() => generateCitation(paper, 'APA')}
                >
                  <Text style={styles.citationButtonText}>APA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.citationButton}
                  onPress={() => generateCitation(paper, 'MLA')}
                >
                  <Text style={styles.citationButtonText}>MLA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.citationButton}
                  onPress={() => generateCitation(paper, 'Chicago')}
                >
                  <Text style={styles.citationButtonText}>Chicago</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!loading && papers.length === 0 && query === '' && (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Search Academic Papers</Text>
          <Text style={styles.emptyText}>
            Find papers, generate citations, and build your research library
          </Text>
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
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  paperCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  paperAuthors: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 8,
  },
  paperAbstract: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  paperMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  citationButtons: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  citationButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  citationButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },
  spacer: {
    height: 32,
  },
});
