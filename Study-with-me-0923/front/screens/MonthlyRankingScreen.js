import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function MonthlyRankingScreen() {
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/attendance/ranking/${monthStr}`);
      setRanking(res.data);
    } catch (err) {
      console.error('월간 랭킹 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRanking();
    setRefreshing(false);
  };

  // 상위 3등 컬러 테마 (사진 느낌)
  const rankTheme = (i) => {
    if (i === 0) return { main: '#F4C542', text: '#A97500', light: '#FFF9E6' }; // Gold
    if (i === 1) return { main: '#C9CED6', text: '#6B7280', light: '#F6F8FB' }; // Silver
    if (i === 2) return { main: '#D88B77', text: '#8A3D2B', light: '#FFF2EC' }; // Bronze
    return null;
  };

  const TopRow = ({ i, study, rate }) => {
    const t = rankTheme(i);
    return (
      <View
        style={[
          styles.topRow,
          { borderColor: t.main, backgroundColor: '#FFFFFF' } // 사진처럼 흰 배경 + 컬러 테두리
        ]}
      >
        {/* 좌측 동그라미 등수 아이콘 */}
        <View style={[styles.rankCircle, { borderColor: t.main }]}>
          <Text style={[styles.rankCircleText, { color: t.text }]}>{i + 1}</Text>
        </View>

        {/* 스터디명 (컬러 텍스트, 굵게) */}
        <Text style={[styles.topStudy, { color: t.text }]} numberOfLines={1}>
          {study}
        </Text>

        {/* 퍼센트 배지 (얇은 테두리, 둥근 캡슐) */}
        <View style={[styles.badge, { borderColor: t.main }]}>
          <Text style={[{color:t.text,fontWeight:'bold'}]}>{rate}%</Text>
        </View>
      </View>
    );
  };

  const NormalRow = ({ i, study, rate }) => (
    <View style={styles.normalRow}>
      <Text style={styles.normalRank}>{i + 1}</Text>
      <Text style={styles.normalStudy} numberOfLines={1}>{study}</Text>
      <Text style={styles.normalRate}>{rate}%</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>월간 출석률 랭킹</Text>

      {ranking.length > 0 ? (
        ranking.map((r, i) =>
          i < 3 ? (
            <TopRow key={i} i={i} study={r.study} rate={r['출석률']} />
          ) : (
            <NormalRow key={i} i={i} study={r.study} rate={r['출석률']} />
          )
        )
      ) : (
        <Text style={styles.emptyText}>이번 달 출석 데이터가 없습니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },

  /* ── 상위 1·2·3등 박스 ── */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    marginHorizontal: 10,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  rankCircleText: { fontSize: 13, fontWeight: '700' },
  topStudy: { flex: 1, fontSize: 15, fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor:'#fff',
  },
  //badgeText: { fontSize: 12, fontWeight: '700', color: "#111" },

  /* ── 4등 이하 (심플 라인) ── */
  normalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 2,
    marginHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  normalRank: { width: 22, textAlign: 'right', marginRight: 8, color: '#9CA3AF' },
  normalStudy: { flex: 1, fontSize: 15, color: '#111827' },
  normalRate: {fontSize: 14, fontWeight: '700', color: '#111', right: 13, },

  emptyText: { textAlign: 'center', marginTop: 20, color: '#aaa' },
});