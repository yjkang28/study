import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const attendanceData = [
  {
    studyName: '**스터디',
    present: 25,
    late: 1,
    absent: 2,
  },
  {
    studyName: '@@스터디',
    present: 14,
    late: 0,
    absent: 0,
  },
];

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const chartData = {
    labels: attendanceData.map(d => d.studyName),
    datasets: [
      {
        data: attendanceData.map(d => {
          const total = d.present + d.late + d.absent;
          return total === 0 ? 0 : Math.round((d.present / total) * 100);
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>출석률</Text>
        <TouchableOpacity onPress={() => navigation.navigate('출석률 랭킹')}>
          <Ionicons name="stats-chart-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.in_container}>
      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 204, 0, ${opacity})`, // yellow-ish
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        style={styles.chart}
        showBarTops={true}
      />

     <View style={styles.tableHeader}>
        <Text style={styles.studyHeader}></Text>
        <View style={[styles.legendBadge, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.legendText}>출석</Text>
        </View>
        <View style={[styles.legendBadge, { backgroundColor: '#FFC107' }]}>
          <Text style={styles.legendText}>지각</Text>
        </View>
        <View style={[styles.legendBadge, { backgroundColor: '#F44336' }]}>
          <Text style={styles.legendText}>결석</Text>
        </View>
      </View>

      <FlatList
        data={attendanceData}
        keyExtractor={(item) => item.studyName}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <Text style={styles.cardCol}>{item.studyName}</Text>
            <Text style={styles.cardCol}>{item.present}</Text>
            <Text style={styles.cardCol}>{item.late}</Text>
            <Text style={styles.cardCol}>{item.absent}</Text>
          </View>
        )}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#002F4B',
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
  },
  in_container: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingLeft: 15,
  },
  tableHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
  marginBottom: 10,
  alignItems: 'center',
  paddingHorizontal: 18,
},

studyHeader: {
  width: '25%',
},
legendBadge: {
  width: '20%',
  alignItems: 'center',
  paddingVertical: 6,
  borderRadius: 20,
},

legendText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 13,
},

cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 15,
  paddingVertical: 12,
  paddingHorizontal: 18,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#ccc',
},


cardCol: {
  width: '25%',
  textAlign: 'center',
  fontSize: 15,
  fontWeight: '500',
},
  
});

export default AttendanceScreen;