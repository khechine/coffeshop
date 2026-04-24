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
        tabBarStyle: {
          backgroundColor: '#0a0f1e',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
      {/* Hidden legacy screens from cloning */}
      <Tabs.Screen name="rachma" options={{ href: null }} />
      <Tabs.Screen name="pos" options={{ href: null }} />
      <Tabs.Screen name="tables" options={{ href: null }} />
      <Tabs.Screen name="marketplace" options={{ href: null }} />
      <Tabs.Screen name="stocks" options={{ href: null }} />
      <Tabs.Screen name="suppliers" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
