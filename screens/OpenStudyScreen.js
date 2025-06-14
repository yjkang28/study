import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


const OpenStudyScreen = () => {
  const navigation = useNavigation();
  const [studyName, setStudyName] = useState('');
  const [isAvailable, setIsAvailable] = useState(null); // null | true | false
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('');

  const handleDuplicateCheck = () => {
    // 예시: 이름이 '중복'이면 사용 불가
    setIsAvailable(studyName !== '중복');
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.label}>스터디 이름</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.nameInput}
          value={studyName}
          onChangeText={setStudyName}
          placeholder="이름을 입력하세요 (최대 10자)"
          maxLength={10}
        />
        <TouchableOpacity style={styles.checkButton} onPress={handleDuplicateCheck}>
          <Text style={styles.checkText}>중복 확인</Text>
        </TouchableOpacity>
      </View>

      {isAvailable === true && <Text style={styles.success}>사용 가능한 이름입니다.</Text>}
      {isAvailable === false && <Text style={styles.error}>사용 불가능한 이름입니다.</Text>}

      <Text style={styles.label}>스터디 최대인원 설정</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.maxInput}
          value={maxMembers}
          onChangeText={setMaxMembers}
          placeholder="00"
          keyboardType="numeric"
        />
        
          <Text style={styles.countText}>명</Text>
        
      </View>
      <Text style={styles.label}>스터디 분야 설정</Text>
      <View style={styles.categoryWrap}>
        {selectedCategories.map((cat, idx) => (
          <View key={idx} style={styles.categoryItem}>
            <Text style={styles.categoryText}>{cat}</Text>
            <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
              <Ionicons name="close-circle" size={18} color="red" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.addCategoryBtn}
        onPress={() => navigation.navigate('분야 선택', {
          selected: selectedCategories,
          onSelect: (newList) => setSelectedCategories(newList),
        })}
      >
        <Text style={styles.addCategoryText}>+ 카테고리 추가</Text>
      </TouchableOpacity>

      <Text style={styles.label}>스터디 소개글</Text>
      <TextInput
        style={styles.textarea}
        placeholder="내용을 입력하세요. (최대 500자)"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
      />

      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitText}>스터디 개설하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal:20, backgroundColor: '#ffffff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  nameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  maxInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#aaa',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
   checkButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#888',
  },
  checkText: { fontWeight: '600' },
  countText: { fontWeight: '600', marginRight: 50, },
  success: { color: 'green', marginTop: 5 },
  error: { color: 'red', marginTop: 5 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth:0.5,
    borderColor:'#00aaff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: { color: '#00aaff', fontWeight: '500' },
  addCategoryBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 100,
  },
  addCategoryText: { fontSize: 14, fontWeight: '500',color: '#555' },
  textarea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#002B5B',
    paddingVertical: 15,
    borderRadius: 35,
    marginTop: 45,
    alignItems: 'center',
  },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default OpenStudyScreen;