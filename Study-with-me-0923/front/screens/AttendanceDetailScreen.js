import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const statusOptions = ['출석', '지각', '결석'];

const COLORS = {
  border: '#E5E7EB',
  cardBg: '#FFFFFF',
  rowBg: '#FFFFFF',
  label: '#6B7280',
  name: '#111827',
  dotGray: '#C1C7D0',
  activeBlue: '#007AFF',     // 출석
  activeYellow: '#FFC107',   // 지각
  activeRed: '#FF3B30',      // 결석
};

export default function AttendanceDetailScreen({ route }) {
  const { scheduleId } = route.params;
  const [participants, setParticipants] = useState([]);
  const [canCheck, setCanCheck] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  /** 📌 참여자 불러오기 (기능 유지) */
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

  /** 📌 새로고침 (기능 유지) */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  }, [fetchParticipants]);

  /** 📌 출석 체크 (기능 유지 + 이중 보호) */
  const handleCheck = async (userId, status) => {
    if (!canCheck) return;
    const uid = await AsyncStorage.getItem('userId');
    try {
      await api.post('/attendance/check', { scheduleId, userId, status, checkerId: uid });
      await fetchParticipants();
    } catch (err) {
      console.error('출석 체크 실패:', err.message);
    }
  };

  /** UI: 상태 아이콘 버튼 하나 렌더 */
  const StatusIconBtn = ({ active, type, onPress, disabledVisual }) => {
    let iconName = 'ellipse';   // 기본: 동그라미
    let color = COLORS.dotGray;

    if (type === '출석') {
      iconName = 'ellipse';
      color = active ? COLORS.activeBlue : COLORS.dotGray;
    } else if (type === '지각') {
      iconName = 'triangle';
      color = active ? COLORS.activeYellow : COLORS.dotGray;
    } else if (type === '결석') {
      iconName = 'close';
      color = active ? COLORS.activeRed : COLORS.dotGray;
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.iconButton, disabledVisual && { opacity: 0.6 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={20} color={color} />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>출석체크</Text>

      {/* 카드 박스 */}
      <View style={styles.card}>
        {/* 헤더 라벨 줄 */}
        <View style={styles.headerRow}>
          <View style={styles.colNameHeader} />
          <View style={styles.colIconHeader}>
            <Text style={styles.headerLabel}>출석</Text>
          </View>
          <View style={styles.colIconHeader}>
            <Text style={styles.headerLabel}>지각</Text>
          </View>
          <View style={styles.colIconHeader}>
            <Text style={styles.headerLabel}>결석</Text>
          </View>
        </View>

        {/* 데이터 행들 */}
        {participants.length > 0 ? (
          participants.map((p, i) => (
            <View key={i} style={styles.row}>
              {/* 이름 */}
              <View style={styles.colName}>
                <Text
                  style={styles.nameText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {p.username}
                </Text>
              </View>

              {/* 출석 */}
              <View style={styles.colIcon}>
                <StatusIconBtn
                  type="출석"
                  active={p.status === '출석'}
                  disabledVisual={!canCheck}
                  onPress={() => {
                    if (!canCheck) return setModalVisible(true);
                    handleCheck(p._id, '출석'); // 기능 그대로
                  }}
                />
              </View>

              {/* 지각 */}
              <View style={styles.colIcon}>
                <StatusIconBtn
                  type="지각"
                  active={p.status === '지각'}
                  disabledVisual={!canCheck}
                  onPress={() => {
                    if (!canCheck) return setModalVisible(true);
                    handleCheck(p._id, '지각'); // 기능 그대로
                  }}
                />
              </View>

              {/* 결석 */}
              <View style={styles.colIcon}>
                <StatusIconBtn
                  type="결석"
                  active={p.status === '결석'}
                  disabledVisual={!canCheck}
                  onPress={() => {
                    if (!canCheck) return setModalVisible(true);
                    handleCheck(p._id, '결석'); // 기능 그대로
                  }}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={{ paddingVertical: 24 }}>
            <Text style={styles.emptyText}>참여자가 없습니다.</Text>
          </View>
        )}
      </View>

      {/* 모달 (기능 유지) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Ionicons name="time-outline" size={28} color={COLORS.activeBlue} style={{ marginBottom: 8 }} />
            <Text style={styles.modalTitle}>지금은 출석 체크 시간이 아니에요</Text>
            <Text style={styles.modalDesc}>
              호스트가 설정한 체크 가능 시간에만 출석/지각/결석을 선택할 수 있어요.
            </Text>
            <Pressable style={styles.modalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginTop: 12, marginBottom: 15, marginLeft: 14 },

  // 카드
  card: {
    marginHorizontal: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  // 헤더 라인
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  colNameHeader: { flex: 1, minWidth: 0 }, // 이름 칼럼 자리 맞춤
  colIconHeader: { width: 52, alignItems: 'center' },
  headerLabel: { fontSize: 12, color: COLORS.label },

  // 데이터 행
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.rowBg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 4,
  },

  // 칼럼
  colName: { flex: 1, minWidth: 0, paddingRight: 8 },
  colIcon: { width: 52, alignItems: 'center', justifyContent: 'center' },

  // 텍스트
  nameText: { fontSize: 14, color: COLORS.name },

  // 아이콘 버튼
  iconButton: { paddingVertical: 4, paddingHorizontal: 4 },

  // 빈 상태
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13 },

  // 모달
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  modalBtn: {
    marginTop: 4,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});