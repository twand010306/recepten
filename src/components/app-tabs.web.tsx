import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="start" href="/" asChild>
            <TabButton icon="⌂">Start</TabButton>
          </TabTrigger>
          <TabTrigger name="weken" href="/weken" asChild>
            <TabButton icon="▦">Weken</TabButton>
          </TabTrigger>
          <TabTrigger name="plan" href="/plan" asChild>
            <TabButton icon="☷">Plan</TabButton>
          </TabTrigger>
          <TabTrigger name="favorieten" href="/favorieten" asChild>
            <TabButton icon="♡">Favorieten</TabButton>
          </TabTrigger>
          <TabTrigger name="instellingen" href="/instellingen" asChild>
            <TabButton icon="⚙">Instellingen</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  ref: _ref,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  void _ref;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.focusedTab,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.tabIcon, isFocused && styles.focusedText]}>{icon}</Text>
      <Text style={[styles.tabLabel, isFocused && styles.focusedText]} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}
    />
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    minHeight: 62,
    paddingTop: 6,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8dfd9',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
    paddingVertical: 5,
    gap: 2,
  },
  focusedTab: {
    opacity: 1,
  },
  tabIcon: {
    color: '#94877f',
    fontSize: 19,
    lineHeight: 22,
  },
  tabLabel: {
    color: '#94877f',
    fontSize: 9,
    fontWeight: '500',
  },
  focusedText: {
    color: '#d94b0b',
  },
  pressed: {
    opacity: 0.65,
  },
});
