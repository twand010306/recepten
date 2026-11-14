import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseRecipeText } from '@/utils/recipe-text';
import { recognizeRecipeImage } from '@/utils/recipe-ocr';

const accent = '#d94b0b';
const categories = ['Hoofdgerecht', 'Nagerecht', 'Ontbijt', 'Snack', 'Overig'] as const;
const categoryEmojis: Record<RecipeCategory, string> = {
  Hoofdgerecht: '🍝',
  Nagerecht: '🍰',
  Ontbijt: '🥞',
  Snack: '🥨',
  Overig: '🍲',
};
const categoryColors: Record<RecipeCategory, string> = {
  Hoofdgerecht: '#f5d8c6',
  Nagerecht: '#f3d9d4',
  Ontbijt: '#f5e6bf',
  Snack: '#ead8bd',
  Overig: '#e5e2d9',
};

type RecipeCategory = (typeof categories)[number];
type RecipeFilter = RecipeCategory | 'Alle recepten';

type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions?: string;
  category?: RecipeCategory;
};

type CategoryTile = {
  label: RecipeFilter;
  emoji: string;
  color: string;
  count: number;
};

export default function RecipeHomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('Hoofdgerecht');
  const [selectedCategory, setSelectedCategory] = useState<RecipeFilter | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  async function loadRecipes() {
    try {
      const savedRecipes = await AsyncStorage.getItem('@recipes');
      if (savedRecipes !== null) {
        setRecipes(JSON.parse(savedRecipes) as Recipe[]);
      }
    } catch (error) {
      console.error('Fout bij het laden van recepten', error);
    }
  }

  useEffect(() => {
    // Load the initial value from the external storage system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecipes();
  }, []);

  async function saveRecipes(newRecipes: Recipe[]) {
    try {
      await AsyncStorage.setItem('@recipes', JSON.stringify(newRecipes));
    } catch (error) {
      console.error('Fout bij het opslaan van recepten', error);
    }
  }

  function addRecipe() {
    if (title.trim() === '' || ingredients.trim() === '') {
      Alert.alert('Vul zowel de naam van het recept als de ingrediënten in.');
      return;
    }

    const newRecipes = [
      {
        id: Date.now().toString(),
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        category,
      },
      ...recipes,
    ];

    setRecipes(newRecipes);
    void saveRecipes(newRecipes);
    setTitle('');
    setIngredients('');
    setInstructions('');
    setCategory('Hoofdgerecht');
    setIsAddingRecipe(false);
  }

  async function recognizePhoto(source: 'camera' | 'library') {
    if (isRecognizing) {
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        'Niet beschikbaar in de webversie',
        'Tekstherkenning werkt in de mobiele development build.'
      );
      return;
    }

    setIsRecognizing(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cameratoegang nodig',
            'Geef de app toestemming om een foto van de receptenpagina te maken.'
          );
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 1,
            });
      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0]?.uri;
      if (!imageUri) {
        throw new Error('Geen foto ontvangen. Probeer het opnieuw.');
      }

      const text = await recognizeRecipeImage(imageUri);
      if (!text.trim()) {
        Alert.alert(
          'Geen tekst herkend',
          'Probeer een scherpere foto met de hele receptenpagina in beeld.'
        );
        return;
      }

      const parsedRecipe = parseRecipeText(text);
      setTitle(parsedRecipe.title);
      setIngredients(parsedRecipe.ingredients);
      setInstructions(parsedRecipe.instructions);
      Alert.alert(
        'Tekst herkend',
        'Controleer en verbeter de titel, ingrediënten en bereiding voordat je het recept opslaat.'
      );
    } catch (error) {
      console.error('Fout bij het herkennen van de receptenfoto', error);
      Alert.alert(
        'Foto niet verwerkt',
        error instanceof Error
          ? error.message
          : 'Controleer of je de mobiele development build gebruikt en probeer het opnieuw.'
      );
    } finally {
      setIsRecognizing(false);
    }
  }

  const categoryTiles: CategoryTile[] = [
    {
      label: 'Alle recepten',
      emoji: '🍽️',
      color: '#f2d6c6',
      count: recipes.length,
    },
    ...categories.map((item) => ({
      label: item,
      emoji: categoryEmojis[item],
      color: categoryColors[item],
      count: recipes.filter((recipe) => getCategory(recipe) === item).length,
    })),
  ];

  const shownRecipes = recipes.filter((recipe) => {
    const matchesCategory =
      selectedCategory === null ||
      selectedCategory === 'Alle recepten' ||
      getCategory(recipe) === selectedCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchText.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const listItems: (CategoryTile | Recipe)[] =
    selectedCategory === null ? categoryTiles : shownRecipes;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandIcon}>🍲</Text>
            <View>
              <Text style={styles.brandName}>Recepten</Text>
              <Text style={styles.brandCaption}>Jouw eigen kookboek</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={isSearchOpen ? 'Zoeken sluiten' : 'Recepten zoeken'}
              onPress={() => {
                setIsSearchOpen((visible) => !visible);
                setSelectedCategory('Alle recepten');
                setSearchText('');
              }}
              style={styles.iconButton}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                tintColor={accent}
                size={21}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Recept toevoegen"
              onPress={() => setIsAddingRecipe(true)}
              style={[styles.iconButton, styles.addButton]}>
              <Text style={styles.plus}>+</Text>
            </Pressable>
          </View>
        </View>

        {isSearchOpen ? (
          <TextInput
            autoFocus
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Zoek een recept..."
            placeholderTextColor="#8c817b"
            style={styles.searchInput}
          />
        ) : null}

        <View style={styles.sectionHeading}>
          {selectedCategory !== null ? (
            <Pressable
              accessibilityLabel="Terug naar categorieën"
              onPress={() => {
                setSelectedCategory(null);
                setIsSearchOpen(false);
                setSearchText('');
              }}
              style={styles.backButton}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor={accent}
                size={18}
              />
            </Pressable>
          ) : null}
          <View>
            <Text style={styles.sectionTitle}>
              {selectedCategory ?? 'Alle recepten'} (
              {selectedCategory === null || selectedCategory === 'Alle recepten'
                ? recipes.length
                : shownRecipes.length}
              )
            </Text>
            <Text style={styles.sectionCaption}>
              {selectedCategory === null ? 'Kies een categorie om te beginnen' : 'Jouw recepten'}
            </Text>
          </View>
        </View>

        <FlatList
          data={listItems}
          keyExtractor={(item) =>
            isCategoryTile(item) ? `category-${item.label}` : `recipe-${item.id}`
          }
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            isCategoryTile(item) ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setSelectedCategory(item.label)}
                style={styles.tile}>
                <View style={[styles.tileArtwork, { backgroundColor: item.color }]}>
                  <Text style={styles.tileEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.tileFooter}>
                  <Text numberOfLines={1} style={styles.tileLabel}>
                    {item.label}
                  </Text>
                  <Text style={styles.tileCount}>{item.count}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.recipeCard}>
                <View
                  style={[
                    styles.tileArtwork,
                    { backgroundColor: categoryColors[getCategory(item)] },
                  ]}>
                  <Text style={styles.tileEmoji}>{categoryEmojis[getCategory(item)]}</Text>
                </View>
                <View style={styles.recipeInfo}>
                  <Text numberOfLines={2} style={styles.recipeTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.recipeCategory}>
                    {getCategory(item)}
                  </Text>
                  <Text numberOfLines={2} style={styles.recipeIngredients}>
                    {item.ingredients}
                  </Text>
                </View>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyTitle}>
                {searchText ? 'Geen recepten gevonden' : 'Nog geen recepten'}
              </Text>
              <Text style={styles.emptyDescription}>
                Voeg een recept toe of maak een foto van een pagina uit je kookboek.
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddingRecipe(true)}
                style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Recept toevoegen</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <Modal
          animationType="slide"
          onRequestClose={() => setIsAddingRecipe(false)}
          transparent
          visible={isAddingRecipe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalBackdrop}>
            <View style={styles.modalPanel}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Nieuw recept</Text>
                  <Text style={styles.modalCaption}>Voeg het zelf toe of scan een pagina</Text>
                </View>
                <Pressable
                  accessibilityLabel="Sluiten"
                  onPress={() => setIsAddingRecipe(false)}
                  style={styles.closeButton}>
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled">
                <Text style={styles.photoLabel}>Vul automatisch in vanaf een foto</Text>
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={[styles.photoButton, isRecognizing && styles.disabledButton]}
                    onPress={() => void recognizePhoto('camera')}
                    disabled={isRecognizing}>
                    <Text style={styles.photoButtonText}>📷  Maak foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoButton, isRecognizing && styles.disabledButton]}
                    onPress={() => void recognizePhoto('library')}
                    disabled={isRecognizing}>
                    <Text style={styles.photoButtonText}>Kies foto</Text>
                  </TouchableOpacity>
                </View>
                {isRecognizing ? (
                  <View style={styles.recognizing}>
                    <ActivityIndicator color={accent} />
                    <Text style={styles.recognizingText}>Recepttekst herkennen...</Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.input}
                  placeholder="Naam van het recept"
                  placeholderTextColor="#8c817b"
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.ingredientsInput]}
                  placeholder="Ingrediënten"
                  placeholderTextColor="#8c817b"
                  value={ingredients}
                  onChangeText={setIngredients}
                  multiline
                />
                <TextInput
                  style={[styles.input, styles.instructionsInput]}
                  placeholder="Bereiding"
                  placeholderTextColor="#8c817b"
                  value={instructions}
                  onChangeText={setInstructions}
                  multiline
                />

                <Text style={styles.photoLabel}>Categorie</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryOptions}>
                  {categories.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[
                        styles.categoryOption,
                        category === item && styles.selectedCategoryOption,
                      ]}>
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === item && styles.selectedCategoryOptionText,
                        ]}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.saveButton} onPress={addRecipe}>
                  <Text style={styles.saveButtonText}>Recept opslaan</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function getCategory(recipe: Recipe): RecipeCategory {
  return recipe.category && categories.includes(recipe.category) ? recipe.category : 'Overig';
}

