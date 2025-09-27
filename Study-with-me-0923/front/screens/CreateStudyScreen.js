import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const CreateStudyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [studyName, setStudyName] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState('');

  // ✅ route.params 로 돌아올 때 값 복원
  useEffect(() => {
    if (route.params?.selectedCategories) setSelectedCategories(route.params.selectedCategories);
    if (route.params?.studyName !== undefined) setStudyName(route.params.studyName);
    if (route.params?.maxMembers !== undefined) setMaxMembers(route.params.maxMembers);
    if (route.params?.description !== undefined) setDescription(route.params.description);
  }, [route.params]);

  const checkDuplicateName = () => {
    if (!studyName.trim()) {
      Alert.alert('스터디 이름을 입력해주세요');
    } else {
      Alert.alert('사용 가능한 이름입니다'); // 서버 중복확인 API 추가 가능
    }
  };

  const removeCategory = (category) => {
    setSelectedCategories((prev) => prev.filter((cat) => cat !== category));
  };

  const handleCreate = async () => {
    if (!studyName || !description) {
      Alert.alert('필수 항목을 모두 입력해주세요');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');

      // ✅ category / subCategory 추출
      const mainCategories = ['취업', '자격증', '대회', '영어', '출석'];
      const category = selectedCategories.find(c => mainCategories.includes(c)) || '';
      const subCategory = selectedCategories.find(
        c => !mainCategories.includes(c) &&
             c !== '자유' && c !== '정규' &&
             c !== '남' && c !== '여' && c !== '무관' &&
             !['월','화','수','목','금','토','일'].includes(c)
      ) || '';
      const duration = selectedCategories.includes('정규') ? '정규' : '자유';
      const days = selectedCategories.filter(c => ['월','화','수','목','금','토','일'].includes(c));
      const gender_rule = selectedCategories.find(c => ['남','여','무관'].includes(c)) || '무관';

      const res = await api.post('/studies/create', {
        title: studyName,
        description,
        category,
        subCategory,
        gender_rule,
        duration,
        days,
        capacity: maxMembers === '00' ? 0 : parseInt(maxMembers) || 0,
        host: userId,
      });

      Alert.alert('✅ 스터디가 생성되었습니다!');

      // ✅ 생성된 채팅방 자동 진입
      if (res.data.chatRoomId) {
        navigation.navigate('ChatRoomScreen', {
          roomId: res.data.chatRoomId,
          studyId: res.data.study._id,
        });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('❌ 스터디 생성 실패:', err.message);
      Alert.alert('스터디 생성 실패', err.message);
    }
  };

  const renderCategoryChips = () => {
    return selectedCategories.map((cat) => (
      <View key={cat} style={styles.categoryChip}>
        <Text>{cat}</Text>
        <TouchableOpacity onPress={() => removeCategory(cat)}>
          <Text style={{ color: 'red', marginLeft: 4 }}>✕</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <View style={styles.screen}>
    <ScrollView
      style={styles.scroll} 
    contentContainerStyle={styles.container}>
      <Text style={styles.label}>스터디 이름</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputFlex}
          placeholder="이름을 입력하세요 (최대 10자)"
          maxLength={10}
          value={studyName}
          onChangeText={setStudyName}
        />
        <TouchableOpacity style={styles.checkBtn} onPress={checkDuplicateName}>
          <Text style={styles.checkBtnText}>중복 확인</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>스터디 최대인원 설정</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="00을 입력하면 무제한으로 설정됩니다"
          keyboardType="numeric"
          value={maxMembers}
          onChangeText={setMaxMembers}
        />
        <Text style={{ marginLeft: 6, alignSelf: 'center' }}>명</Text>
      </View>

      <Text style={styles.label}>스터디 카테고리 설정</Text>
       <View style={styles.categoryChipContainer}>
        {renderCategoryChips()}
      </View>

      {/* 카테고리 추가 버튼 (아래쪽) */}
      <View style={styles.categoryAddContainer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate('카테고리선택', {
              selectedCategories,
              studyName,
              maxMembers,
              description,
            })
          }>
          <Text style={styles.addBtnText}>+ 카테고리 추가</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>스터디 소개글</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="내용을 입력하세요. (최대 500자)"
        multiline
        maxLength={500}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
        <Text style={{ color: 'white',fontWeight: '600', }}>스터디 개설하기</Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1, backgroundColor: '#ffffff' },
  container: {
    flexGrow: 1,                 // 🔑 내용이 적어도 화면 높이만큼 확장
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#ffffff',  // (선택) 여기 넣어도 OK
  },
  label: { marginTop: 20, marginBottom: 15,fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 15, paddingVertical:10,paddingLeft: 10},
  inputFlex: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 15, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkBtn: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#003366',
    borderRadius: 15
  },
  checkBtnText: { color: 'white' },
  submitBtn: {
    backgroundColor: '#003366',
    padding: 16,
    alignItems: 'center',
    borderRadius: 30,
    marginTop: 30,

  },
    categoryChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,     // 칩과 버튼 사이 여백
    justifyContent: 'center',
  },
  categoryAddContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(23, 161, 250, 0.3)' ,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    margin: 4
  },
  addBtn: {
  paddingHorizontal: 14,   // 좌우 여백 조금 넉넉하게
  paddingVertical: 6,      // 위아래 얇게
  borderRadius: 16,        // 캡슐 모양
  borderWidth: 1,          // ✅ 테두리 두께
  borderColor: '#888',     // ✅ 테두리 색 (회색)
  backgroundColor: 'transparent', // ✅ 배경 투명
  margin: 4,
},
addBtnText: {
  fontSize: 13,
  fontWeight: 'bold',
  color: '#444',   // 테두리랑 잘 어울리는 색
}
});

export default CreateStudyScreen;
