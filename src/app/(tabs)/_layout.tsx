import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import {
  borderWidths,
  colors,
  fontFamily,
  fontSize,
  lineHeight,
} from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type TabBarIconProps = {
  active: IconName;
  inactive: IconName;
  focused: boolean;
  color: ColorValue | number | null;
  size: number;
};

function TabBarIcon({
  active,
  inactive,
  focused,
  color,
  size,
}: TabBarIconProps) {
  return (
    <Ionicons
      color={typeof color === 'number' ? colors.navy : (color ?? colors.navy)}
      name={focused ? active : inactive}
      size={size}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.navyMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodyBold,
          fontSize: fontSize.xs,
          lineHeight: lineHeight.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.navy,
          borderTopWidth: borderWidths.strong,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Estante',
          tabBarIcon: (props) => (
            <TabBarIcon
              active="library"
              inactive="library-outline"
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fila"
        options={{
          title: 'Fila',
          tabBarIcon: (props) => (
            <TabBarIcon active="list" inactive="list-outline" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="hoje"
        options={{
          title: 'Hoje',
          tabBarIcon: (props) => (
            <TabBarIcon active="today" inactive="today-outline" {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: (props) => (
            <TabBarIcon
              active="settings"
              inactive="settings-outline"
              {...props}
            />
          ),
        }}
      />
    </Tabs>
  );
}
