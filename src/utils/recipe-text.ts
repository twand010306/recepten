const ingredientHeading =
  /^(ingrediënten|ingredienten|benodigdheden|wat heb je nodig|ingredients?)\s*:?\s*$/i;
const instructionHeading =
  /^(bereiding|bereidingswijze|instructies|werkwijze|methode|zo maak je het|preparation|method|instructions|directions)\s*:?\s*$/i;

export type ParsedRecipeText = {
  title: string;
  ingredients: string;
  instructions: string;
};

export function parseRecipeText(text: string): ParsedRecipeText {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines.shift() ?? '';
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let section: 'ingredients' | 'instructions' = 'ingredients';

  for (const line of lines) {
    if (ingredientHeading.test(line)) {
      section = 'ingredients';
      continue;
    }

    if (instructionHeading.test(line)) {
      section = 'instructions';
      continue;
    }

    (section === 'ingredients' ? ingredients : instructions).push(line);
  }

  return {
    title,
    ingredients: ingredients.join('\n'),
    instructions: instructions.join('\n'),
  };
}