function isCategoryTile(item: CategoryTile | Recipe): item is CategoryTile {
  return 'label' in item;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  page: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee8e3',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIcon: {
    fontSize: 24,
  },
  brandName: {
    color: accent,
    fontSize: 18,
    fontWeight: '700',
  },
  brandCaption: {
    color: '#8c817b',
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: accent,
  },
  plus: {
    color: '#fff',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '300',
  },
  searchInput: {
    marginHorizontal: 18,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eadfd8',
    borderRadius: 10,
    backgroundColor: '#fffaf7',
    color: '#342820',
    fontSize: 15,
  },
  sectionHeading: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#382a23',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionCaption: {
    color: '#8c817b',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  grid: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingBottom: 88,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e9e4',
  },
  tileArtwork: {
    height: 122,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileEmoji: {
    fontSize: 56,
  },
  tileFooter: {
    minHeight: 31,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: accent,
  },
  tileLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tileCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  recipeCard: {
    width: '48%',
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e9e4',
  },
  recipeInfo: {
    padding: 10,
  },
  recipeTitle: {
    color: '#382a23',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  recipeCategory: {
    color: accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  recipeIngredients: {
    color: '#746961',
    fontSize: 11,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    width: '100%',
    minHeight: 270,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#382a23',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    color: '#746961',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: accent,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalPanel: {
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#382a23',
    fontSize: 21,
    fontWeight: '700',
  },
  modalCaption: {
    color: '#8c817b',
    fontSize: 13,
    marginTop: 3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5eee9',
  },
  closeText: {
    color: '#6f6159',
    fontSize: 26,
    lineHeight: 28,
  },
  form: {
    paddingBottom: 22,
  },
  photoLabel: {
    color: '#382a23',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#edc5b2',
    backgroundColor: '#fff8f4',
  },
  photoButtonText: {
    color: accent,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  recognizing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recognizingText: {
    color: '#746961',
    fontSize: 13,
  },
  input: {
    minHeight: 46,
    marginBottom: 10,
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e8dfd9',
    color: '#382a23',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  ingredientsInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  instructionsInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryOptions: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryOption: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8dfd9',
    backgroundColor: '#fff',
  },
  selectedCategoryOption: {
    borderColor: accent,
    backgroundColor: accent,
  },
  categoryOptionText: {
    color: '#665950',
    fontSize: 12,
  },
  selectedCategoryOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: accent,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
