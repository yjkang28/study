import React, { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Easing, Dimensions, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AttendanceScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [userAttendance, setUserAttendance] = useState(null);
  const [studyAttendance, setStudyAttendance] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ▼▼▼ 사이드 메뉴 상태/애니메이션 ▼▼▼
  const [menuVisible, setMenuVisible] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current; // 0~1 사이 보간용
  const PANEL_WIDTH = Math.min(280, Math.round(screenWidth * 0.68));

  const openMenu = () => {
    setMenuVisible(true);
  };
  const closeMenu = () => {
    Animated.timing(slideX, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  useEffect(() => {
    if (menuVisible) {
      slideX.setValue(0);
      Animated.timing(slideX, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible, slideX]);
  // ▲▲▲ 사이드 메뉴 상태/애니메이션 ▲▲▲

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openMenu} style={{ marginRight: 15 }}>
          <Ionicons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
      ),
      headerShown: true,
      title: '출석률',
      headerStyle: { backgroundColor: '#002B5B' }, 
      headerTintColor: '#ffffff',  
      
    });
  }, [navigation]);

  const fetchData = async () => {
    const uid = await AsyncStorage.getItem('userId');
    setUserId(uid);
    try {
      const userRes = await api.get(`/attendance/user/${uid}/detail`);
      setUserAttendance(userRes.data);

      const studiesRes = await api.get(`/main/${uid}`);
      const studies = studiesRes.data?.studies ?? [];

      const studyResults = await Promise.all(
        studies.map(async (s) => {
          const res = await api.get(`/attendance/study/${s._id}/members`);
          return { _id: s._id, study: s.title, percent: res.data.members.find(m => m.userId === uid)?.percent || 0 };
        })
      );
      setStudyAttendance(studyResults);

      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const rankRes = await api.get(`/attendance/ranking/${monthStr}`);
      setRanking(rankRes.data);
    } catch (err) {
      console.error('출석률 데이터 불러오기 실패:', err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const pieData = userAttendance
    ? [
        { name: '출석', count: userAttendance.summary.출석, color: '#007AFF', legendFontColor: '#333', legendFontSize: 13 },
        { name: '지각', count: userAttendance.summary.지각, color: '#FFA500', legendFontColor: '#333', legendFontSize: 13 },
        { name: '결석', count: userAttendance.summary.결석, color: '#FF3B30', legendFontColor: '#333', legendFontSize: 13 },
      ]
    : [];

  // 애니메이션 변환값
  const translateX = slideX.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_WIDTH, 0],
  });
  const backdropOpacity = slideX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <TouchableOpacity onPress={() => navigation.navigate('UserAttendance')}>
          <Text style={styles.subHeader}>내 전체 출석률 ({userAttendance?.percent ?? 0}%)</Text>
          {userAttendance ? (
            <PieChart
              data={pieData}
              width={screenWidth - 16}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: () => '#333',
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          ) : (
            <Text style={styles.emptyText}>전체 출석 데이터가 없습니다.</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.subHeader}>스터디별 출석률</Text>
        {studyAttendance.length > 0 ? (
          studyAttendance.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.tableRow}
              onPress={() => navigation.navigate('StudyAttendance', { studyId: s._id, studyTitle: s.study })}
            >
              <Text style={{ flex: 2 }}>{s.study}</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: '600' }}>{s.percent}%</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>스터디별 출석 데이터가 없습니다.</Text>
        )}
      </ScrollView>

      {/* ===== 오른쪽 슬라이드 메뉴 ===== */}
      <Modal transparent visible={menuVisible} animationType="none" onRequestClose={closeMenu}>
        <View style={styles.modalRoot}>
          {/* 반투명 배경 */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </Pressable>

          {/* 패널 */}
          <Animated.View style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
            {/* 상단 바 */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderTitle} />
              <TouchableOpacity onPress={closeMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* 항목들 (navigate 비워둠) */}
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AttendanceCheck')}>
              <Text style={styles.menuText}>출석체크</Text>
            </TouchableOpacity>
            <View style={styles.separator} />

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MonthlyRanking')}>
              <Text style={styles.menuText}>출석률 랭킹</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      {/* ===== /오른쪽 슬라이드 메뉴 ===== */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 8 },
  subHeader: { fontSize: 16, fontWeight: '600', marginTop: 14, marginBottom: 6, marginLeft: 13 },
  emptyText: { textAlign: 'center', marginVertical: 10, color: '#aaa' },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  rankRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankNum: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  rankStudy: { flex: 1, fontSize: 16 },
  rankRate: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },

  // ---- 사이드 메뉴 스타일 ----
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: '#000' },
  panel: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  panelHeader: {
    height: 64,
    backgroundColor: '#002B5B', // 사진처럼 짙은 남색
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelHeaderTitle: { color: '#fff', fontWeight: '600' },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuText: { fontSize: 17,fontWeight:'600', color: '#222' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#D9D9D9', marginHorizontal: 12 },
});