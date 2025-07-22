import React, { useState,useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const mockSchedule = [
  { day: '화', startHour: 16, endHour: 20, type: '스터디',color: 'rgba(179, 217, 255, 0.5)' },
  { day: '월', startHour: 10, endHour: 11, type: '수업', color: 'rgba(255, 204, 204, 0.5)' },
  // 필요 시 더 추가
];

const MainScreen = () => {
  const navigation = useNavigation();
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const days = ['월', '화', '수', '목', '금', '토', '일'];

  const [weekRange, setWeekRange] = useState('');

  useEffect(() => {
    const today = new Date();

    // getDay()는 0(일) ~ 6(토) -> 월요일이 1, 일요일이 0
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const sundayOffset = day === 0 ? 0 : 7 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const sunday = new Date(today);
    sunday.setDate(today.getDate() + sundayOffset);

    const format = (date) => {
       const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${mm}/${dd}`;
    };

    setWeekRange(`${format(monday)} ~ ${format(sunday)}`);
  }, []);

  const renderSchedule = (day, hour) => {
    const schedule = mockSchedule.find(
      s => s.day === day && hour >= s.startHour && hour < s.endHour
    );

    if (!schedule) return null;

    return (
      <TouchableOpacity
        style={[styles.scheduleBlock, { backgroundColor: schedule.color }]}
        onPress={() => setSelectedSchedule(schedule)}
      >
        {hour === schedule.startHour && (
          <Text style={styles.scheduleText}>
            {schedule.type === '스터디' ? '## 스터디' : schedule.type}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        
         <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <TouchableOpacity onPress={() => navigation.navigate('알림내역')}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => navigation.navigate('내 프로필')} style={{ marginLeft: 16 }}>
            <Ionicons name="person-circle-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </View>
        
        <View style={styles.mySchedule}>
           <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.myScheduleText}>{weekRange}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('시간표 만들기')}>
                <Ionicons name="pencil-outline" size={24} color="black" />
            </TouchableOpacity>
            </View>
        
        <View style={{ paddingHorizontal: 5,marginRight:5, }}>
        {/* 요일 헤더 */}
        <View style={styles.row}>
        <Text style={styles.timeColumn} />  {/* 시간 비워두기 */}
        {days.map(day => (
            <Text key={day} style={styles.dayHeader}>{day}</Text>
        ))}
        </View>

        {/* 시간표 그리드 */}
        {[...Array(15)].map((_, i) => {
        const hour = i + 8;
        return (
            <View key={hour} style={styles.row}>
            <Text style={styles.timeColumn}>{hour}</Text>
            {days.map(day => (
                <View key={day} style={styles.dayColumn}>
                {renderSchedule(day, hour)}
                </View>
            ))}
            </View>
        );
        })}
        </View>

      {/* 일정 클릭 시 모달 */}
      <Modal visible={!!selectedSchedule} transparent animationType="slide">
        <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPressOut={() => setSelectedSchedule(null)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              {selectedSchedule?.type === '스터디'
                ? '스터디 일정입니다.'
                : '일반 일정입니다.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedSchedule?.type === '스터디') {
                  navigation.navigate('알림');
                }
                setSelectedSchedule(null);
              }}
            >
              <Text style={styles.modalLink}>
                {selectedSchedule?.type === '스터디' ? '## 스터디 페이지 이동' : '닫기'}
              </Text>
            </TouchableOpacity>
          </View>
          </TouchableOpacity>
      </Modal>

      {/* 하단 네비게이션은 앱 구조에 따라 Tab.Navigator로 따로 구현하세요 */}
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff',marginTop: 30, },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#002F4B',
    padding: 14,
    alignItems: 'center',
  },
  mySchedule: {
    flexDirection:'row',
    allignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingVertical:5,
    paddingLeft: 10,
    paddingRight:10,

  },
  myScheduleText: {
    fontWeight:'bold',
    fontSize: 15,

  },

  dayHeader: {
  flex: 1,
  textAlign: 'center',
  fontWeight: 600,
  color: '#555',
  paddingVertical: 6,
  backgroundColor: '#ffffff', // 헤더 배경
  marginTop:5,
  marginBottom: 5,
},
  timetable: { flex: 1, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  timeColumn: { width: 40, textAlign: 'center',color: '#555',fontSize: 10, },
  dayColumn: { 
    flex: 1,
    borderWidth: 0.5, 
    borderColor: '#ccc', 
    height: 40,
    borderRadius: 5,
 },
  scheduleBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRadius: 5,
  },
  scheduleText: { fontSize: 12, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalBox: {
    margin: 32,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: { fontSize: 16, marginBottom: 10 },
  modalLink: { color: '#0066cc', fontWeight: 'bold' },
});