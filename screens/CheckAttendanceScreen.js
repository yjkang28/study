import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Entypo } from '@expo/vector-icons';

const demoMembers = [
  { id: 'u1', name: '김**' },
  { id: 'u2', name: '박**' },
  { id: 'u3', name: '오**' },
  { id: 'u4', name: '도**' },
  { id: 'u5', name: '정**' },
  { id: 'u6', name: '박**' },
];

const formatYMD = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}/${d.getMonth() + 1}/${d.getDate()}`;
};

// 아이콘/색상 정의 (지각은 Entypo triangle-up 사용!)
const OPTION_META = {
  present: { label: '출석', lib: 'ion', name: 'ellipse', color: '#1E86FF' },
  late:    { label: '지각', lib: 'entypo', name: 'triangle-up', color: '#FFC107' },
  absent:  { label: '결석', lib: 'ion', name: 'close', color: '#F44336' },
};
const INACTIVE = '#B8C1CC';
const ICON_SIZE = 22; 
const ROW_VPAD  = 10;

export default function CheckAttendanceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { title = '@@ 스터디', startAt = '', members, initialAttendance } =
    route.params || {};

  const memberList = useMemo(() => members ?? demoMembers, [members]);

  const [attendMap, setAttendMap] = useState(() => {
    const base = {};
    (memberList || []).forEach(m => { base[m.id] = initialAttendance?.[m.id] ?? null; });
    return base;
  });

  const setStatus = (memberId, status) => {
    setAttendMap(prev => ({ ...prev, [memberId]: status }));
  };

  const onSave = () => {
    navigation.navigate('AttendanceListScreen', {
      updated: true,
      attendanceResult: {
        scheduleId: route.params?.scheduleId,
        title, startAt, attendance: attendMap,
      },
    });
  };

  const renderRow = ({ item }) => {
    const status = attendMap[item.id];

    const Option = ({ type }) => {
      const meta = OPTION_META[type];
      const active = status === type;
      const color = active ? meta.color : INACTIVE;

      return (
        <TouchableOpacity style={styles.optionCell} onPress={() => setStatus(item.id, type)} activeOpacity={0.8}>
          {meta.lib === 'entypo' ? (
            <Entypo name={meta.name} size={ICON_SIZE} color={color} />
          ) : (
            <Ionicons name={meta.name} size={ICON_SIZE} color={color} />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.row}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Option type="present" />
        <Option type="late" />
        <Option type="absent" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>출석체크</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* 스터디 정보 */}
      <View style={styles.infoWrap}>
        <View style={styles.infoTop}>
          <Text style={styles.studyTitle}>{title}</Text>
          <Text style={styles.countText}>00명</Text>
        </View>
        {!!startAt && <Text style={styles.dateText}>{formatYMD(startAt)}</Text>}
      </View>

      {/* 표 카드 */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.headerNameCell]} />
          <Text style={styles.headerCell}>출석</Text>
          <Text style={styles.headerCell}>지각</Text>
          <Text style={styles.headerCell}>결석</Text>
        </View>

        <FlatList
          data={memberList}
          keyExtractor={(m) => m.id}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 6 }}
        />
      </View>

      {/* 저장 */}
      <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.9}>
        <Text style={styles.saveText}>저장</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0f2a3a', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16,
    marginBottom: 5,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  infoWrap: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  infoTop: { flexDirection: 'row', alignItems: 'center' },
  studyTitle: { fontSize: 16, fontWeight: '600', color: '#0f2a3a' },
  countText: { marginLeft: 8, color: '#8A96A3', fontSize: 12 },
  dateText: { marginTop: 6, color: '#2f3b45', fontSize: 12 },

  card: {
    backgroundColor: '#fff', marginHorizontal: 18, marginTop: 8, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E6EA',
    ...(Platform.OS === 'android' ? { elevation: 0 } : {
      shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    }),
  },

  /* --- 헤더/열 정렬 --- */
  headerRow: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 8 },
  headerCell: { flex: 1, textAlign: 'center', color: '#7C8794', fontSize: 12, fontWeight: '600' },
  headerNameCell: { flex: 1.25, textAlign: 'left' },        // 이름 칸과 동일 폭으로!

  /* --- 데이터 행 --- */
 row: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 4,
paddingVertical: ROW_VPAD,  
  minHeight: 52,              
 },

  memberName: { flex: 1.25, color: '#2f3b45', fontSize: 13.5, fontWeight: '500', marginRight: 4 },
  optionCell: { flex: 1, alignItems: 'center' },
  separator: { height: 1, backgroundColor: '#EEF2F6', marginHorizontal: 4, opacity: 0.9 },

  saveBtn: {
    marginTop: 'auto', marginHorizontal: 18, marginBottom: 50,
    backgroundColor: '#0f2a3a', borderRadius: 24, alignItems: 'center', paddingVertical: 14,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});