// screens/MainScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // ✅ useFocusEffect 추가
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

export default function MainScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [studyGroups, setStudyGroups] = useState([]);
  const [userName, setUserName] = useState('');
  const navigation = useNavigation();

  // ✅ 뒤로가기 버튼 핸들링 (앱 종료 Alert) - useFocusEffect를 사용하여 MainScreen에만 적용
  useFocusEffect(
  React.useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
        { text: "취소", onPress: () => null, style: "cancel" },
        { text: "종료", onPress: () => BackHandler.exitApp() }
      ]);
      return true;
    });

    // ✅ 최신 방식 : backHandler.remove()
    return () => backHandler.remove();
  }, [])
);

  useEffect(() => {
    const loadData = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        const userId = await AsyncStorage.getItem('userId');
        if (name) setUserName(name);

        if (userId) {
          const response = await api.get(`/main/${userId}`);
          setStudyGroups(response.data.studies);
        }
      } catch (error) {
        console.error('스터디 목록을 불러오는 데 실패했습니다.', error.message);
      }
    };
    loadData();
  }, []);

  const handleDayPress = (day) => setSelectedDate(day.dateString);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color="white" 
          onPress={() => navigation.navigate('알림내역')} // ✅ 알림 페이지로 이동 추가
        />
        <TouchableOpacity onPress={() => navigation.navigate('내 프로필')}>
          <Text style={styles.username}>{userName || 'user_name'}</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={handleDayPress}
        markedDates={{ [selectedDate]: { selected: true, selectedColor: '#00adf5' } }}
        style={styles.calendar}
        theme={{ selectedDayBackgroundColor: '#00adf5', todayTextColor: '#00adf5' }}
        monthFormat={'yyyy년 M월'}
      />

      <View style={styles.scheduleBox}>
        <Ionicons name="calendar-outline" size={30} color="#777" />
        <Text style={styles.scheduleText}>일정이 없습니다</Text>
      </View>

      <Text style={styles.sectionTitle}>내 스터디 그룹 목록</Text>
      <ScrollView style={styles.studyList}>
        {studyGroups.length === 0 ? (
          <Text style={styles.emptyText}>가입중인 스터디가 없습니다</Text>
        ) : (
          studyGroups.map((study) => (
            <TouchableOpacity key={study._id} style={styles.studyItem}
              onPress={() => navigation.navigate('스터디상세', { study })} // ✅ 스터디상세 페이지로 이동 추가
            >
              <Text style={styles.studyTitle}>{study.title}</Text>
              <Text style={styles.studyDesc}>{study.description}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f7', paddingTop: 35 },
  header: { height: 50, backgroundColor: '#001f3f', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  username: { color: 'white', fontSize: 16 },
  calendar: { marginTop: 10, borderRadius: 10, marginHorizontal: 16 },
  scheduleBox: { height: 80, backgroundColor: 'white', margin: 16,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scheduleText: { marginTop: 5, color: '#777' },
  sectionTitle: { marginLeft: 16, marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  studyList: { flex: 1, paddingHorizontal: 16},
  studyItem: { backgroundColor: 'white', padding: 10, borderRadius: 8, marginBottom: 8 },
  studyTitle: { fontSize: 16, fontWeight: 'bold' },
  studyDesc: { fontSize: 13, color: '#555' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
  
});
