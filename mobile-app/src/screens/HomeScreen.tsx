import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase, Disclosure } from '../services/supabase';

export default function HomeScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    disclosures: 0,
    prompts: 0,
    papers: 0,
  });
  const [recentDisclosures, setRecentDisclosures] = useState<Disclosure[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    try {
      // Get disclosures count
      const { count: disclosureCount } = await supabase
        .from('disclosures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      // Get prompts count
      const { count: promptCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      // Get recent disclosures
      const { data: disclosures } = await supabase
        .from('disclosures')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        disclosures: disclosureCount || 0,
        prompts: promptCount || 0,
        papers: 0,
      });

      setRecentDisclosures(disclosures || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickActions = [
    { title: 'New Disclosure', icon: 'document-text', color: '#3b82f6', screen: 'Disclosure' },
    { title: 'Analyze Prompt', icon: 'bulb', color: '#8b5cf6', screen: 'PromptCoach' },
    { title: 'Search Papers', icon: 'search', color: '#10b981', screen: 'Research' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {profile?.full_name?.split(' ')[0] || 'Student'}!
        </Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>
            {profile?.plan === 'premium' ? 'Premium' : 'Free Plan'}
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.disclosures}</Text>
          <Text style={styles.statLabel}>Disclosures</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bulb" size={24} color="#8b5cf6" />
          <Text style={styles.statNumber}>{stats.prompts}</Text>
          <Text style={styles.statLabel}>Prompts</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="library" size={24} color="#10b981" />
          <Text style={styles.statNumber}>{stats.papers}</Text>
          <Text style={styles.statLabel}>Papers</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { borderLeftColor: action.color }]}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Ionicons name={action.icon as any} size={28} color={action.color} />
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Disclosures */}
      <Text style={styles.sectionTitle}>Recent Disclosures</Text>
      {recentDisclosures.length > 0 ? (
        <View style={styles.recentContainer}>
          {recentDisclosures.map((disclosure) => (
            <TouchableOpacity key={disclosure.id} style={styles.disclosureCard}>
              <View style={styles.disclosureHeader}>
                <Text style={styles.disclosureType}>{disclosure.assignment_type}</Text>
                <Text style={styles.disclosureDate}>
                  {new Date(disclosure.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.disclosureTools} numberOfLines={1}>
                Tools: {disclosure.ai_tools.join(', ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No disclosures yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first AI disclosure statement
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  planBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    marginTop: 8,
    textAlign: 'center',
  },
  recentContainer: {
    padding: 16,
    gap: 12,
  },
  disclosureCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  disclosureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  disclosureType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  disclosureDate: {
    fontSize: 12,
    color: '#64748b',
  },
  disclosureTools: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
