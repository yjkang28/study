import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, BackHandler, Modal, TextInput, Switch, Platform,
  RefreshControl, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

const UI = {
    border: '#E5E7EB',       // 밝은 그레이 보더
    grid: '#EEF2F7',         // 아주 옅은 그리드
    zebra: '#FAFBFF',        // 지브라 배경
    weekend: '#F8FAFD',      // 주말 컬럼 배경
    headerBg: '#F3F6FB',     // 헤더 셀 배경
    textMuted: '#6B7280',
    hair: StyleSheet.hairlineWidth,
  };
/** ---------- 상수/도우미 ---------- */
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8~22시
const daysKo = ['월', '화', '수', '목', '금', '토', '일'];
const koToDow = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
const indexToDow = [1, 2, 3, 4, 5, 6, 0]; // 월~일 순서
const colors = { study: '#87CEFA', routine: '#90EE90' };

// 화면 너비에 맞춘 요일 칸 폭(시간 라벨 1 + 요일 7 = 8칸)
const screenWidth = Dimensions.get('window').width;
const dayWidth = Math.floor(screenWidth / 8);

// "HH:mm" -> {h, m}
const parseHHmm = (s) => {
  if (!s) return { h: 0, m: 0 };
  const [hh, mm] = String(s).split(':').map(n => parseInt(n, 10));
  return { h: hh || 0, m: mm || 0 };
};
const hourToHHmm = (h) => `${String(h).padStart(2, '0')}:00`;

