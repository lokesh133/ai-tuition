import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { AITutorStudioScreen } from '../screens/AITutorStudioScreen';
import { HomeworkScannerScreen } from '../screens/HomeworkScannerScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Colors } from '../theme/tokens';
import { Home, Sparkles, Camera, Trophy, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconBox : undefined}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="AI Tutor Studio"
        component={AITutorStudioScreen}
        options={{
          tabBarLabel: 'AI Studio',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.specialTabIcon, focused && styles.specialTabActive]}>
              <Sparkles size={22} color="#FFF" />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Homework Scanner"
        component={HomeworkScannerScreen}
        options={{
          tabBarLabel: 'Scan HW',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconBox : undefined}>
              <Camera size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: 'Badges',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconBox : undefined}>
              <Trophy size={22} color={color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconBox : undefined}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 68,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  activeTabIconBox: {
    padding: 2,
    borderRadius: 8,
  },
  specialTabIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  specialTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
});
