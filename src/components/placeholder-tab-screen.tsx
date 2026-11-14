import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

type PlaceholderTabScreenProps = {
  title: string;
  icon: string;
  description: string;
};

export function PlaceholderTabScreen({
  title,
  icon,
  description,
}: PlaceholderTabScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.comingSoon}>Binnenkort beschikbaar</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    fontSize: 44,
    marginBottom: 12,
  },
  title: {
    color: '#382a23',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    maxWidth: 280,
    color: '#746961',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  comingSoon: {
    color: '#d94b0b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
  },
});
