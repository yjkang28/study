import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable, Platform, StatusBar} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


const { width: screenWidth } = Dimensions.get('window');

const attendanceData = [
  { studyName: '**스터디', present: 25, late: 1, absent: 2 },
  { studyName: '@@스터디', present: 14, late: 0, absent: 0 },
];

const MENU_ITEMS = [
  { label: '출석체크', route: '출석리스트' }, // <- 네 앱의 라우트명에 맞게 변경 가능
  { label: '출석률 랭킹', route: '출석률 랭킹' },      // <- 기존 RankingScreen으로 이동
];


const AttendanceScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const chartData = {
    labels: attendanceData.map(d => d.studyName),
    datasets: [
      {
        data: attendanceData.map(d => {
          const total = d.present + d.late + d.absent;
          return total === 0 ? 0 : Math.round((d.present / total) * 100);
        }),
      },
    ],
  };

  const handleNavigate = (route) => {
    setMenuVisible(false);
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>

      {/* 상단바 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>출석률</Text>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* 오른쪽 사이드 패널: 가로 = 화면의 2/3, 세로 = 전체 */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        {/* 오버레이 (바깥 터치 시 닫힘) */}
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          {/* 패널 자체는 오버레이 위에 겹치도록 배치 */}
          <Pressable style={styles.sidePanel} onPress={() => {}}>
            {/* 패널 상단 헤더 */}
            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
            </View>

            {/* 메뉴 아이템 */}
            {MENU_ITEMS.map((item, idx) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
                {idx < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.in_container}>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 204, 0, ${opacity})`, // yellow-ish
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={styles.chart}
        showBarTops={true}
      />

     <View style={styles.tableHeader}>
        <Text style={styles.studyHeader}></Text>
        <View style={[styles.legendBadge, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.legendText}>출석</Text>
        </View>
        <View style={[styles.legendBadge, { backgroundColor: '#FFC107' }]}>
          <Text style={styles.legendText}>지각</Text>
        </View>
        <View style={[styles.legendBadge, { backgroundColor: '#F44336' }]}>
          <Text style={styles.legendText}>결석</Text>
        </View>
      </View>

      <FlatList
        data={attendanceData}
        keyExtractor={(item) => item.studyName}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <Text style={styles.cardCol}>{item.studyName}</Text>
            <Text style={styles.cardCol}>{item.present}</Text>
            <Text style={styles.cardCol}>{item.late}</Text>
            <Text style={styles.cardCol}>{item.absent}</Text>
          </View>
        )}
      />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#002F4B',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
  },
  in_container: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingLeft: 15,
  },
  tableHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  marginBottom: 10,
  alignItems: 'center',
  paddingHorizontal: 18,
},

studyHeader: {
  width: '25%',
},
legendBadge: {
  width: '20%',
  alignItems: 'center',
  paddingVertical: 6,
  borderRadius: 20,
},

legendText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 13,
},

cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 15,
  paddingVertical: 12,
  paddingHorizontal: 18,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#ccc',
},


cardCol: {
  width: '25%',
  textAlign: 'center',
  fontSize: 15,
  fontWeight: '500',
},
  /* 사이드 패널 */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',                 // 세로 = 화면 전체
    width: screenWidth * (2 / 3),   // 가로 = 화면의 2/3
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: -2, height: 6 },
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  panelHeader: {
    backgroundColor: '#002F4B',
    height: 60,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  menuItem: { paddingVertical: 14, paddingHorizontal: 16 },
  menuItemText: { fontSize: 16, color: '#222' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c9c9c9',
    marginHorizontal: 16,
  },
  
});

export default AttendanceScreen;