const startOfWeekMon = (d) => {
  const x = new Date(d);
  const day = x.getDay(); // 0=일
  const diffToMonday = (day + 6) % 7;
  x.setDate(x.getDate() - diffToMonday);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isSameWeek = (a, b) => startOfWeekMon(a).getTime() === startOfWeekMon(b).getTime();
const isAfterOrSameWeek = (week, base) => startOfWeekMon(week).getTime() >= startOfWeekMon(base).getTime();

/** ---------- 컴포넌트 ---------- */
export default function MainScreen() {
  const navigation = useNavigation();

  const [userName, setUserName] = useState('');
  const [studyGroups, setStudyGroups] = useState([]);
  const [schedules, setSchedules] = useState([]); // 서버에서 내려오는 스터디 일정
  const [routinesRaw, setRoutinesRaw] = useState([]);

  // 새로고침 상태
  const [refreshing, setRefreshing] = useState(false);

  // 루틴 추가 모달/입력
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    title: '',
    days: [],          // 다중 요일
    startHour: 8,
    endHour: 9,
    repeatWeekly: true,
    startDate: new Date(), // 표시 기준 시작일(주차 기준)
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  // 주간 시작(월요일)
  const [weekStart, setWeekStart] = useState(() => startOfWeekMon(new Date()));
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  /** 뒤로가기 종료 */
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
          { text: "취소", style: "cancel" },
          { text: "종료", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  /** 데이터 로드 */
  const fetchData = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const userId = await AsyncStorage.getItem('userId');
      if (name) setUserName(name);
      if (!userId) return;

      const [studyRes, routineRes] = await Promise.all([
        api.get(`/main/${userId}`),     // { studies, schedules }
        api.get(`/routine/${userId}`),  // Routine[]
      ]);
      setStudyGroups(studyRes.data?.studies ?? []);
      setSchedules(studyRes.data?.schedules ?? []);
      setRoutinesRaw(routineRes.data ?? []);
    } catch (err) {
      console.error('불러오기 실패:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 최초 1회
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ 화면 재진입 시마다 자동 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // ✅ 당겨서 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /** 스터디 일정 → 시간표 포맷 (Schedule.js와 동일 구조) */
  const studySchedules = useMemo(() => {
    return (schedules || []).map(s => {
      const base = s.startDate ? new Date(s.startDate) : new Date();
      const shouldShow = s.repeatWeekly
        ? isAfterOrSameWeek(weekStart, base)
        : isSameWeek(weekStart, base);
      if (!shouldShow) return null;

      const { h: sh, m: sm } = parseHHmm(s.startTime);
      const { h: eh, m: em } = parseHHmm(s.endTime);

      return {
        _id: s._id,
        title: s.title,
        description: s.description,
        location: s.location,
        study: s.study,
        day: s.dayOfWeek === 0 ? '일' : daysKo[s.dayOfWeek - 1],
        start: sh + sm / 60,
        end: eh + em / 60,
        type: 'study',
      };
    }).filter(Boolean);
  }, [schedules, weekStart]);

  /** 루틴 → 시간표 포맷 (반복/주차 필터, 분 반영) */
  const routines = useMemo(() => {
    return (routinesRaw || []).map(r => {
      const base = r.startDate ? new Date(r.startDate) : (r.createdAt ? new Date(r.createdAt) : new Date());
      const shouldShow = r.repeatWeekly
        ? isAfterOrSameWeek(weekStart, base)      // 시작 주차 이후만
        : isSameWeek(weekStart, base);           // 해당 주차에만
      if (!shouldShow) return null;

      const { h: sh, m: sm } = parseHHmm(r.startTime);
      const { h: eh, m: em } = parseHHmm(r.endTime);

      return {
        _id: r._id,
        title: r.title,
        day: r.dayOfWeek === 0 ? '일' : daysKo[r.dayOfWeek - 1],
        start: sh + sm / 60,
        end: eh + em / 60,
        type: 'routine',
      };
    }).filter(Boolean);
  }, [routinesRaw, weekStart]);

  /** 합치기 */
  const mergedSchedules = useMemo(() => [...studySchedules, ...routines], [studySchedules, routines]);

  /** 주간 라벨 (예: "월\n9/8") */
  const weekDates = useMemo(() => {
    return indexToDow.map((_, idx) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + idx);
      return `${daysKo[idx]}\n${d.getMonth() + 1}/${d.getDate()}`;
    });
  }, [weekStart]);

  /** 주간 범위 텍스트 (25/9/8 ~ 9/14) */
  const weekRangeText = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);
    const yy = String(start.getFullYear()).slice(2);
    const sm = start.getMonth() + 1, sd = start.getDate();
    const em = end.getMonth() + 1,   ed = end.getDate();
    return `${yy}/${sm}/${sd} ~ ${em}/${ed}`;
  }, [weekStart]);

  /** 주간 이동 */
  const goPrevWeek = () => setWeekStart(prev => {
    const d = new Date(prev); d.setDate(d.getDate() - 7); return startOfWeekMon(d);
  });
  const goNextWeek = () => setWeekStart(prev => {
    const d = new Date(prev); d.setDate(d.getDate() + 7); return startOfWeekMon(d);
  });

  /** 루틴 저장(다중 요일 → 다중 생성) */
  const handleAddRoutine = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!newRoutine.title.trim()) return Alert.alert('안내', '일정명을 입력해주세요.');
      if (!newRoutine.days.length)  return Alert.alert('안내', '요일을 1개 이상 선택해주세요.');
      if (newRoutine.endHour <= newRoutine.startHour) return Alert.alert('안내', '종료 시간이 시작 시간보다 커야 합니다.');

      const posts = newRoutine.days.map(async dayKo => {
        const payload = {
          user: userId,
          title: newRoutine.title,
          dayOfWeek: koToDow[dayKo],
          startDate: newRoutine.startDate,                  // ✅ 주차 기준
          startTime: hourToHHmm(newRoutine.startHour),
          endTime:   hourToHHmm(newRoutine.endHour),
          repeatWeekly: newRoutine.repeatWeekly,
          color: colors.routine,
        };
        const res = await api.post('/routine', payload);
        return res.data;
      });
      const created = await Promise.all(posts);
      setRoutinesRaw(prev => [...prev, ...created]);
      setRoutineModalVisible(false);
      setNewRoutine({ title: '', days: [], startHour: 8, endHour: 9, repeatWeekly: true, startDate: new Date() });
    } catch (err) {
      console.error('루틴 등록 실패:', err.message);
      Alert.alert('등록 실패', '입력값을 확인해주세요.');
    }
  };

  /** 루틴 삭제 */
  const handleDeleteRoutine = (id) => {
    Alert.alert('루틴 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소' },
      {
        text: '삭제', onPress: async () => {
          await api.delete(`/routine/${id}`);
          setRoutinesRaw(prev => prev.filter(r => r._id !== id));
        }
      }
    ]);
  };

  /** 렌더 */
  return (
    <View style={styles.container}>
      {/* 상단바 (프로필 버튼 유지) */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color="white" onPress={() => navigation.navigate('알림내역')} />
        <TouchableOpacity onPress={() => navigation.navigate('내 프로필')}>
          <Text style={styles.username}>{userName || 'user_name'}</Text>
        </TouchableOpacity>
      </View>

      {/* 주간 전환 + 범위 표시(탭하면 주 선택) */}
      <View style={styles.weekSwitcher}>
        <TouchableOpacity onPress={goPrevWeek} style={styles.weekBtn}>
          <Ionicons name="chevron-back" size={18} />
          <Text>이전 주</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowWeekPicker(true)}>
          <Text style={styles.weekTitle}>{weekRangeText}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goNextWeek} style={styles.weekBtn}>
          <Text>다음 주</Text>
          <Ionicons name="chevron-forward" size={18} />
        </TouchableOpacity>
      </View>

      {/* 주 선택 DatePicker */}
      {showWeekPicker && (
        <DateTimePicker
          value={weekStart}
          mode="date"
          onChange={(e, date) => {
            if (Platform.OS !== 'ios') setShowWeekPicker(false);
            if (date) setWeekStart(startOfWeekMon(date));
          }}
        />
      )}

      {/* 시간표 + 스터디 목록을 한 스크롤로 묶기 */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
       {/* 시간표 카드 컨테이너 */}
        <View style={styles.timetableCard}>
          {/* 헤더: 좌측 교차점 + 요일 라벨 */}
          <View style={styles.timetableHeaderRow}>
            <View style={[styles.timeCell, styles.cornerCell, styles.col]}>
              <TouchableOpacity style={styles.addRoutineBtn} onPress={() => setRoutineModalVisible(true)}>
                <Ionicons name="add" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {weekDates.map((label, i) => {
              const dow = indexToDow[i];                 // 1..6,0
              const isWeekend = dow === 6 || dow === 0; 
              const isLast = i === weekDates.length - 1; 
              return (
                <View
                  key={i}
                  style={[
                  styles.dayCell,
                  styles.col,
                  isWeekend && styles.weekendCol,
                  isLast && styles.noRightBorder 
                ]}
                >
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
              );
            })}
          </View>

          {/* 본문(각 시간 행) */}
          {hours.map((hour, rIdx) => {
            const zebra = rIdx % 2 === 1;
            return (
              <View key={hour} style={[styles.row, zebra && styles.zebraRow]}>
                {/* 좌측 시간 라벨 셀 */}
                <View style={[styles.timeCell, styles.col]}>
                  <Text style={styles.timeLabel}>{hour}:00</Text>
                </View>

                {/* 7일 칸 */}
                {indexToDow.map((dow, i) => {
                  const isWeekend = dow === 6 || dow === 0;
                  const isLast = i === indexToDow.length - 1;
                  const overlapping = mergedSchedules.filter(s =>
                    koToDow[s.day] === dow &&
                    s.start < hour + 1 &&
                    s.end > hour
                  );

                  if (overlapping.length === 0) {
                    return (
                      <View
                        key={i}
                        style={[
                        styles.cell,
                        styles.col,
                        isWeekend && styles.weekendCol,
                        isLast && styles.noRightBorder           
                        ]}
                      />
                    );
                  }

                  const item = overlapping[0];
                  const backgroundColor = item.type === 'study' ? colors.study : colors.routine;

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => item.type === 'study'
                        ? navigation.navigate('Studyroommain', { studyId: item.study, studyName: item.title })
                        : handleDeleteRoutine(item._id)
                      }
                      style={[
                        styles.cell,
                        styles.col,
                        isWeekend && styles.weekendCol,
                        styles.blockCell,
                        isLast && styles.noRightBorder,
                        { backgroundColor }
                      ]}
                    >
                      <Text style={styles.blockText} numberOfLines={2}>{item.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* ✅ 이번 주 스터디 일정 목록 */}
        <Text style={styles.sectionTitle}>이번 주 스터디 일정</Text>
        <View style={styles.studyList}>
          {studySchedules.length === 0 ? (
            <Text style={styles.emptyText}>이번 주 스터디 일정이 없습니다</Text>
          ) : (
            studySchedules.map((s) => (
              <View key={s._id} style={styles.scheduleItem}>
                <Text style={styles.scheduleTitle}>{s.title}</Text>
                <Text style={styles.scheduleInfo}>📍 {s.location || '장소 미정'}</Text>
                <Text style={styles.scheduleInfo}>🕒 {s.start}시 ~ {s.end}시</Text>
                {s.description && (
                  <Text style={styles.scheduleDesc}>{s.description}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* 스터디 목록 */}
        <Text style={styles.sectionTitle}>내 스터디 그룹 목록</Text>
        <View style={styles.studyList}>
          {studyGroups.length === 0 ? (
            <Text style={styles.emptyText}>가입중인 스터디가 없습니다</Text>
          ) : (
            studyGroups.map((study) => (
              <TouchableOpacity
                key={study._id}
                style={styles.studyItem}
                onPress={() =>
                  navigation.navigate('Studyroommain', {
                    studyId: study._id,
                    studyName: study.title,
                  })
                }
              >
                <Text style={styles.studyTitle}>{study.title}</Text>
                <Text style={styles.studyDesc}>{study.description}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 채팅 FAB */}
      <TouchableOpacity style={styles.chatFab} onPress={() => navigation.navigate('채팅목록')}>
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      {/* 루틴 추가 모달 */}
      <Modal visible={routineModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>개인 루틴 추가</Text>

            <Text style={styles.label}>일정명</Text>
            <TextInput
              value={newRoutine.title}
              onChangeText={(t) => setNewRoutine({ ...newRoutine, title: t })}
              style={styles.input}
              placeholder="예: 헬스장"
            />

            {/* 시작일(주차 기준) */}
            <Text style={styles.label}>시작일 (해당 주부터 표시)</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)}>
              <Ionicons name="calendar" size={16} />
              <Text style={{ marginLeft: 6 }}>
                {`${newRoutine.startDate.getFullYear()}/${newRoutine.startDate.getMonth() + 1}/${newRoutine.startDate.getDate()}`}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={newRoutine.startDate}
                mode="date"
                onChange={(e, date) => {
                  setShowStartDatePicker(false);
                  if (date) setNewRoutine(prev => ({ ...prev, startDate: date }));
                }}
              />
            )}

            {/* 요일 (다중) */}
            <Text style={styles.label}>요일 (복수 선택 가능)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {daysKo.map(day => {
                const selected = newRoutine.days.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setNewRoutine(prev => ({
                        ...prev,
                        days: selected ? prev.days.filter(d => d !== day) : [...prev.days, day]
                      }));
                    }}
                    style={[styles.dayBtn, selected && styles.dayBtnActive]}
                  >
                    <Text style={{ color: selected ? 'white' : 'black' }}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 시간 */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>시작 시간</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(newRoutine.startHour)}
                  onChangeText={(t) => setNewRoutine({ ...newRoutine, startHour: parseInt(t || '0', 10) })}
                  style={styles.input}
                  placeholder="예: 8"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>종료 시간</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(newRoutine.endHour)}
                  onChangeText={(t) => setNewRoutine({ ...newRoutine, endHour: parseInt(t || '0', 10) })}
                  style={styles.input}
                  placeholder="예: 10"
                />
              </View>
            </View>

            {/* 반복 */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>매주 반복</Text>
              <Switch
                value={newRoutine.repeatWeekly}
                onValueChange={(v) => setNewRoutine({ ...newRoutine, repeatWeekly: v })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRoutineModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRoutine} style={styles.saveBtn}>
                <Text style={styles.saveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** ---------- 스타일 ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 35 },

  header: {
    height: 50,
    backgroundColor: '#002B5B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14
  },
  username: { color: 'white', fontSize: 16 },

  weekSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  weekBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 15, backgroundColor: '#ffffff',
    borderWidth:1, borderColor: '#eee',
  },
  weekTitle: { fontWeight: '600' },
  timetableCard: {
  marginHorizontal: 12,
  marginTop: 8,
  borderWidth: UI.hair,
  borderColor: UI.border,
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#fff',
},
col: { flex: 1 },
noRightBorder: { borderRightWidth: 0 },
 timetableHeaderRow: {
  flexDirection: 'row',
  backgroundColor: UI.headerBg,
  borderBottomWidth: UI.hair,
  borderBottomColor: UI.border,
},
 row: {
  flexDirection: 'row',
  borderBottomWidth: UI.hair,        
  borderBottomColor: UI.grid,
},
zebraRow: {
  backgroundColor: UI.zebra,        
},
  timeCell: {
  justifyContent: 'center',
  alignItems: 'center',
  height: 40,
  borderRightWidth: UI.hair,         // 좌측 영역과 요일 영역 구분
  borderRightColor: UI.border,
  backgroundColor: '#fff',
},
  cornerCell: {
  height: 44,                         // 헤더 높이에 맞춤
  backgroundColor: UI.headerBg,
},

dayCell: {
  height: 44,
  justifyContent: 'center',
  alignItems: 'center',
  borderRightWidth: UI.hair,
  borderRightColor: UI.border,
},
dayLabel: {
  textAlign: 'center',
  fontSize: 12,
  lineHeight: 16,
  color: '#111',
},
  cell: {
  height: 40,
  borderRightWidth: UI.hair,          // 세로 분할선만
  borderRightColor: UI.grid,
  justifyContent: 'center',
},
  weekendCol: {
    backgroundColor: UI.weekend,
  },
  blockCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,               // 살짝 줄여 자연스럽게
    borderRightWidth: UI.hair,          // ✅ 빈 칸과 동일
    borderRightColor: UI.grid,   
  },
  blockText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#0F172A',
  },
  timeLabel: {
    fontSize: 12,
    color: UI.textMuted,
  },
  addRoutineBtn: {
    backgroundColor: '#00aaff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: { marginLeft: 16, marginTop: 12, fontWeight: 'bold', fontSize: 16 },
  studyList: { paddingHorizontal: 16, paddingTop: 8, },
  studyItem: { backgroundColor: 'white', padding: 12, borderRadius: 15,
    borderWidth: 1,borderColor:'#eee', marginBottom: 8 },
  studyTitle: { fontSize: 16, fontWeight: 'bold' },
  studyDesc: { fontSize: 13, color: '#555' },

  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 16 },

  chatFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#00aaff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 18, borderRadius: 12, width: '86%' },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },

  label: { marginTop: 8, marginBottom: 4, fontSize: 13, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 4 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc',
    borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6
  },
  dayBtn: {
    paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#ccc',
    borderRadius: 6, marginRight: 6, marginVertical: 6
  },
  dayBtnActive: { backgroundColor: '#00aaff', borderColor: '#00aaff' },

  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#eee', borderRadius: 8, marginRight: 8 },
  cancelText: { color: '#333', fontWeight: '600' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#00aaff', borderRadius: 8 },
  saveText: { color: 'white', fontWeight: '700' },

  scheduleItem: {
    backgroundColor: 'white',
    padding: 10,
    //borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#00aaff',
    
  },
  scheduleTitle: { fontSize: 15, fontWeight: 'bold' },
  scheduleInfo: { fontSize: 13, color: '#333', marginTop: 2 },
  scheduleDesc: { fontSize: 12, color: '#555', marginTop: 2 },
});
