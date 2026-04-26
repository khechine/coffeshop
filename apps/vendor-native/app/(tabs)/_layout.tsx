import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthService } from '@/services/auth';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f59e0b', // Amber for Vendor
        tabBarInactiveTintColor: '#94a3b8',
        tabBarItemStyle: {
          borderRadius: 15,
          marginHorizontal: 5,
          marginVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          marginHorizontal: Platform.OS === 'ios' ? 0 : 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 20,
          borderRadius: Platform.OS === 'ios' ? 0 : 24,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
        },
        headerStyle: {
          backgroundColor: '#0a0f1e',
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: '800',
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de Bord',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Mon Catalogue',
          tabBarLabel: 'Produits',
          tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bundles"
        options={{
          title: 'Mes Packs',
          tabBarLabel: 'Packs',
          tabBarIcon: ({ color }) => <TabBarIcon name="gift" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes Reçues',
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color }) => <TabBarIcon name="truck" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Mon Wallet',
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Mon Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      {/* Hidden legacy screens from cloning */}
      <Tabs.Screen name="rachma" options={{ href: null }} />
      <Tabs.Screen name="pos" options={{ href: null }} />
      <Tabs.Screen name="tables" options={{ href: null }} />
      <Tabs.Screen name="marketplace" options={{ href: null }} />
      <Tabs.Screen name="stocks" options={{ href: null }} />
      <Tabs.Screen name="suppliers" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
    </Tabs>
  );
}
