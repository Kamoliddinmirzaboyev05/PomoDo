import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import PlansScreen from './screens/PlansScreen';
import GoalsScreen from './screens/GoalsScreen';
import PomodoroScreen from './screens/PomodoroScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            height: 85,
            paddingBottom: 20,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: '#f8f8f8',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tab.Screen 
          name="Plans" 
          component={PlansScreen}
          options={{
            title: 'Rejalar',
            tabBarLabel: 'Rejalar',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Goals" 
          component={GoalsScreen}
          options={{
            title: 'Maqsadlar',
            tabBarLabel: 'Maqsadlar',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="track-changes" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Pomodoro" 
          component={PomodoroScreen}
          options={{
            title: 'Pomodoro',
            tabBarLabel: 'Timer',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="clock" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
