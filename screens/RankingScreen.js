import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const studyData = [
  { rank: 1, studyName: '*** 스터디', rate: 95 },
  { rank: 2, studyName: '@@ 스터디', rate: 90 },
  { rank: 3, studyName: '!!!!! 스터디', rate: 89 },
  { rank: 4, studyName: '$$ 스터디', rate: 85 },
  { rank: 5, studyName: '00 스터디', rate: 80 },
  { rank: 6, studyName: '%% 스터디', rate: 78 },
  { rank: 7, studyName: '== 스터디', rate: 75 },
  { rank: 8, studyName: '/// 스터디', rate: 70 },
];

const rawPersonalData = [
  { name: 'user_name1', present: 100, late: 0, absent: 0 },
  { name: 'user_name2', present: 80, late: 1, absent: 1 },
  { name: 'user_name1', present: 70, late: 2, absent: 2 },
  { name: 'user_name4', present: 65, late: 1, absent: 0 },
  { name: 'user_name5', present: 60, late: 0, absent: 0 },
  { name: 'user_name6', present: 55, late: 1, absent: 0 },
  { name: 'user_name7', present: 50, late: 0, absent: 0 },
  { name: 'user_name8', present: 40, late: 0, absent: 0 },
];

// 점수 계산 및 정렬
const personalData = rawPersonalData
  .map((user) => ({
    ...user,
    score: user.present * 10 + user.late * -5 + user.absent * -10,
  }))
  .sort((a, b) => b.score - a.score)
  .map((user, index) => ({ ...user, rank: index + 1 }));


const getBorderColor = (rank) => {
  if (rank === 1) return '#FFD700'; // 금색
  if (rank === 2) return '#C0C0C0'; // 은색
  if (rank === 3) return '#CD7F32'; // 동색
  return '#E0E0E0'; // 나머지
};

const StudyRankingItem  = ({ item }) => {
  return (
    <View style={[styles.itemContainer, { borderColor: getBorderColor(item.rank) }]}>
      <View style={styles.rankCircle}>
        {item.rank <= 3 ? (
          <Ionicons name="medal-outline" size={20} color={getBorderColor(item.rank)} />
        ) : (
          <Text style={styles.rankText}>{item.rank}</Text>
        )}
      </View>
      <Text style={styles.studyName}>{item.studyName}</Text>
      <Text style={styles.rate}>{item.rate}%</Text>
    </View>
  );
};

const PersonalRankingItem = ({ item }) => (
  <View style={[styles.itemContainer, { borderColor: getBorderColor(item.rank) }]}>
    <View style={styles.rankCircle}>
      {item.rank <= 3 ? (
        <Ionicons name="medal-outline" size={20} color={getBorderColor(item.rank)} />
      ) : (
        <Text style={styles.rankText}>{item.rank}</Text>
      )}
    </View>
    <Text style={styles.studyName}>{item.name}</Text>
    <Text style={styles.rate}>{item.score}</Text>
  </View>
);


const RankingScreen = () => {
  const [selectedTab, setSelectedTab] = useState('study');

  
  const renderRankingList = () => {
    if (selectedTab === 'study') {
      return (
        <>
          <Text style={styles.title}>스터디별 8월 출석률 랭킹</Text>
          <FlatList
            data={studyData}
            renderItem={({ item }) => <StudyRankingItem item={item} />}
            keyExtractor={(item) => `study-${item.rank}`}
          />
        </>
      );
    } else {
      return (
        <>
          <Text style={styles.title}>8월 개인 랭킹</Text>
          <FlatList
            data={personalData}
            renderItem={({ item }) => <PersonalRankingItem item={item} />}
            keyExtractor={(item) => `personal-${item.rank}`}
          />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>출석률 랭킹</Text>
      </View>

      <View style={styles.in_container}>{renderRankingList()}</View>

      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'study' && styles.tabSelected]}
          onPress={() => setSelectedTab('study')}
        >
          <Text style={[styles.tabText, selectedTab === 'study' && styles.tabTextSelected]}>
            월별 스터디 랭킹
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'personal' && styles.tabSelected]}
          onPress={() => setSelectedTab('personal')}
        >
          <Text style={[styles.tabText, selectedTab === 'personal' && styles.tabTextSelected]}>
            월별 개인 랭킹
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RankingScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#002F4B',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  in_container: { paddingHorizontal: 20, paddingTop: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 15,
    padding: 12,
    marginBottom: 8,
  },
  rankCircle: { width: 30, alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 16, fontWeight: 'bold' },
  studyName: { flex: 1, fontSize: 16 },
  rate: { fontWeight: 'bold', fontSize: 16 },
  bottomTab: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginBottom: 45,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabSelected: {
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
  },
  tabText: { fontSize: 14, color: '#888' },
  tabTextSelected: { color: '#007AFF', fontWeight: 'bold' },
});