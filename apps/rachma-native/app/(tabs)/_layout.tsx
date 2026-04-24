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

  const isOwnerRole = role === 'STORE_OWNER' || role === 'SUPERADMIN';
  const isManager = authMode === 'PASSWORD';
  const isTerminal = authMode === 'PIN' || !authMode;

  const hasRachmaAccess = isTerminal && (isOwnerRole || permissions.includes('RACHMA') || role === 'RACHMA' || role === 'CASHIER');
  const hasPosAccess = isTerminal && (isOwnerRole || permissions.includes('POS') || permissions.includes('TABLES') || role === 'POS' || role === 'CASHIER');
  const hasTablesAccess = isTerminal && (isOwnerRole || permissions.includes('TABLES') || role === 'TABLES' || role === 'CASHIER');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
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
        name="rachma"
        options={{
          title: 'RACHMA',
          tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
          tabBarLabel: 'POS',
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
          title: 'Dashboard',
          tabBarLabel: 'Finance',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
          href: isManager ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="stocks"
        options={{
          title: 'Gestion Pro',
          tabBarLabel: 'Gestion',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
          href: isManager ? '/(tabs)/stocks' : null,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'B2B',
          tabBarLabel: 'Marché',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          href: isManager ? '/(tabs)/marketplace' : null,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Fournisseurs',
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Ventes',
          href: null,
        }}
      />
    </Tabs>
  );
}
