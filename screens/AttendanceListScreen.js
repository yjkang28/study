import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

/** 예시 데이터: startAt을 ISO로!
 *  현지시간(+09:00 등)을 명확히 하려면 오프셋을 포함하세요.
 */
const schedulesSeed = [
  {
    id: 'sch_001',
    title: '@@ 스터디',
    startAt: '2025-08-21T17:00:00+09:00', // 일정 시작 시각
    durationHours: 3,                      // (선택) 표시용
    peopleText: '00명',
  },
  {
    id: 'sch_002',
    title: '&& 스터디',
    startAt: '2025-08-30T17:00:00+09:00',
    durationHours: 3,
    peopleText: '00명',
  },
  {
    id: 'sch_003',
    title: '++ 스터디',
    startAt: '2025-08-30T17:00:00+09:00',
    durationHours: 3,
    peopleText: '00명',
  },
];

/** 시간 유틸 */
const toDate = (iso) => new Date(iso);
const addHours = (date, h) => new Date(date.getTime() + h * 3600 * 1000);
const formatYMD = (d) =>
  `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
const formatHM = (d) =>
  `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

const AttendanceListScreen = () => {
  const navigation = useNavigation();
  const [now, setNow] = useState(new Date());
  const [schedules, setSchedules] = useState(schedulesSeed);

  // 1분마다 갱신해서 자동 소멸/활성화 반영
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // 24시간 지나면 목록에서 제외
  const visibleSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const start = toDate(s.startAt);
      const expire = addHours(start, 24);
      return now < expire; // 만료 전까지만 보이기
    });
  }, [schedules, now]);

  const handlePress = (item) => {
    const start = toDate(item.startAt);
    const canEnter = now >= start; // 시작 시각부터 입장 가능
    if (!canEnter) {
      Alert.alert('아직 출석할 수 없어요', '일정 시작 시각 이후에 다시 시도해 주세요.');
      return;
    }
    navigation.navigate('출석체크', {
      scheduleId: item.id,
      title: item.title,
      startAt: item.startAt,
    });
  };

  const renderItem = ({ item }) => {
    const start = toDate(item.startAt);
    const end = addHours(start, item.durationHours ?? 0);
    const isBefore = now < start; // 시작 전(비활성 상태 표시)
    const dayText = formatYMD(start);
    const timeText = `${formatHM(start)} ~ ${item.durationHours ? formatHM(end) : ''}`.trim();

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePress(item)}
        style={[styles.card, isBefore && styles.cardDisabled]}
      >
        {/* 상단: 제목 + 인원/상태 */}
        <View style={styles.row}>
          <Text style={[styles.title, isBefore && styles.textDisabled]}>{item.title}</Text>
          <View style={styles.rightWrap}>
            {isBefore ? (
              <View style={styles.badgeSoon}><Text style={styles.badgeSoonText}>시작 전</Text></View>
            ) : (
              <Text style={styles.people}>{item.peopleText}</Text>
            )}
          </View>
        </View>

        {/* 하단: 날짜 + 시간 */}
        <View style={[styles.row, { marginTop: 6 }]}>
          <Text style={[styles.meta, isBefore && styles.textDisabled]}>{dayText}</Text>
          <View style={styles.dot} />
          <Text style={[styles.meta, isBefore && styles.textDisabled]}>{timeText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>출석체크</Text>
      </View>

      {/* 목록 */}
      <FlatList
        data={visibleSchedules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: '#556070' }}>표시할 출석 일정이 없습니다.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default AttendanceListScreen;

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f2a3a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  listContent: { paddingHorizontal: 18, paddingVertical: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E6EA',
    ...(Platform.OS === 'android'
      ? { elevation: 0 }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
        }),
  },
  cardDisabled: { opacity: 0.55 },

  row: { flexDirection: 'row', alignItems: 'center' },

  title: { fontSize: 14.5, fontWeight: '600', color: '#0f2a3a' },
  people: { marginLeft: 8, color: '#8A96A3', fontSize: 12 },

  meta: { color: '#2f3b45', fontSize: 12 },
  dot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#2f3b45',
    marginHorizontal: 8, opacity: 0.6,
  },

  rightWrap: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  badgeSoon: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: '#E8EEF5',
  },
  badgeSoonText: { fontSize: 11, color: '#3C5067', fontWeight: '600' },

  textDisabled: { color: '#8fa0ae' },
});