// App.js
import React, { useRef,useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MainScreen from './screens/MainScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import SetProfile from './screens/SetProfile';
import SettingScreen from './screens/SettingScreen';
import SearchScreen from './screens/SearchScreen';
import SearchCategories from './screens/SearchCategories';
import NotificationScreen from './screens/NotificationScreen';
import LoginScreen from './screens/LoginScreen';
import StudyDetailScreen from './screens/StudyDetailScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs({ navigation }) {
   const [currentRoute, setCurrentRoute] = useState('홈');

  return (
    <>
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === '홈' ? 'home' : route.name === '검색' ? 'search' : 'location-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="검색" 
      component={SearchScreen}  
      options={{ headerShown: false }}
      listeners={({ navigation }) => ({
        tabPress: () => setCurrentRoute('검색')
      })} />
      <Tab.Screen name="홈" 
      component={MainScreen} 
       options={{ headerShown: false }}
       listeners={({ navigation }) => ({
        tabPress: () => setCurrentRoute('홈')
      })} />
      <Tab.Screen name="장소 추천"
       component={MainScreen}  
       options={{ headerShown: false }} 
       listeners={({ navigation }) => ({
        tabPress: () => setCurrentRoute('장소 추천')
      })}/>
    </Tab.Navigator>

    
      </>
  );
}

export default function App() {
 const navigationRef = React.useRef();
 const [currentRouteName, setCurrentRouteName] = useState('');

  return (
    <NavigationContainer ref={navigationRef}
     onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          setCurrentRouteName(currentRoute.name);
        }
      }}>
      <Root currentRouteName={currentRouteName} navigationRef={navigationRef} />
    </NavigationContainer>
  );
}



function Root({  navigationRef, currentRouteName }) {
  return (
    <React.Fragment>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="회원가입" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="비밀번호 찾기" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="검색" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="카테고리 검색" component={SearchCategories} options={{ headerShown: false }} />
         <Stack.Screen name="채팅목록" component={ChatListScreen} options={{
          headerStyle: { backgroundColor: '#001f3f' },
          headerTitleStyle: { fontWeight: 'bold', color: '#FFFFFF' },
          headerTintColor: '#FFFFFF',
        }} />
         <Stack.Screen name="채팅화면" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="내 프로필" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="프로필 관리" component={SetProfile} options={{ headerShown: false }} />
        <Stack.Screen name="설정" component={SettingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="알림내역" component={NotificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="스터디상세" component={StudyDetailScreen} options={{ headerShown: false }} />
      </Stack.Navigator>

      {/* ✅ 모든 화면에서 항상 보이는 플로팅 버튼 */}
      { currentRouteName !== 'Login' && currentRouteName !== '채팅화면' && 
      currentRouteName !== '채팅목록' && currentRouteName !== '회원가입' &&
      currentRouteName !== '비밀번호 찾기' &&
      currentRouteName !== '프로필 관리' &&  currentRouteName !== '카테고리 검색' &&(
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigationRef.current?.navigate('채팅목록')}
      >
        <Ionicons name="chatbubbles-outline" size={28} color="white" />
      </TouchableOpacity>
      )}
    </React.Fragment>
  );
}


const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: '5%',
    bottom: '13%', 
    backgroundColor: '#00aaff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,

  },
});