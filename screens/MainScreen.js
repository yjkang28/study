import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

LocaleConfig.locales['ko'] = {
  monthNames: [
    '01월',
    '02월',
    '03월',
    '04월',
    '05월',
    '06월',
    '07월',
    '08월',
    '09월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';


export default function MainScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today); //오늘 날짜로 초기 설정
  const [studyGroups, setStudyGroups] = useState([]); //스터디 목록 가져옴
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudyGroups = async () => {
      try {
        const response = await axios.get('http://192.168.219.115:5000/api/studies'); // IP 주소를 수정해야 함
        setStudyGroups(response.data);
      } catch (error) {
        console.error('스터디 목록을 불러오는 데 실패했습니다.', error.message);
      }
    };
    fetchStudyGroups();
  }, []);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };


  
  return (
    <View style={styles.container}>
      {/* 상단 유저 영역 */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color="white" />
        {/* profile screen으로 넘어가게함 */}
        <TouchableOpacity onPress={() => navigation.navigate('내 프로필')}>
        <Text style={styles.username}>user_name</Text>
        </TouchableOpacity>  
      </View>

      {/* 달력 */}

      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: '#00adf5',
          },
        }}
        style={styles.calendar}
        theme={{
          selectedDayBackgroundColor: '#00adf5',
          todayTextColor: '#00adf5',
        }}
        monthFormat={'yyyy년 M월'}
      />

      {/* 일정 안내 */}
      <View style={styles.scheduleBox}>
        <Ionicons name="calendar-outline" size={30} color="#777" />
        <Text style={styles.scheduleText}>일정이 없습니다</Text>
      </View>

      {/* 스터디 그룹 목록 */}
      <Text style={styles.sectionTitle}>내 스터디 그룹 목록</Text>
      <View style={styles.studyList}>
        <Text style={styles.emptyText}>가입중인 스터디가 없습니다</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    paddingTop: 35,
  },
  header: {
    height: 50,
    backgroundColor: '#0a2a44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  username: {
    color: 'white',
    fontSize: 16,
  },
  calendar: {
    marginTop: 10,
    borderRadius: 10,
    marginHorizontal: 16,
  },
  scheduleBox: {
    height: 80,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleText: {
    marginTop: 5,
    color: '#777',
  },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  studyList: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
  },

});

