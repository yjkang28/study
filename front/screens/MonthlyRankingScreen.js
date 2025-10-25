//수정완료
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function MonthlyRankingScreen() {
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigation = useNavigation();

  // ✅ 네이티브 헤더 숨기기
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchRanking = async (date = new Date()) => {
    try {
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/attendance/ranking/${monthStr}`);
      setRanking(res.data);
    } catch (err) {
      console.error('월간 랭킹 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRanking(currentMonth);
    }, [currentMonth])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRanking(currentMonth);
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const monthStr = `${currentMonth.getFullYear()}년 ${String(currentMonth.getMonth() + 1).padStart(2, '0')}월`;

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1: return { icon: '🥇', color: '#FFD700' };
      case 2: return { icon: '🥈', color: '#C0C0C0' };
      case 3: return { icon: '🥉', color: '#CD7F32' };
      default: return { icon: null, color: null };
    }
  };

  const renderRankRow = (r, i) => {
    const medal = getMedalIcon(i + 1);
    const isTopThree = i < 3;

    return (
      <View 
        key={i} 
        style={[
          styles.rankRow,
          isTopThree && styles.rankRowTopThree,
          isTopThree && { borderLeftWidth: 4, borderLeftColor: medal.color }
        ]}
      >
        <View style={styles.rankLeftContent}>
          <View style={[styles.rankNumContainer, isTopThree && styles.rankNumContainerTopThree]}>
            {medal.icon ? (
              <Text style={styles.medalIcon}>{medal.icon}</Text>
            ) : (
              <Text style={styles.rankNum}>{i + 1}</Text>
            )}
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankStudy} numberOfLines={1}>{r.study}</Text>
            <Text style={styles.rankSubText}>
              <Ionicons name="layers-outline" size={12} color="#999" /> {' '}스터디
            </Text>
          </View>
        </View>
        <View style={styles.rankRateContainer}>
          <Text style={styles.rankRate}>{r.출석률}%</Text>
          <View style={[styles.rateBar, { width: (r.출석률 / 100) * 60 }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 커스텀 헤더 (네이티브 대신) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>월간 랭킹</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={24} color="#4C63D2" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthStr}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={24} color="#4C63D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="trophy-outline" size={24} color="#4C63D2" style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>총 스터디</Text>
          <Text style={styles.statValue}>{ranking.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={24} color="#FF5B5B" style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>평균 출석률</Text>
          <Text style={styles.statValue}>
            {ranking.length > 0 
              ? Math.round(ranking.reduce((sum, r) => sum + r.출석률, 0) / ranking.length)
              : 0}%
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContent}>
          {ranking.length > 0 ? (
            <>
              <Text style={styles.listTitle}>출석률 순위</Text>
              {ranking.map((r, i) => renderRankRow(r, i))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#D5D9FF" />
              <Text style={styles.emptyText}>이번 달 출석 데이터가 없습니다</Text>
              <Text style={styles.emptySubText}>스터디에 참여하여 출석을 기록해보세요</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },

  // ✅ 커스텀 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  monthBtn: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },
  statLabel: { fontSize: 12, color: '#999', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#4C63D2' },

  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, marginLeft: 4 },

  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  rankRowTopThree: { backgroundColor: '#F8F9FF', borderColor: '#E8EAFF' },
  rankLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankNumContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rankNumContainerTopThree: { backgroundColor: '#E8EAFF' },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#4C63D2' },
  medalIcon: { fontSize: 22 },
  rankInfo: { flex: 1 },
  rankStudy: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  rankSubText: { fontSize: 12, color: '#999' },
  rankRateContainer: { alignItems: 'flex-end' },
  rankRate: { fontSize: 16, fontWeight: '700', color: '#4C63D2', marginBottom: 6 },
  rateBar: { height: 4, backgroundColor: '#4C63D2', borderRadius: 2 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center' },
});