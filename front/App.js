import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// ✅ 장소추천 화면 (카카오맵 WebView 버전)
import MapScreen from './screens/MapScreen';

// 기존 스크린
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';
import SearchCategories from './screens/SearchCategories';
import SearchScreen from './screens/SearchScreen';
import ChatScreen from './screens/ChatScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ProfileScreen from './screens/ProfileScreen';
import SetProfile from './screens/SetProfile';
import SettingScreen from './screens/SettingScreen';
import NotificationScreen from './screens/NotificationScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import CategorySelectScreen from './screens/CategorySelectScreen';
import CreateStudyScreen from './screens/CreateStudyScreen';
import StudyIntroScreen from './screens/StudyIntroScreen';
import ReviewScreen from './screens/ReviewScreen';
import CommentScreen from './screens/CommentScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import MonthlyRankingScreen from './screens/MonthlyRankingScreen';
import UserAttendanceScreen from './screens/UserAttendanceScreen';
import StudyAttendanceScreen from './screens/StudyAttendanceScreen';
import AttendanceCheckScreen from './screens/AttendanceCheckScreen';
import AttendanceDetailScreen from './screens/AttendanceDetailScreen';
import Studyroommain from './screens/Studyroommain';
import Board from './screens/Board';
import BoardWrite from './screens/BoardWrite';
import FileShare from './screens/fileshare';
import ScheduleAdd from './screens/ScheduleAdd';
import ApplicationManageScreen from './screens/ApplicationManageScreen';
import PlaceReviewScreen from './screens/PlaceReviewScreen';
import PlaceEditRequestScreen from './screens/PlaceEditRequestScreen';
import BoardDetail from './screens/BoardDetail';
import StudyManagementScreen from './screens/StudyManagementScreen';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const SearchStackNav = createNativeStackNavigator();

/** =========================
 *  🔎 Search 전용 스택
 *  - 탭 진입 시 SearchCategories가 먼저 뜸
 *  - 결과는 같은 스택의 SearchScreen으로 이동
 *  ========================= */
function SearchStack() {
  return (
    <SearchStackNav.Navigator
      initialRouteName="SearchCategories"
      screenOptions={{ headerShown: false }}
    >
      <SearchStackNav.Screen
        name="SearchCategories"
        component={SearchCategories}
      />
      <SearchStackNav.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: true, title: '검색 결과' }} 
      />
    </SearchStackNav.Navigator>
  );
}

/** =========================
 *  🧭 하단 탭
 *  ========================= */
function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="홈"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === '홈') iconName = 'home';
          else if (route.name === '검색') iconName = 'search';
          else if (route.name === '출석률') iconName = 'calendar';
          else iconName = 'location';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="출석률"
        component={AttendanceScreen}
        options={{ tabBarLabel: '출석률' }}
      />

      {/* ✅ 여기서 '검색' 탭은 SearchStack(전용 스택)을 연결 */}
      <Tab.Screen
        name="검색"
        component={SearchStack}
        options={{ tabBarLabel: '검색'}}   // ← 라벨 명시해서 항상 보이게
      />

      <Tab.Screen
        name="홈"
        component={MainScreen}
        options={{ tabBarLabel: '홈' }}
      />

      <Tab.Screen
        name="장소추천"
        component={MapScreen}
        options={{ tabBarLabel: '장소추천' }}
      />
    </Tab.Navigator>
  );
}

/** =========================
 *  🌳 루트 스택
 *  ========================= */
export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Login">
        {/* 로그인 / 탭 */}
        <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />

        {/* 채팅 */}
        <RootStack.Screen name="채팅목록" component={ChatRoomScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="채팅방" component={ChatScreen} options={{ headerShown: true, title: '채팅방' }} />

        {/* 회원/프로필 */}
        <RootStack.Screen name="회원가입" component={SignUpScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="비밀번호 찾기" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="내 프로필" component={ProfileScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="프로필 관리" component={SetProfile} options={{ headerShown: false }} />
        <RootStack.Screen name="설정" component={SettingScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="알림내역" component={NotificationScreen} options={{ headerShown: false }} />

        {/* 스터디 */}
        <RootStack.Screen name="스터디상세" component={Studyroommain} options={{ headerShown: false }} />
        <RootStack.Screen name="카테고리선택" component={CategorySelectScreen} options={{ headerShown: true, title: '카테고리 선택' }} />
        <RootStack.Screen name="스터디개설" component={CreateStudyScreen} options={{ headerShown: true, title: '스터디 개설' }} />
        <RootStack.Screen name="BoardDetail" component={BoardDetail} options={{ headerShown: true, title: '게시글 상세' }} />

        {/* 🔁 (중요) 아래 두 화면은 SearchStack으로 이동했으니
               루트에서 등록하지 않는 것을 권장합니다.
               - '카테고리 검색' (SearchCategories)
               - 'SearchScreen' (검색 결과)
           필요하다면 이름 충돌 없게 별명으로 따로 등록하세요. */}

        <RootStack.Screen name="스터디소개" component={StudyIntroScreen} options={{ headerShown: true, title: '스터디 소개' }} />
        <RootStack.Screen name="ReviewScreen" component={ReviewScreen} options={{ headerShown: true, title: '리뷰' }} />
        <RootStack.Screen name="CommentScreen" component={CommentScreen} options={{ headerShown: true, title: '댓글' }} />
        <RootStack.Screen name="ApplicationManageScreen" component={ApplicationManageScreen} options={{ headerShown: true, title: '가입 신청 관리' }} />
        <RootStack.Screen name="StudyManagementScreen" component={StudyManagementScreen} options={{ headerShown: false }} />

        {/* 출석 */}
        <RootStack.Screen name="MonthlyRanking" component={MonthlyRankingScreen} options={{ headerShown: true, title: '월간 랭킹' }} />
        <RootStack.Screen name="UserAttendance" component={UserAttendanceScreen} options={{ headerShown: true, title: '내 출석 기록' }} />
        <RootStack.Screen name="StudyAttendance" component={StudyAttendanceScreen} options={{ headerShown: true, title: '스터디 출석 현황' }} />
        <RootStack.Screen name="AttendanceCheck" component={AttendanceCheckScreen} options={{ headerShown: true, title: '출석 체크' }} />
        <RootStack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ headerShown: true, title: '출석 상세' }} />

        {/* 기타 */}
        <RootStack.Screen name="Board" component={Board} options={{ headerShown: false }} />
        <RootStack.Screen name="BoardWrite" component={BoardWrite} options={{ headerShown: false }} />
        <RootStack.Screen name="FileShare" component={FileShare} options={{ headerShown: false }} />
        <RootStack.Screen name="ScheduleAdd" component={ScheduleAdd} options={{ headerShown: false }} />
        <RootStack.Screen name="Studyroommain" component={Studyroommain} options={{ headerShown: false }} />
        <RootStack.Screen name="PlaceReviewScreen" component={PlaceReviewScreen} options={{ headerShown: true, title: '리뷰' }} />
        <RootStack.Screen name="PlaceEditRequestScreen" component={PlaceEditRequestScreen} options={{ headerShown: true, title: '정보 수정' }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}