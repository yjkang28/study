import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, Divider, Provider } from 'react-native-paper';
import axios from 'axios';



const ProfileScreen = () => {
    const navigation = useNavigation();
    const [visible, setVisible] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const userId = 1; /*사용자 id 설정 (임시로 1로 설정), 실제로는 받아와야함*/

    
    useEffect(() => {
        const fetchProfile = async () => {
          try {
            const response = await axios.get('http://192.168.219.115:5000/api/studies'); // IP 주소를 수정해야 함
            console.log(response.data); // 데이터 확인용
            setProfileData(response.data);// profileData 상태에 백엔드 데이터 받아옴
          } catch (error) {
            console.error('프로필 정보를 불러오는 데 실패했습니다.', error.message);
          }
        };
        fetchProfile();
      }, []);

    return (
      <Provider>
        <View style={styles.container}>
           {/* 상단 네비게이션 바 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity style={styles.menuIcon} onPress={openMenu}>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                navigation.navigate('프로필 관리');
              }}
              title="프로필 관리"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                closeMenu();
                navigation.navigate('설정');
              }}
              title="설정"
            />
          </Menu>
        </View>
          <View style={styles.card}>
            <View style={styles.profileHeader}>
              <Image source={{ uri:  'https://via.placeholder.com/100' }} style={styles.profileImage} />
              <View>
                <Text style={styles.userName}>user_name</Text>
                <Text style={styles.userInfo}>정보융합대학 4학년 </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>소개글</Text>
            <Text style={styles.introText}>
              소개글이 없습니다.
            </Text>

            <Text style={styles.sectionTitle}>지난달 스터디 출석률</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={{ color: '#888' }}>그래프 자리 (구현 예정)</Text>
            </View>
          </View>
        </View>
      </Provider>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2D3D',
    padding: 10,
    marginTop: 32 ,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#1A2D3D',
      paddingHorizontal: 10,
      height: 40,
    },
    backButton: {
      marginLeft: 5,
    },
    menuIcon: {
      marginRight: -5,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginTop: 10,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        fontSize: 14,
        color: '#777',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 30,
    },
    introText: {
        fontSize: 14,
        color: '#555',
        marginVertical: 10,
        marginTop: 10,
    },
    chartPlaceholder: {
        width: '100%',
        height: 300,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        borderRadius: 10,
    },
});
