import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Recipe = {
  id: string;
  title: string;
  ingredients: string;
};

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');

  useEffect(() => {
    void loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const savedRecipes = await AsyncStorage.getItem('@recipes');
      if (savedRecipes !== null) {
        setRecipes(JSON.parse(savedRecipes) as Recipe[]);
      }
    } catch (error) {
      console.error('Fout bij het laden van recepten', error);
    }
  };

  const saveRecipes = async (newRecipes: Recipe[]) => {
    try {
      await AsyncStorage.setItem('@recipes', JSON.stringify(newRecipes));
    } catch (error) {
      console.error('Fout bij het opslaan van recepten', error);
    }
  };

  const addRecipe = () => {
    if (title.trim() === '' || ingredients.trim() === '') {
      Alert.alert('Vul zowel de naam van het recept als de ingrediënten in!');
      return;
    }

    const newRecipe = {
      id: Date.now().toString(),
      title,
      ingredients,
    };

    const updatedRecipes = [newRecipe, ...recipes];
    setRecipes(updatedRecipes);
    void saveRecipes(updatedRecipes);
    setTitle('');
    setIngredients('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.header}>Mijn Recepten App 🍳</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Naam van het recept (bijv. Pannenkoeken)"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ingrediënten (bijv. bloem, melk, eieren)"
          placeholderTextColor="#888"
          value={ingredients}
          onChangeText={setIngredients}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={addRecipe}>
          <Text style={styles.buttonText}>Recept Toevoegen</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>Jouw Recepten:</Text>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recipeCard}>
            <Text style={styles.recipeTitle}>{item.title}</Text>
            <Text style={styles.recipeIngredients}>{item.ingredients}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nog geen recepten toegevoegd. Voeg je eerste recept hierboven toe!
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recipeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 5,
  },
  recipeIngredients: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
