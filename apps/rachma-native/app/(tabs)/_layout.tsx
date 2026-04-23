import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
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
  const [role, setRole] = useState<string>('UNKNOWN');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<string>('');

  useEffect(() => {
    async function fetchUser() {
      const session = await AuthService.getSession();
      if (session.user) {
        setRole(session.user.role || 'UNKNOWN');
        setPermissions(session.user.permissions || []);
        setAuthMode(session.user.authMode || '');
      }
    }
    fetchUser();
  }, []);

  const isOwner = (role === 'STORE_OWNER' || role === 'SUPERADMIN') && authMode === 'PASSWORD';
  const isOwnerRole = role === 'STORE_OWNER' || role === 'SUPERADMIN';
  const hasRachmaAccess = isOwnerRole || permissions.includes('RACHMA') || role === 'RACHMA' || role === 'CASHIER';
  const hasPosAccess = isOwnerRole || permissions.includes('POS') || permissions.includes('TABLES') || role === 'POS' || role === 'CASHIER';
  const hasTablesAccess = isOwnerRole || permissions.includes('TABLES') || role === 'TABLES' || role === 'CASHIER';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0a0f1e',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 60,
          paddingBottom: 10,
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
        name="rachma"
        options={{
          title: '⚡ RACHMA',
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
          tabBarLabel: 'Rachma',
          headerShown: false,
          href: hasRachmaAccess ? '/(tabs)/rachma' : null,
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Caisse',
          tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          headerShown: false,
          href: hasPosAccess ? '/(tabs)/pos' : null,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Tables',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
          headerShown: false,
          href: hasTablesAccess ? '/(tabs)/tables' : null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Finance',
          tabBarIcon: ({ color }) => <TabBarIcon name="money" color={color} />,
          href: isOwner ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="stocks"
        options={{
          title: 'Stocks',
          tabBarIcon: ({ color }) => <TabBarIcon name="archive" color={color} />,
          href: isOwner ? '/(tabs)/stocks' : null,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marché',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          href: isOwner ? '/(tabs)/marketplace' : null,
        }}
      />
    </Tabs>
  );
}
