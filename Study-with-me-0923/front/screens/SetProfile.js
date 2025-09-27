// screens/SetProfile.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function SetProfile() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [gender, setGender] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [isLeave, setIsLeave] = useState(false);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');

  const [genderPublic, setGenderPublic] = useState(true);
  const [majorPublic, setMajorPublic] = useState(true);
  const [gradePublic, setGradePublic] = useState(true);

  const majors = ['경영대학','인문사회과학대학','수산과학대학','공학대학','글로벌자유전공학부','정보융합대학','자유전공학부','자연과학대학','환경해양대학','학부대학','미래융합학부'];
  const [openMajor, setOpenMajor] = useState(false);
  const [majorItems, setMajorItems] = useState(majors.map(item => ({ label: item, value: item })));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await api.get(`/profile/${userId}`);
        const data = response.data;
        setUsername(data.username);
        setMajor(data.major ?? '');
        setGrade(data.grade ? String(data.grade) : '');
        setGender(data.gender ?? '');
        setIsLeave(data.isLeave ?? false);
        setBio(data.bio ?? '');
        setProfileImage(data.profile_image ?? '');
        setGenderPublic(data.privacy?.gender ?? true);
        setMajorPublic(data.privacy?.major ?? true);
        setGradePublic(data.privacy?.grade ?? true);
      } catch (err) {
        console.error('프로필 불러오기 실패', err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleCheckUsername = async () => {
    if (username.length < 2 || username.length > 12) {
      Alert.alert('닉네임은 2~12자 이내여야 합니다.');
      return;
    }
    try {
      await api.post('/auth/check-username', { username });
      Alert.alert('사용 가능', '사용 가능한 닉네임입니다.');
      setUsernameChecked(true);
    } catch (error) {
      Alert.alert('중복', error.response?.data?.message || '서버 오류');
      setUsernameChecked(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log("이미지 선택 오류:", err);
    }
  };

  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await api.put(`/profile/${userId}`, {
        username,
        major,
        grade: Number(grade),
        gender,
        isLeave,
        bio,
        profile_image: profileImage,
        privacy: { gender: genderPublic, major: majorPublic, grade: gradePublic }
      });
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('실패', '프로필 수정 중 오류 발생');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>프로필 사진</Text>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.profileImage} />
        )}
        <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
          <Text style={styles.imageButtonText}>이미지 선택</Text>
        </TouchableOpacity>
        {profileImage ? (
          <TouchableOpacity style={styles.imageButton} onPress={() => setProfileImage('')}>
            <Text style={styles.imageButtonText}>이미지 삭제</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>닉네임</Text>
        <View style={styles.row}>
          <TextInput style={styles.inputHalf} placeholder="닉네임 (2~12자)" value={username} onChangeText={setUsername} />
          <TouchableOpacity style={styles.subButtonSmall} onPress={handleCheckUsername}>
            <Text style={styles.subButtonText}>중복 확인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>성별</Text>
          <View style={styles.switchRow}>
            <Text>공개</Text>
            <Switch value={genderPublic} onValueChange={setGenderPublic} />
          </View>
        </View>
        <View style={styles.radioRow}>
          <TouchableOpacity onPress={() => setGender('남')}><Text style={gender === '남' ? styles.radioSelected : styles.radio}>남</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setGender('여')}><Text style={gender === '여' ? styles.radioSelected : styles.radio}>여</Text></TouchableOpacity>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>학과</Text>
          <View style={styles.switchRow}>
            <Text>공개</Text>
            <Switch value={majorPublic} onValueChange={setMajorPublic} />
          </View>
        </View>
        <DropDownPicker open={openMajor} value={major} items={majorItems} setOpen={setOpenMajor} setValue={setMajor} setItems={setMajorItems} placeholder="학과 선택" listMode="SCROLLVIEW" style={styles.dropdown} dropDownContainerStyle={{ borderColor: '#ccc' }} />

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>학년</Text>
          <View style={styles.switchRow}>
            <Text>공개</Text>
            <Switch value={gradePublic} onValueChange={setGradePublic} />
          </View>
        </View>
        <View style={styles.radioRow}>
          {['1', '2', '3', '4'].map(year => (
            <TouchableOpacity key={year} onPress={() => setGrade(year)}>
              <Text style={grade === year ? styles.radioSelected : styles.radio}>{year}학년</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>휴학 여부</Text>
          <Switch value={isLeave} onValueChange={setIsLeave} />
        </View>

        <Text style={styles.sectionTitle}>소개글</Text>
        <TextInput style={styles.textArea} placeholder="내용을 입력하세요." value={bio} onChangeText={setBio} multiline />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingvertical:10,paddingHorizontal:20,backgroundColor:'#ffffff' },
  profileImage: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 10 },
  imageButton: { backgroundColor: '#ddd', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imageButtonText: { color: '#333', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15 },
  inputHalf: { borderWidth: 1, borderColor: '#ccc', borderRadius: 15, padding: 12, marginTop: 8, flex: 1 },
  subButtonSmall: { backgroundColor: '#002B5B', padding: 12, borderRadius: 15, alignItems: 'center', marginLeft: 8, marginTop: 8 },
  subButtonText: { color: '#fff'},
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  radioRow: {flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginVertical: 10, gap: 10},
  radio: {fontSize: 16, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: '#aaa', borderRadius: 15, marginHorizontal: 4, textAlign: 'center'},
  radioSelected: {fontSize: 16, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: '#002B5B', backgroundColor: '#002B5B', color: '#fff', 
    borderRadius: 15, marginHorizontal: 4, textAlign: 'center'},
  dropdown: { borderColor: '#ccc', borderRadius: 15, marginTop: 8 },
  textArea: { borderWidth: 1, borderColor: '#ccc', borderRadius: 15, padding: 12, backgroundColor: '#f9f9f9', fontSize: 16, height: 100, marginTop:10, },
  saveButton: { backgroundColor: '#001f3f', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 20, marginBottom:60, },   // 🔵 둥근 정도 완화
  saveButtonText: { color: 'white', fontSize: 16 }
});
