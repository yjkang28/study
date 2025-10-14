//screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle 상태
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert("앱 종료", "앱을 종료하시겠습니까?", [
          { text: "취소", onPress: () => null, style: "cancel" },
          { text: "종료", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      });
      return () => backHandler.remove();
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력하세요.');
      return;
    }
    try {
      const response = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem('userId', response.data.userId);
      await AsyncStorage.setItem('userName', response.data.username);
      Alert.alert('로그인 성공', `${response.data.username}님 환영합니다.`);
      navigation.replace('Tabs');
    } catch (err) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="학교 이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('회원가입')}>
          <Text style={styles.linkText}>회원가입</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('비밀번호 찾기')}>
          <Text style={styles.linkText}>비밀번호 찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', paddingHorizontal: 40, backgroundColor: '#fff'},
  title: {fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40},
  input: {borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 20, fontSize: 15, paddingVertical: 8},
  passwordContainer: {flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 20},
  passwordInput: {flex: 1, fontSize: 15, paddingVertical: 8},
  loginButton: {backgroundColor: '#001f3f', height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 10},
  loginButtonText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  footerLinks: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 25},
  linkText: {color: 'blue', fontSize: 14}
});