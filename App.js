import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MainScreen from './screens/MainScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import SetProfile from './screens/SetProfile';
import SettingScreen from './screens/SettingScreen';
import SearchScreen from './screens/SearchScreen';
import SearchCategories from './screens/SearchCategories';



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
      component={SearchCategories}  
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

    {/* 조건부 렌더링: 홈 화면에서만 플로팅 버튼 보이기 */}
    {currentRoute === '홈' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('채팅')}
        >
          <Ionicons name="chatbubbles-outline" size={28} color="white" />
        </TouchableOpacity>
      )}
      </>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false}} />
        
        <Stack.Screen name="카테고리 검색" component={SearchCategories}  options={{ headerShown: false }}/>
        <Stack.Screen name="채팅" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="내 프로필" component={ProfileScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="프로필 관리" component={SetProfile}  options={{ headerShown: false }}/>
        <Stack.Screen name="설정" component={SettingScreen}  options={{ headerShown: false }}/>

      </Stack.Navigator>
    </NavigationContainer>
  );
}


const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 10,
    bottom: 110, // 탭바 위에 떠 있도록 조정
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