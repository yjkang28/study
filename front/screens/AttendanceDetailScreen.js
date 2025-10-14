import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const statusOptions = ['출석', '지각', '결석'];

export default function AttendanceDetailScreen({ route }) {
  const { scheduleId } = route.params;
  const [participants, setParticipants] = useState([]);
  const [canCheck, setCanCheck] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /** 📌 참여자 불러오기 */
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await api.get(`/schedule/${scheduleId}`);
      const parsed = (res.data.participants || []).map((p) => ({
        ...p,
        status: p.status || p.attendanceStatus || null,
      }));
      setParticipants(parsed);
      setCanCheck(res.data.canCheck ?? false);
    } catch (err) {
      console.error('참여자 목록 불러오기 실패:', err.message);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  /** 📌 새로고침 핸들러 */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  }, [fetchParticipants]);

  /** 📌 출석 체크 */
  const handleCheck = async (userId, status) => {
    if (!canCheck) return;
    const uid = await AsyncStorage.getItem('userId');
    try {
      await api.post('/attendance/check', { scheduleId, userId, status, checkerId: uid });
      // ✅ 체크 후 목록 새로 불러오기
      await fetchParticipants();
    } catch (err) {
      console.error('출석 체크 실패:', err.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>출석 체크</Text>
      {participants.length > 0 ? (
        participants.map((p, i) => (
          <View key={i} style={styles.participantRow}>
            <Text style={{ flex: 2 }}>{p.username}</Text>
            <View style={styles.statusButtons}>
              {statusOptions.map((s) => (
                <TouchableOpacity
                  key={s}
                  disabled={!canCheck}
                  style={[styles.statusBtn, p.status === s && styles.activeStatus]}
                  onPress={() => handleCheck(p._id, s)}
                >
                  <Ionicons
                    name={p.status === s ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={p.status === s ? '#007AFF' : '#aaa'}
                  />
                  <Text style={styles.statusText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>참여자가 없습니다.</Text>
      )}
      {canCheck ? (
        <Text style={styles.noticeOk}>✅ 현재 출석 체크가 가능합니다.</Text>
      ) : (
        <Text style={styles.notice}>⏰ 현재는 출석 체크 가능 시간이 아닙니다.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  participantRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtons: { flex: 3, flexDirection: 'row', justifyContent: 'space-around' },
  statusBtn: { flexDirection: 'row', alignItems: 'center' },
  activeStatus: { backgroundColor: '#e6f0ff', borderRadius: 6, padding: 4 },
  statusText: { marginLeft: 4 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#aaa' },
  notice: { textAlign: 'center', marginTop: 10, color: '#FF3B30', fontWeight: '600' },
  noticeOk: { textAlign: 'center', marginTop: 10, color: '#007AFF', fontWeight: '600' },
});
