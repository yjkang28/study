import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';


const SCREEN_PADDING = 10;     // container의 paddingHorizontal과 동일
const CHIP_COLUMNS = 3;        // 한 줄에 3개(원하면 2/4로 바꿔도 OK)
const CHIP_GAP = 10;           // 칩 사이 간격
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHIP_WIDTH =
  Math.floor((SCREEN_WIDTH - SCREEN_PADDING * 2 - CHIP_GAP * (CHIP_COLUMNS - 1)) / CHIP_COLUMNS);


const detailedCategories = {
  취업: ['기획/전략', '회계/사무', '마케팅', 'IT', '디자인'],
  자격증: ['한국사', '토익', '컴활', '운전면허'],
  대회: ['공모전', '해커톤', '아이디어', '창업'],
  영어: ['토익', '토플', '스피킹', '회화'],
  출석: ['출석관리', '출결인증']
};

const days = ['월', '화', '수', '목', '금', '토', '일'];

const CategorySelectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [studyType, setStudyType] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [gender, setGender] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [selectedDetails, setSelectedDetails] = useState([]);

  // ✅ 넘어온 selectedCategories 로 초기화
  useEffect(() => {
    const incoming = route.params?.selectedCategories || [];
    const matchedStudyType = ['자유', '정규'].find(v => incoming.includes(v));
    const matchedGender = ['남', '여', '무관'].find(v => incoming.includes(v));
    const matchedMainCategory = Object.keys(detailedCategories).find(v => incoming.includes(v));

    setStudyType(matchedStudyType || '');
    setGender(matchedGender || '');
    setMainCategory(matchedMainCategory || '');
    setSelectedDays(incoming.filter(d => days.includes(d)));
    setSelectedDetails(
      matchedMainCategory
        ? incoming.filter(v => detailedCategories[matchedMainCategory].includes(v))
        : []
    );
  }, [route.params?.selectedCategories]);

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleDetail = (item) => {
    setSelectedDetails(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleSingle = (state, setter, value) => {
    setter(state === value ? '' : value);
  };

  const handleConfirm = () => {
    const result = [
      ...(studyType ? [studyType] : []),
      ...selectedDays,
      ...(gender ? [gender] : []),
      ...(mainCategory ? [mainCategory] : []),
      ...selectedDetails
    ];
    navigation.navigate('스터디개설', {
      selectedCategories: result,
      studyName: route.params?.studyName || '',
      maxMembers: route.params?.maxMembers || '',
      description: route.params?.description || '',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>스터디 종류</Text>
      <View style={styles.rowWrap}>
        {['자유', '정규'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, studyType === type && styles.selectedButton]}
            onPress={() => toggleSingle(studyType, setStudyType, type)}>
            <Text style={[styles.buttonText, studyType === type && styles.selectedButtonText]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {studyType === '정규' && (
        <>
          <Text style={styles.title}>요일 선택</Text>
          <View style={styles.rowWrap}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.button, selectedDays.includes(day) && styles.selectedButton]}
                onPress={() => toggleDay(day)}>
                <Text style={[styles.buttonText, selectedDays.includes(day) && styles.selectedButtonText]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.title}>성별</Text>
      <View style={styles.rowWrap}>
        {['남', '여', '무관'].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.button, gender === g && styles.selectedButton]}
            onPress={() => toggleSingle(gender, setGender, g)}>
            <Text style={[styles.buttonText, gender === g && styles.selectedButtonText]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>스터디 분야</Text>
      <View style={styles.rowWrap}>
        {Object.keys(detailedCategories).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.button, mainCategory === cat && styles.selectedButton]}
            onPress={() => {
              setMainCategory(mainCategory === cat ? '' : cat);
              setSelectedDetails([]);
            }}>
            <Text style={[styles.buttonText, mainCategory === cat && styles.selectedButtonText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mainCategory !== '' && (
        <>
          <Text style={styles.title}>스터디 분야(상세)</Text>
          <View style={styles.rowWrap}>
            {detailedCategories[mainCategory].map((detail) => (
              <TouchableOpacity
                key={detail}
                style={[styles.button, selectedDetails.includes(detail) && styles.selectedButton]}
                onPress={() => toggleDetail(detail)}>
                <Text style={[styles.buttonText, selectedDetails.includes(detail) && styles.selectedButtonText]}>{detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>확인</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: SCREEN_PADDING },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 12, paddingLeft: 8 },

  // 줄바꿈 컨테이너: 칩 간격 균일
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,                // RN 0.71+ 지원. 만약 미지원이면 칩 margin으로 대체
    marginBottom: 16,
  },

  typeButton: {
    width: CHIP_WIDTH + 55,            // ✅ 고정 가로폭
    height: 44,                   // ✅ 고정 높이
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    
  },
  // 칩(버튼) 균일 크기
  button: {
    width: CHIP_WIDTH,            // ✅ 고정 가로폭
    height: 44,                   // ✅ 고정 높이
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    
  },
  selectedButton: { backgroundColor: '#17A1FA' },

  buttonText: { fontSize: 16, color: '#333' },
  selectedButtonText: { color: '#FFFFFF' },

  confirmButton: {
    alignSelf: 'center', paddingVertical: 13, paddingHorizontal: 70,
    borderRadius: 30, marginTop: 50,marginBottom:40, backgroundColor: '#003366',
  },
  confirmText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
});

export default CategorySelectScreen;
