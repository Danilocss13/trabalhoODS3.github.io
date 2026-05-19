// 🔤 normalizar texto
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const defaultFoodScopeKeywords = [
  'alimento', 'comida', 'comer', 'refeicao', 'arroz', 'feijao', 'carne', 'peixe', 'leite', 'ovo',
  'salada', 'fruta', 'verdura', 'legume', 'abobrinha', 'abobora', 'berinjela', 'abacate', 'maca',
  'banana', 'melancia', 'laranja', 'mamao', 'manga', 'morango', 'uva', 'pera', 'kiwi', 'tomate',
  'cenoura', 'brocolis', 'espinafre', 'couve', 'alface', 'milho', 'macarrao', 'aveia',
  'validade', 'cheiro', 'odor', 'textura', 'bolor', 'mofo', 'embalagem', 'conservacao',
  'geladeira', 'refrigerador', 'cozinha', 'sabor', 'gosto', 'estragado', 'podre', 'vencido', 'rancoso'
];

let foodScopeExtraKeywords = new Set();

function getSimpleFoodAlias(description) {
  const stopwords = new Set(['e','de','do','da','em','no','na','o','a','os','as','um','uma','uns','umas','por','para']);
  const cleanDescription = normalizar(description)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleanDescription.split(' ').filter(Boolean);
  if (words.length < 2) return '';
  const firstWord = words[0];
  if (!stopwords.has(firstWord)) return firstWord;
  const nextWord = words.find(word => !stopwords.has(word));
  return nextWord || '';
}

function isFoodRelated(normalizedText) {
  if (defaultFoodScopeKeywords.some(keyword => normalizedText.includes(keyword))) {
    return true;
  }

  for (const keyword of foodScopeExtraKeywords) {
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }

  return false;
}

function ruleMatchesMessage(ruleKeyword, normalizedMessage) {
  const cleanedRule = normalizar(ruleKeyword.toLowerCase()).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanedMessage = normalizedMessage.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanedRule) return false;
  if (cleanedMessage.includes(cleanedRule)) return true;

  const stopwords = new Set(['e','de','do','da','em','no','na','o','a','os','as','um','uma','uns','umas','por','para']);
  const ruleWords = cleanedRule.split(' ').filter(word => word && !stopwords.has(word));
  if (ruleWords.length === 0) return false;

  return ruleWords.every(word => cleanedMessage.includes(word));
}

function getFoodSpoilageResponse(normalizedMessage) {
  const spoilageTriggers = [
    'estragado', 'podre', 'cheiro ruim', 'cheiro forte', 'mofado', 'bolor',
    'aparencia duvidosa', 'aparência duvidosa', 'quase estragado', 'perto de estragar',
    'meio escuro', 'meia escura', 'muito escuro', 'muito escura', 'escuro demais', 'escura demais',
    'muito preto', 'muito preta', 'preto demais', 'preta demais',
    'viscoso', 'pegajoso', 'azedo', 'azedo demais', 'cheiro de amonia', 'cheiro de amônia'
  ];

  const triggerFound = spoilageTriggers.find(trigger => normalizedMessage.includes(trigger));
  if (!triggerFound || bancoDeDados.length === 0) return "";

  for (const item of bancoDeDados) {
    const itemKey = item.normalizedDescription || normalizar(item.description);
    if (ruleMatchesMessage(itemKey, normalizedMessage)) {
      const itemName = item.descriptionClean || item.description;
      return `🚨 <strong>Alerta:</strong> ${itemName} com sinal de deterioração (“${triggerFound}”). Se estiver duvidoso, descarte para evitar risco.`;
    }
    if (item.simpleAlias && ruleMatchesMessage(item.simpleAlias, normalizedMessage)) {
      const itemName = item.descriptionClean || item.description;
      return `🚨 <strong>Alerta:</strong> ${itemName} com sinal de deterioração (“${triggerFound}”). Se estiver duvidoso, descarte para evitar risco.`;
    }
  }

  return "";
}

function simplificarDescricao(descricao) {
  if (!descricao) return "";
  let texto = descricao
    .replace(/\(.*?\)/g, "")
    .replace(/\bpolido\b|\bparboilizado\b|\bagulha\b|\bagulhinha\b|\betc\b|\bin natura\b|\borg[aâ]nico\b/gi, "")
    .replace(/\bcru[a]?\b|\bcozido[a]?\b|\bgrelhado[a]?\b|\bassado[a]?\b|\bfrito[a]?\b|\brefogado[a]?\b|\bensopado\b|\bsopa\b|\bmingau\b/gi, "")
    .replace(/\bao alho e óleo\b|\bao alho e oleo\b|\bao vinagrete\b|\bcom manteiga\/óleo\b|\bcom manteiga\/oleo\b|\bcom manteiga\b/gi, "")
    .replace(/[,\/\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texto || descricao;
}

function descricaoParaExibir(item) {
  return item.descriptionClean || item.description;
}

// 🧠 lista selecionada
let alimentosSelecionados = [];
let bancoDeDados = [];

// 🚫 filtros
const proibidos = ["doce", "calda", "frito", "molho", "industrializado", "recheado", "condensado", "conserva", "xarope"];
const ruins = ["pizza", "hamburguer", "biscoito", "refrigerante", "lasanha"];

// ============================================================
// 🍽️ BASE DE RECEITAS EXPANDIDA
// ============================================================
const receitasPorAlimento = {
  "arroz integral": {
    nome: "Bowl de Arroz Integral com Legumes",
    tempo: "30 minutos", porcoes: "3 porções",
    ingredientes: ["1 xícara de arroz integral cozido", "1 xícara de legumes variados", "1 colher de sopa de azeite", "Salsinha ou cebolinha"],
    modo_preparo: "Cozinhe o arroz integral e reserve. Refogue os legumes no azeite, misture com o arroz e finalize com ervas.",
    beneficios: "Fonte de fibras, vitaminas e carboidratos complexos. Ideal para uma refeição equilibrada.",
    ocasiao: "Almoço ou jantar"
  },
  "arroz": {
    nome: "Arroz Temperado com Ervas Frescas",
    tempo: "25 minutos", porcoes: "3 porções",
    ingredientes: ["1 xícara de arroz", "2 xícaras de água", "1 dente de alho", "1 colher de sopa de azeite", "Salsinha"],
    modo_preparo: "Refogue o alho no azeite, junte o arroz e a água. Cozinhe até secar e finalize com ervas.",
    beneficios: "Acompanhamento leve e versátil, ideal para combinar com outros alimentos.",
    ocasiao: "Refeição diária"
  },
  "feijao": {
    nome: "Feijão Caseiro Temperado",
    tempo: "40 minutos", porcoes: "4 porções",
    ingredientes: ["2 xícaras de feijão cozido", "1 cebola picada", "2 dentes de alho", "Cheiro-verde"],
    modo_preparo: "Refogue a cebola e o alho, adicione o feijão e um pouco de água. Cozinhe por alguns minutos e finalize com cheiro-verde.",
    beneficios: "Fonte de proteínas vegetais e fibras. Ótimo complemento para refeições equilibradas.",
    ocasiao: "Acompanhamento"
  },
  "lentilha": {
    nome: "Sopa de Lentilha com Legumes",
    tempo: "35 minutos", porcoes: "4 porções",
    ingredientes: ["1 xícara de lentilha", "1 cenoura picada", "1 tomate", "Cúrcuma e cominho", "Azeite e alho"],
    modo_preparo: "Refogue o alho e a cenoura, adicione a lentilha e água. Tempere com cúrcuma e cominho e cozinhe até ficar macia.",
    beneficios: "Rica em proteínas, ferro e fibras. Ótima opção para vegetarianos.",
    ocasiao: "Almoço ou jantar"
  },
  "grao de bico": {
    nome: "Grão-de-bico ao Alho e Azeite",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["1 lata de grão-de-bico cozido", "2 dentes de alho", "2 colheres de azeite", "Páprica e limão"],
    modo_preparo: "Doure o alho no azeite, adicione o grão-de-bico e tempere com páprica e limão. Sirva quente.",
    beneficios: "Excelente fonte de proteínas vegetais e carboidratos complexos.",
    ocasiao: "Petisco ou acompanhamento"
  },
  "quinoa": {
    nome: "Salada de Quinoa com Vegetais",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["1 xícara de quinoa cozida", "Pepino picado", "Tomate cereja", "Suco de limão", "Azeite e salsinha"],
    modo_preparo: "Cozinhe a quinoa e deixe esfriar. Misture com os vegetais picados, tempere com azeite e limão.",
    beneficios: "Proteína completa com todos os aminoácidos essenciais.",
    ocasiao: "Almoço leve"
  },
  "aveia": {
    nome: "Mingau de Aveia com Frutas",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["1/2 xícara de aveia", "1 xícara de leite ou bebida vegetal", "1 colher de mel", "Frutas a gosto"],
    modo_preparo: "Cozinhe a aveia no leite até engrossar. Sirva com mel e frutas.",
    beneficios: "Fibras solúveis que ajudam no controle do colesterol. Energia prolongada.",
    ocasiao: "Café da manhã"
  },
  "macarrao": {
    nome: "Macarrão Integral ao Alho e Azeite",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["200g de macarrão integral", "2 dentes de alho", "2 colheres de azeite", "Salsinha e pimenta"],
    modo_preparo: "Cozinhe o macarrão, escorra e misture com alho dourado no azeite. Finalize com salsinha.",
    beneficios: "Carboidratos complexos com gordura saudável do azeite.",
    ocasiao: "Almoço rápido"
  },
  "milho": {
    nome: "Milho Temperado com Ervas",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["1 espiga de milho ou milho em grãos", "1 colher de manteiga ou azeite", "Sal e pimenta", "Salsinha"],
    modo_preparo: "Cozinhe o milho até ficar macio. Tempere com manteiga ou azeite e ervas.",
    beneficios: "Boa fonte de energia e fibras. Acompanha pratos variados.",
    ocasiao: "Acompanhamento"
  },
  "banana": {
    nome: "Panqueca Saudável de Banana e Aveia",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["1 banana madura", "1 ovo", "1/2 xícara de aveia", "Canela a gosto"],
    modo_preparo: "Amasse a banana, misture com o ovo e a aveia. Cozinhe em frigideira antiaderente até dourar.",
    beneficios: "Combinação de fibras e energia natural. Ideal para café da manhã.",
    ocasiao: "Café da manhã"
  },
  "maca": {
    nome: "Maçã Assada com Canela e Mel",
    tempo: "25 minutos", porcoes: "2 porções",
    ingredientes: ["2 maçãs fatiadas", "1 colher de chá de canela", "1 colher de mel", "Nozes picadas"],
    modo_preparo: "Arrume as maçãs em uma assadeira, polvilhe canela e leve ao forno até amaciar.",
    beneficios: "Rica em fibras e antioxidantes.",
    ocasiao: "Lanche ou sobremesa"
  },
  "laranja": {
    nome: "Salada Cítrica com Laranja e Hortelã",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["2 laranjas fatiadas", "Folhas de hortelã", "1 colher de mel", "Pimenta rosa"],
    modo_preparo: "Fatia as laranjas e disponha no prato. Regue com mel e decore com hortelã e pimenta.",
    beneficios: "Vitamina C e flavonoides. Antioxidante e imunizante.",
    ocasiao: "Lanche ou sobremesa"
  },
  "mamao": {
    nome: "Smoothie de Mamão com Gengibre",
    tempo: "5 minutos", porcoes: "2 porções",
    ingredientes: ["1 fatia de mamão", "1 copo de água de coco", "1 colher de chá de gengibre", "Suco de limão"],
    modo_preparo: "Bata tudo no liquidificador e sirva gelado.",
    beneficios: "Papaína do mamão auxilia a digestão. Gengibre é anti-inflamatório.",
    ocasiao: "Café da manhã ou lanche"
  },
  "abacate": {
    nome: "Guacamole Caseiro Saudável",
    tempo: "10 minutos", porcoes: "4 porções",
    ingredientes: ["2 abacates maduros", "1 tomate picado", "1/2 cebola picada", "Limão e coentro", "Sal e pimenta"],
    modo_preparo: "Amasse os abacates, misture com os demais ingredientes e tempere a gosto.",
    beneficios: "Gorduras monoinsaturadas saudáveis para o coração.",
    ocasiao: "Petisco ou acompanhamento"
  },
  "abacaxi": {
    nome: "Abacaxi Grelhado com Hortelã",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["4 fatias de abacaxi", "1 colher de mel", "Hortelã fresca", "Canela em pó"],
    modo_preparo: "Grelhe as fatias de abacaxi numa frigideira quente. Regue com mel, canela e decore com hortelã.",
    beneficios: "Bromelina do abacaxi auxilia a digestão e reduz inflamações.",
    ocasiao: "Sobremesa saudável"
  },
  "melancia": {
    nome: "Salada Refrescante de Melancia e Limão",
    tempo: "10 minutos", porcoes: "4 porções",
    ingredientes: ["4 fatias de melancia em cubos", "Folhas de manjericão", "Suco de limão", "Uma pitada de sal"],
    modo_preparo: "Monte os cubos de melancia e tempere com limão e manjericão.",
    beneficios: "Hidratação e licopeno. Refrescante e antioxidante.",
    ocasiao: "Lanche ou sobremesa"
  },
  "manga": {
    nome: "Smoothie Bowl de Manga",
    tempo: "10 minutos", porcoes: "1 porção",
    ingredientes: ["1 manga congelada", "1/2 banana", "1/2 xícara de iogurte natural", "Frutas e granola para decorar"],
    modo_preparo: "Bata a manga e a banana congelada no processador até cremoso. Sirva com toppings.",
    beneficios: "Vitaminas A e C, potássio e antioxidantes.",
    ocasiao: "Café da manhã"
  },
  "morango": {
    nome: "Parfait de Morangos com Iogurte",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 xícara de morangos", "1 xícara de iogurte natural", "2 colheres de aveia", "1 colher de mel"],
    modo_preparo: "Em um pote, alterne camadas de iogurte, morangos e aveia. Finalize com mel.",
    beneficios: "Vitamina C e antioxidantes dos morangos com probióticos do iogurte.",
    ocasiao: "Café da manhã ou lanche"
  },
  "uva": {
    nome: "Salada de Uvas com Nozes e Rúcula",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 xícara de uvas", "1/4 xícara de nozes", "1 colher de mel", "Folhas de rúcula"],
    modo_preparo: "Misture as uvas com as nozes e sirva sobre a rúcula. Regue com mel.",
    beneficios: "Resveratrol das uvas é antioxidante. Nozes fornecem ômega-3.",
    ocasiao: "Salada ou sobremesa"
  },
  "pera": {
    nome: "Pera Pochê com Canela",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["2 peras", "2 xícaras de água", "1 pau de canela", "2 colheres de mel"],
    modo_preparo: "Cozinhe as peras na água com canela e mel até ficarem macias. Sirva com a calda.",
    beneficios: "Rica em fibras e potássio. Baixo índice glicêmico.",
    ocasiao: "Sobremesa"
  },
  "kiwi": {
    nome: "Salada de Frutas com Kiwi e Chia",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["2 kiwis fatiados", "1 banana", "1 maçã", "1 colher de chia", "Suco de limão"],
    modo_preparo: "Misture as frutas fatiadas, tempere com limão e polvilhe chia.",
    beneficios: "Kiwi é riquíssimo em vitamina C. Chia acrescenta ômega-3 e fibras.",
    ocasiao: "Café da manhã ou lanche"
  },
  "tomate": {
    nome: "Tomate Recheado com Ervas",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["4 tomates médios", "Queijo cottage", "Manjericão fresco", "Azeite e pimenta"],
    modo_preparo: "Retire o miolo dos tomates, recheie com cottage e ervas. Regue com azeite e leve ao forno por 10 min.",
    beneficios: "Licopeno do tomate é antioxidante. Excelente para a saúde cardiovascular.",
    ocasiao: "Entrada ou petisco"
  },
  "cenoura": {
    nome: "Salada de Cenoura com Ervas e Limão",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["2 cenouras raladas", "1 colher de azeite", "Suco de limão", "Salsinha ou cebolinha"],
    modo_preparo: "Misture a cenoura com azeite, limão e ervas. Ajuste o sal e sirva fresca.",
    beneficios: "Vitamina A e fibras. Leve e refrescante.",
    ocasiao: "Salada"
  },
  "brocolis": {
    nome: "Brócolis ao Vapor com Limão e Azeite",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["1 xícara de brócolis", "1 colher de azeite", "Sal e pimenta", "Suco de limão"],
    modo_preparo: "Cozinhe o brócolis no vapor. Regue com azeite e limão.",
    beneficios: "Rico em fibras, vitaminas C e K e micronutrientes.",
    ocasiao: "Acompanhamento"
  },
  "espinafre": {
    nome: "Creme de Espinafre Nutritivo",
    tempo: "20 minutos", porcoes: "3 porções",
    ingredientes: ["2 xícaras de espinafre", "1 batata cozida", "1 dente de alho", "Azeite"],
    modo_preparo: "Refogue o alho, junte o espinafre e a batata. Bata no liquidificador e aqueça.",
    beneficios: "Rico em ferro, cálcio e fibras.",
    ocasiao: "Acompanhamento"
  },
  "couve": {
    nome: "Couve Refogada com Alho",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 maço de couve fatiada fino", "2 dentes de alho", "1 colher de azeite", "Sal"],
    modo_preparo: "Doure o alho no azeite, adicione a couve e refogue rapidamente.",
    beneficios: "Rica em cálcio, vitamina K e ferro.",
    ocasiao: "Acompanhamento"
  },
  "alface": {
    nome: "Salada Verde com Molho de Limão",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 pé de alface", "1 tomate", "Pepino fatiado", "Suco de limão", "Azeite e sal"],
    modo_preparo: "Rasgue as folhas de alface, adicione os demais vegetais e tempere.",
    beneficios: "Baixas calorias, hidratante e rica em vitaminas.",
    ocasiao: "Salada"
  },
  "batata doce": {
    nome: "Purê de Batata Doce com Ervas",
    tempo: "25 minutos", porcoes: "4 porções",
    ingredientes: ["2 batatas doces médias", "1 colher de azeite", "Noz-moscada", "Ervas frescas"],
    modo_preparo: "Cozinhe as batatas até ficarem macias, amasse e misture com azeite e ervas.",
    beneficios: "Fonte de carboidratos de liberação lenta, vitaminas A e C.",
    ocasiao: "Acompanhamento"
  },
  "batata": {
    nome: "Batata Assada com Ervas e Azeite",
    tempo: "35 minutos", porcoes: "4 porções",
    ingredientes: ["4 batatas médias", "3 colheres de azeite", "Alecrim e tomilho", "Sal e pimenta"],
    modo_preparo: "Corte as batatas em cubos, tempere com azeite e ervas. Asse a 200°C por 30 minutos.",
    beneficios: "Fonte de potássio e vitamina C. Boa energia quando assada.",
    ocasiao: "Acompanhamento"
  },
  "abobrinha": {
    nome: "Abobrinha Grelhada com Ervas",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["2 abobrinhas fatiadas", "Azeite", "Alho", "Ervas frescas e limão"],
    modo_preparo: "Grelhe as fatias de abobrinha com azeite e alho. Finalize com ervas e limão.",
    beneficios: "Baixa caloria, rica em água e potássio.",
    ocasiao: "Acompanhamento"
  },
  "berinjela": {
    nome: "Berinjela Assada ao Forno",
    tempo: "30 minutos", porcoes: "2 porções",
    ingredientes: ["1 berinjela grande", "2 colheres de azeite", "2 dentes de alho", "Tomilho e sal"],
    modo_preparo: "Corte a berinjela em fatias, tempere com azeite, alho e ervas. Asse a 200°C por 25 minutos.",
    beneficios: "Rica em fibras e antioxidantes. Contribui para a saúde cardiovascular.",
    ocasiao: "Acompanhamento"
  },
  "pepino": {
    nome: "Salada Refrescante de Pepino e Iogurte",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["2 pepinos fatiados", "1/2 xícara de iogurte natural", "Hortelã fresca", "Sal e limão"],
    modo_preparo: "Misture o pepino com o iogurte, hortelã e tempere com sal e limão.",
    beneficios: "Hidratante e nutritivo. Probióticos do iogurte auxiliam a digestão.",
    ocasiao: "Salada ou entrada"
  },
  "pimentao": {
    nome: "Pimentão Recheado com Arroz",
    tempo: "35 minutos", porcoes: "2 porções",
    ingredientes: ["2 pimentões", "1 xícara de arroz cozido", "Cebola e alho", "Salsinha e azeite"],
    modo_preparo: "Retire a tampa dos pimentões, recheie com arroz temperado e leve ao forno por 20 minutos.",
    beneficios: "Vitamina C e fibras. Rico em antioxidantes.",
    ocasiao: "Prato principal"
  },
  "beterraba": {
    nome: "Salada de Beterraba com Laranja",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["2 beterrabas cozidas raladas", "1 colher de azeite", "Suco de laranja", "Salsinha"],
    modo_preparo: "Rale as beterrabas cozidas e tempere com azeite e suco de laranja. Finalize com salsinha.",
    beneficios: "Betaína e nitratos para saúde cardiovascular. Rica em folato.",
    ocasiao: "Salada"
  },
  "chuchu": {
    nome: "Chuchu Refogado com Temperos",
    tempo: "20 minutos", porcoes: "3 porções",
    ingredientes: ["2 chuchus picados", "1 cebola", "Alho", "Azeite e salsinha"],
    modo_preparo: "Refogue a cebola e o alho no azeite, adicione o chuchu e cozinhe até ficar macio.",
    beneficios: "Baixo teor calórico e rico em potássio.",
    ocasiao: "Acompanhamento"
  },
  "repolho": {
    nome: "Coleslaw Saudável de Repolho",
    tempo: "15 minutos", porcoes: "4 porções",
    ingredientes: ["1/2 repolho ralado", "1 cenoura ralada", "Iogurte natural", "Limão e sal"],
    modo_preparo: "Misture o repolho e a cenoura ralados. Tempere com iogurte e limão.",
    beneficios: "Rico em fibras e vitamina C.",
    ocasiao: "Acompanhamento"
  },
  "macaxeira": {
    nome: "Macaxeira Cozida com Ervas",
    tempo: "30 minutos", porcoes: "3 porções",
    ingredientes: ["500g de macaxeira", "1 colher de azeite", "Sal e pimenta", "Salsinha"],
    modo_preparo: "Cozinhe a macaxeira até ficar macia. Tempere com azeite, sal e ervas.",
    beneficios: "Rica em carboidratos e fibras. Boa opção para refeições caseiras.",
    ocasiao: "Acompanhamento"
  },
  "frango": {
    nome: "Peito de Frango Grelhado com Ervas",
    tempo: "25 minutos", porcoes: "2 porções",
    ingredientes: ["2 peitos de frango", "Suco de 1 limão", "Alho picado", "Alecrim e tomilho", "Azeite"],
    modo_preparo: "Marine o frango com limão, alho e ervas por 15 minutos. Grelhe em fogo médio por 6-7 minutos de cada lado.",
    beneficios: "Proteína magra de alto valor biológico. Fundamental para músculos.",
    ocasiao: "Almoço ou jantar"
  },
  "carne bovina": {
    nome: "Bife Grelhado com Salada Verde",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["2 bifes", "Sal e pimenta-do-reino", "Alho a gosto", "Alface e tomate para salada"],
    modo_preparo: "Tempere os bifes com sal, pimenta e alho. Grelhe e sirva com salada verde.",
    beneficios: "Rica em proteínas, ferro e vitamina B12.",
    ocasiao: "Almoço ou jantar"
  },
  "carne": {
    nome: "Carne Assada com Legumes",
    tempo: "50 minutos", porcoes: "4 porções",
    ingredientes: ["500g de carne", "Cenoura e batata", "Alho e cebola", "Azeite e ervas"],
    modo_preparo: "Tempere a carne com alho, sal e ervas. Asse com os legumes a 200°C por 40 minutos.",
    beneficios: "Proteína completa com vitaminas dos legumes.",
    ocasiao: "Almoço ou jantar"
  },
  "peixe": {
    nome: "Filé de Peixe ao Limão com Ervas",
    tempo: "20 minutos", porcoes: "2 porções",
    ingredientes: ["2 filés de peixe", "Suco de limão", "Alho", "Salsinha e cebolinha", "Azeite"],
    modo_preparo: "Marine o peixe com limão e alho. Grelhe em azeite até ficar dourado. Finalize com ervas.",
    beneficios: "Proteína leve com ômega-3, ótima para saúde cardiovascular.",
    ocasiao: "Almoço"
  },
  "atum": {
    nome: "Salada de Atum com Legumes",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 lata de atum em água", "1 tomate", "1/2 pepino", "Cebola e salsinha", "Limão e azeite"],
    modo_preparo: "Misture o atum escorrido com os legumes picados. Tempere com limão e azeite.",
    beneficios: "Rico em ômega-3 e proteínas. Prático e nutritivo.",
    ocasiao: "Almoço rápido ou lanche"
  },
  "sardinha": {
    nome: "Sardinha com Tomate e Ervas",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["1 lata de sardinha", "2 tomates picados", "Cebola", "Suco de limão e salsinha"],
    modo_preparo: "Tempere a sardinha com limão. Misture com tomate e cebola. Sirva com pão integral.",
    beneficios: "Ômega-3 e cálcio. Econômica e muito nutritiva.",
    ocasiao: "Lanche ou café da manhã"
  },
  "salmao": {
    nome: "Salmão Assado com Limão e Ervas",
    tempo: "25 minutos", porcoes: "2 porções",
    ingredientes: ["2 filés de salmão", "Suco de limão", "2 dentes de alho", "Endro ou salsinha", "Azeite"],
    modo_preparo: "Tempere o salmão com limão, alho e ervas. Asse a 180°C por 15-20 minutos.",
    beneficios: "Alta concentração de ômega-3. Excelente para o cérebro e coração.",
    ocasiao: "Jantar especial"
  },
  "ovo": {
    nome: "Omelete Nutritiva com Legumes",
    tempo: "15 minutos", porcoes: "2 porções",
    ingredientes: ["3 ovos", "1/4 xícara de espinafre", "Tomate cereja", "Sal e pimenta", "Azeite"],
    modo_preparo: "Bata os ovos e tempere. Cozinhe em frigideira com azeite, adicione os vegetais e dobre.",
    beneficios: "Proteína de alto valor biológico com vitaminas do complexo B.",
    ocasiao: "Café da manhã ou lanche"
  },
  "leite": {
    nome: "Vitamina Nutritiva de Frutas",
    tempo: "5 minutos", porcoes: "2 porções",
    ingredientes: ["1 copo de leite", "1 banana", "1 colher de mel", "Canela a gosto"],
    modo_preparo: "Bata todos os ingredientes no liquidificador. Sirva gelado.",
    beneficios: "Cálcio e proteínas do leite com vitaminas das frutas.",
    ocasiao: "Café da manhã ou lanche"
  },
  "iogurte": {
    nome: "Parfait de Iogurte com Frutas e Granola",
    tempo: "5 minutos", porcoes: "1 porção",
    ingredientes: ["1 pote de iogurte natural", "Frutas variadas", "2 colheres de granola", "Mel"],
    modo_preparo: "Em um copo, alterne camadas de iogurte, frutas e granola. Finalize com mel.",
    beneficios: "Probióticos para saúde intestinal com vitaminas das frutas.",
    ocasiao: "Café da manhã ou lanche"
  },
  "queijo": {
    nome: "Salada Caprese Saudável",
    tempo: "10 minutos", porcoes: "2 porções",
    ingredientes: ["Queijo minas fresco fatiado", "Tomate fatiado", "Manjericão fresco", "Azeite e sal"],
    modo_preparo: "Alterne fatias de queijo e tomate. Decore com manjericão e regue com azeite.",
    beneficios: "Cálcio e proteínas do queijo com licopeno do tomate.",
    ocasiao: "Entrada ou lanche"
  },
  "amendoim": {
    nome: "Pasta de Amendoim Caseira",
    tempo: "10 minutos", porcoes: "8 porções",
    ingredientes: ["2 xícaras de amendoim torrado", "1 pitada de sal", "1 colher de mel (opcional)"],
    modo_preparo: "Processe o amendoim no processador por 8-10 minutos até virar pasta. Adicione sal e mel.",
    beneficios: "Gorduras saudáveis, proteínas e vitamina E.",
    ocasiao: "Lanche"
  },
  "amendoa": {
    nome: "Mix de Oleaginosas com Frutas Secas",
    tempo: "5 minutos", porcoes: "4 porções",
    ingredientes: ["1/2 xícara de amêndoas", "1/4 xícara de castanha", "Uva passa", "Damasco seco"],
    modo_preparo: "Misture tudo e divida em pequenas porções para lanches.",
    beneficios: "Gorduras saudáveis, proteínas e minerais.",
    ocasiao: "Lanche"
  },
  "castanha": {
    nome: "Castanhas Assadas com Alecrim",
    tempo: "15 minutos", porcoes: "4 porções",
    ingredientes: ["1 xícara de castanhas", "1 colher de azeite", "Alecrim", "Sal marinho"],
    modo_preparo: "Tempere as castanhas com azeite e alecrim. Asse a 180°C por 10 minutos.",
    beneficios: "Selênio, gorduras saudáveis e vitamina E.",
    ocasiao: "Petisco"
  }
};

const receitasPorGrupo = {
  "arroz|feijao": {
    nome: "Arroz e Feijão Caseiro – O Clássico Brasileiro",
    tempo: "35 minutos", porcoes: "4 porções",
    ingredientes: ["2 xícaras de arroz", "2 xícaras de feijão cozido", "1 cebola picada", "2 dentes de alho", "Azeite e cheiro-verde"],
    modo_preparo: "Refogue a cebola e o alho no azeite, adicione o arroz e água. Cozinhe. Misture o feijão e ajuste o tempero.",
    beneficios: "Combinação clássica com proteína vegetal completa e carboidratos.",
    ocasiao: "Almoço diário"
  },
  "frango|legumes": {
    nome: "Frango com Legumes ao Forno",
    tempo: "45 minutos", porcoes: "4 porções",
    ingredientes: ["500g de frango", "Cenoura, abobrinha e pimentão", "Alho e ervas", "Azeite e limão"],
    modo_preparo: "Marine o frango, disponha com os legumes na assadeira e leve ao forno a 200°C por 35 minutos.",
    beneficios: "Proteína magra com vitaminas dos legumes. Refeição completa.",
    ocasiao: "Almoço ou jantar"
  }
};

// ============================================================
// 🧠 SCORE
// ============================================================
function calcularScore(nome, busca, item) {
  let score = 0;
  if (nome === busca) score += 100;
  if (nome.startsWith(busca)) score += 50;
  if (nome.includes(busca)) score += 30;
  if (proibidos.some(p => nome.includes(p))) score -= 100;
  if (ruins.some(r => nome.includes(r))) score -= 200;
  const categoria = item.category?.toLowerCase() || "";
  if (categoria.includes("frutas")) score += 20;
  if (categoria.includes("verduras") || categoria.includes("hortaliças")) score += 20;
  if (categoria.includes("cereais")) score += 10;
  return score;
}

// ============================================================
// 📦 Carregar JSON do IBGE com deduplicação
// ============================================================
async function carregarBancoDeDados() {
  try {
    const ibgeRes = await fetch("data/ibge.json");
    const ibgeData = await ibgeRes.json();

    // Deduplicação por descriptionClean normalizada
    const vistos = new Set();
    bancoDeDados = [];

    ibgeData.forEach(item => {
      const descriptionClean = simplificarDescricao(item.description);
      const chave = normalizar(descriptionClean);
      if (!vistos.has(chave)) {
        vistos.add(chave);
        const simpleAlias = getSimpleFoodAlias(descriptionClean);
        const dataItem = { ...item, descriptionClean, normalizedDescription: chave, simpleAlias };
        bancoDeDados.push(dataItem);
        foodScopeExtraKeywords.add(chave);
        if (simpleAlias) {
          foodScopeExtraKeywords.add(simpleAlias);
        }
      }
    });

    console.log(`✅ Banco de dados carregado com ${bancoDeDados.length} alimentos únicos`);
    return bancoDeDados;
  } catch (erro) {
    console.error("❌ Erro ao carregar banco de dados:", erro);
    return [];
  }
}

// ============================================================
// 🔍 BUSCA LOCAL
// ============================================================
function buscarLocalmente(termo, maxResults = 15) {
  const termoNormalizado = normalizar(termo);
  const resultadosComScore = bancoDeDados.map(item => {
    const nomeNormalizado = item.normalizedDescription || normalizar(item.description);
    const score = calcularScore(nomeNormalizado, termoNormalizado, item);
    return { item, score };
  });
  return resultadosComScore
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(r => r.item);
}

// ============================================================
// 🔍 SUGESTÕES
// ============================================================
function buscarSugestoes() {
  const input = document.getElementById("alimentos");
  const listaBox = document.getElementById("sugestoes");
  const valor = input.value.trim();

  if (valor.length < 2) { listaBox.innerHTML = ""; return; }

  const resultados = buscarLocalmente(valor, 15);
  listaBox.innerHTML = "";

  resultados.forEach(item => {
    const nome = item.normalizedDescription || normalizar(item.description);
    if (proibidos.some(p => nome.includes(p))) return;
    if (ruins.some(r => nome.includes(r))) return;

    const div = document.createElement("div");
    div.className = "list-group-item list-group-item-action";
    div.innerText = descricaoParaExibir(item);
    div.onclick = () => selecionarAlimento(item);
    listaBox.appendChild(div);
  });
}

// ============================================================
// ✅ Selecionar alimento
// ============================================================
function selecionarAlimento(item) {
  const jaExiste = alimentosSelecionados.some(
    e => e.normalizedDescription === item.normalizedDescription
  );
  if (!jaExiste) alimentosSelecionados.push(item);
  atualizarTags();
  document.getElementById("alimentos").value = "";
  document.getElementById("sugestoes").innerHTML = "";
}

// ============================================================
// 🏷️ Tags
// ============================================================
function atualizarTags() {
  const container = document.getElementById("tags");
  container.innerHTML = "";
  alimentosSelecionados.forEach((item, index) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerText = descricaoParaExibir(item) + " ✕";
    tag.onclick = () => { alimentosSelecionados.splice(index, 1); atualizarTags(); };
    container.appendChild(tag);
  });
}

// ============================================================
// 🔍 ANALISAR
// ============================================================
function showAnalysisMessage(text) {
  const messageElement = document.getElementById("analysis-message");
  if (messageElement) {
    messageElement.textContent = text;
    messageElement.classList.remove("hidden");
  }
}

function hideAnalysisMessage() {
  const messageElement = document.getElementById("analysis-message");
  if (messageElement) {
    messageElement.textContent = "";
    messageElement.classList.add("hidden");
  }
}

function analisar() {
  if (alimentosSelecionados.length > 0) { hideAnalysisMessage(); mostrarTabela(alimentosSelecionados); return; }

  const input = document.getElementById("alimentos").value.trim();
  if (!input) {
    showAnalysisMessage("Nenhum alimento selecionado. Por favor, selecione ou digite um alimento para analisar.");
    return;
  }

  const lista = input.split(",").map(a => a.trim());
  const resultados = [];

  for (const termo of lista) {
    if (!termo) continue;
    const busca = normalizar(termo);
    let melhor = null, melhorScore = -Infinity;
    for (const item of bancoDeDados) {
      const nome = item.normalizedDescription || normalizar(item.description);
      const score = calcularScore(nome, busca, item);
      if (score > melhorScore) { melhorScore = score; melhor = item; }
    }
    if (melhor) resultados.push(melhor);
  }

  if (resultados.length === 0) { showAnalysisMessage("Nenhum alimento encontrado. Tente outro termo."); return; }

  hideAnalysisMessage();
  mostrarTabela(resultados);
}

// ============================================================
// 💡 Clicar em sugestão popular
// ============================================================
function buscarSugestaoPopular(nome) {
  if (bancoDeDados.length > 0) {
    const resultados = buscarLocalmente(nome, 1);
    if (resultados.length > 0) {
      selecionarAlimento(resultados[0]);
      return;
    }
  }
  document.getElementById("alimentos").value = nome;
  buscarSugestoes();
  document.getElementById("alimentos").focus();
}

let ultimaTabela = [];

// ============================================================
// 📊 TABELA
// ============================================================
function mostrarTabela(dados) {
  ultimaTabela = dados;

  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;
  let totalFibras = 0;

  let html = `<div class="table-wrapper"><table class="nutrition-table"><thead><tr>
    <th class="th-left">Alimento</th>
    <th><div class="th-content"><span>Calorias</span><span class="th-unit">(kcal)</span></div></th>
    <th><div class="th-content"><span>Proteínas</span><span class="th-unit">(g)</span></div></th>
    <th><div class="th-content"><span>Carboidratos</span><span class="th-unit">(g)</span></div></th>
    <th><div class="th-content"><span>Gorduras</span><span class="th-unit">(g)</span></div></th>
    <th><div class="th-content"><span>Fibras</span><span class="th-unit">(g)</span></div></th>
  </tr></thead><tbody>`;

  dados.forEach(item => {
    const calorias = Number(item.energy_kcal) || 0;
    const proteinas = Number(item.protein_g) || 0;
    const carboidratos = Number(item.carbohydrate_g) || 0;
    const gorduras = Number(item.lipid_g) || 0;
    const fibras = Number(item.fiber_g) || 0;

    totalCalorias += calorias;
    totalProteinas += proteinas;
    totalCarboidratos += carboidratos;
    totalGorduras += gorduras;
    totalFibras += fibras;

    html += `<tr>
      <td>${descricaoParaExibir(item)}</td>
      <td>${calorias ? calorias.toFixed(1) : "N/A"}</td>
      <td>${proteinas ? proteinas.toFixed(1) : "N/A"}</td>
      <td>${carboidratos ? carboidratos.toFixed(1) : "N/A"}</td>
      <td>${gorduras ? gorduras.toFixed(1) : "N/A"}</td>
      <td>${fibras ? fibras.toFixed(1) : "N/A"}</td>
    </tr>`;
  });

  if (dados.length > 1) {
    html += `<tr class="total-row">
      <td><strong>Total</strong></td>
      <td><strong>${totalCalorias.toFixed(1)}</strong></td>
      <td><strong>${totalProteinas.toFixed(1)}</strong></td>
      <td><strong>${totalCarboidratos.toFixed(1)}</strong></td>
      <td><strong>${totalGorduras.toFixed(1)}</strong></td>
      <td><strong>${totalFibras.toFixed(1)}</strong></td>
    </tr>`;
  }

  html += `</tbody></table></div>`;
  document.getElementById("tabela").innerHTML = html;

  const btnReceita = document.getElementById("btnReceita");
  btnReceita.style.display = "inline-flex";
  btnReceita.classList.remove("hidden");

  const receitaSection = document.getElementById("receitaSection");
  receitaSection.style.display = "block";
  receitaSection.classList.remove("hidden");

  const nutricaoSection = document.getElementById("nutricao");
  if (nutricaoSection) {
    nutricaoSection.classList.remove("hidden");
    nutricaoSection.style.display = "block";
  }

  setTimeout(() => document.getElementById("nutricao")?.scrollIntoView({ behavior: "smooth" }), 100);
}

// ============================================================
// 🍽️ GERAR RECEITA (com fallback para API Gemini)
// ============================================================
async function gerarReceita() {
  const alimentos = (ultimaTabela.length ? ultimaTabela : alimentosSelecionados).map(a => descricaoParaExibir(a));
  if (alimentos.length === 0) { alert("Selecione alimentos primeiro!"); return; }

  const btnReceita = document.getElementById("btnReceita");
  const receitaDiv = document.getElementById("receita");

  btnReceita.disabled = true;
  btnReceita.innerHTML = "⏳ Gerando receita...";
  receitaDiv.innerHTML = `<div style="text-align:center;padding:2rem;color:#666;"><p>🍳 Preparando sua receita saudável...</p></div>`;

  // Tenta API Gemini primeiro
  try {
    const response = await fetch("http://localhost:3000/gerar-receita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alimentos }),
      signal: AbortSignal.timeout(8000)
    });
    if (response.ok) {
      const receita = await response.json();
      if (receita.nome && !receita.erro) { exibirReceita(receita); return; }
    }
  } catch (e) {
    console.log("Backend indisponível, usando receitas locais.");
  }

  // Fallback local
  const receita = buscarReceitaPorAlimentos(alimentos);
  exibirReceita(receita);
}

function exibirReceita(receita) {
  const btnReceita = document.getElementById("btnReceita");
  btnReceita.disabled = false;
  btnReceita.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg> Gerar receita saudável`;

  const ingredientesHTML = Array.isArray(receita.ingredientes)
    ? receita.ingredientes.map(i => `<li>${i}</li>`).join("")
    : `<li>${receita.ingredientes}</li>`;

  document.getElementById("receita").innerHTML = `
    <article class="recipe-card">
      <div class="recipe-header">
        <div class="recipe-header-content">
          <div class="recipe-icon">🥗</div>
          <div>
            <h3 class="recipe-title">${receita.nome}</h3>
            <p class="recipe-subtitle">${receita.ocasiao || "Refeição saudável"}</p>
          </div>
        </div>
      </div>
      <div class="recipe-body">
        <div class="recipe-meta">
          <div class="recipe-meta-item">⏱️ Tempo: ${receita.tempo || "N/D"}</div>
          <div class="recipe-meta-item">🍽️ Porções: ${receita.porcoes || "N/D"}</div>
        </div>
        <div class="recipe-section">
          <div class="recipe-section-title">Ingredientes</div>
          <ul class="recipe-list">${ingredientesHTML}</ul>
        </div>
        <div class="recipe-section">
          <div class="recipe-section-title">Modo de preparo</div>
          <p>${receita.modo_preparo}</p>
        </div>
        <div class="recipe-benefits">
          <p class="recipe-benefits-text">💚 ${receita.beneficios}</p>
        </div>
      </div>
    </article>
  `;
  setTimeout(() => document.getElementById("receitaSection")?.scrollIntoView({ behavior: "smooth" }), 100);
}

// ============================================================
// 🔎 BUSCAR RECEITA POR ALIMENTOS (melhorado)
// ============================================================
function buscarReceitaPorAlimentos(alimentos) {
  const normalizados = alimentos.map(a => normalizar(a));

  // Combos especiais
  const temArroz = normalizados.some(n => n.includes("arroz"));
  const temFeijao = normalizados.some(n => n.includes("feijao") || n.includes("feijão"));
  const temFrango = normalizados.some(n => n.includes("frango"));
  const temLegumes = normalizados.some(n =>
    n.includes("cenoura") || n.includes("abobrinha") || n.includes("brocolis") || n.includes("couve")
  );
  if (temArroz && temFeijao) return receitasPorGrupo["arroz|feijao"];
  if (temFrango && temLegumes) return receitasPorGrupo["frango|legumes"];

  // Match individual – mais específico primeiro
  const chaves = Object.keys(receitasPorAlimento).sort((a, b) => b.length - a.length);
  for (const item of normalizados) {
    for (const nome of chaves) {
      const nomeNorm = normalizar(nome);
      if (item === nomeNorm || item.startsWith(nomeNorm) || item.includes(nomeNorm)) {
        return receitasPorAlimento[nome];
      }
    }
  }

  // Receita genérica
  const primeiro = alimentos[0] || "alimento";
  return {
    nome: `Prato Saudável com ${primeiro}`,
    tempo: "20-30 minutos", porcoes: "2-3 porções",
    ingredientes: [
      `${primeiro} a gosto`,
      "Azeite de oliva",
      "Ervas frescas (salsinha, cebolinha ou manjericão)",
      "Sal e pimenta a gosto",
      "Suco de limão"
    ],
    modo_preparo: `Prepare o(a) ${primeiro} conforme preferir (grelhado, cozido ou assado). Tempere com azeite, ervas frescas e limão para realçar o sabor de forma saudável.`,
    beneficios: "Aposte sempre no preparo simples com temperos naturais. Prefira grelhar, assar ou cozinhar a vapor para preservar os nutrientes.",
    ocasiao: "Refeição saudável"
  };
}

// ============================================================
// 📱 MENU MOBILE
// ============================================================
function toggleMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const iconMenu = document.querySelector(".icon-menu");
  const iconClose = document.querySelector(".icon-close");
  if (mobileMenu.classList.contains("hidden")) {
    mobileMenu.classList.remove("hidden");
    iconMenu?.classList.add("hidden");
    iconClose?.classList.remove("hidden");
  } else {
    mobileMenu.classList.add("hidden");
    iconMenu?.classList.remove("hidden");
    iconClose?.classList.add("hidden");
  }
}

function fecharMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu?.classList.add("hidden");
  document.querySelector(".icon-menu")?.classList.remove("hidden");
  document.querySelector(".icon-close")?.classList.add("hidden");
}

// ============================================================
// 🚀 Inicialização
// ============================================================
async function init() {
  await carregarBancoDeDados();

  // Input: sugestões e Enter
  const inputElement = document.getElementById("alimentos");
  if (inputElement) {
    inputElement.addEventListener("input", buscarSugestoes);
    inputElement.addEventListener("keypress", (e) => {
      if (e.key === "Enter") { e.preventDefault(); analisar(); }
    });
  }

  // Fechar dropdown ao clicar fora
  const sugestoesContainer = document.getElementById("sugestoes");
  const searchContainer = document.querySelector(".search-container");
  if (searchContainer && sugestoesContainer) {
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        sugestoesContainer.innerHTML = "";
      }
    });
  }

  // Menu mobile
  document.getElementById("menu-toggle")?.addEventListener("click", toggleMenu);
  document.querySelectorAll(".mobile-nav-link").forEach(l => l.addEventListener("click", fecharMenu));

  // Botões "Começar Agora" - removido pois agora é Nutribot

  // Tags de sugestão popular
  document.querySelectorAll(".suggestion-tag").forEach(tag => {
    tag.style.cursor = "pointer";
    tag.addEventListener("click", () => buscarSugestaoPopular(tag.textContent.trim()));
  });

  console.log("✅ Aplicação inicializada");
}

// ============================================================
// 🤖 NUTRIBOT - Chatbot de Segurança Alimentar
// ============================================================

// Regras do chatbot (baseadas no código do anexo)
const foodKnowledge = [
  { keyword: 'mofo', type: 'perigo', message: 'A presença de mofo indica contaminação por fungos. Descarte, pois as raízes do mofo entram no alimento e geram toxinas.' },
  { keyword: 'bolor', type: 'perigo', message: 'A presença de bolor indica fungos nocivos. Descarte o alimento.' },
  { keyword: 'mofado', type: 'perigo', message: 'A presença de cheiro ou aparência mofada indica fungos. Não consuma.' },
  { keyword: 'cheiro de mofo', type: 'perigo', message: 'Cheiro de mofo é sinal de alimento contaminado por fungos. Descarte imediatamente.' },
  { keyword: 'azedo', type: 'perigo', message: 'Cheiro ou gosto azedo indica fermentação fora de controle, especialmente em carnes e laticínios.' },
  { keyword: 'cheiro azedo', type: 'perigo', message: 'O cheiro azedo é um sinal clássico de alimento estragado. Jogue fora para evitar intoxicação.' },
  { keyword: 'gosto azedo', type: 'perigo', message: 'O gosto azedo geralmente indica contaminação bacteriana ou fermentação indesejada.' },
  { keyword: 'azedo demais', type: 'perigo', message: 'Azedo demais normalmente significa contaminação. Descarte para evitar risco.' },
  { keyword: 'cheiro ruim', type: 'perigo', message: 'Cheiros ruins ou desagradáveis são sinais de decomposição. Descarte o alimento.' },
  { keyword: 'fedorento', type: 'perigo', message: 'Um odor fedorento indica que o alimento já está em decomposição. Não consuma.' },
  { keyword: 'cheiro de amônia', type: 'perigo', message: 'Cheiro de amônia em peixe ou carne é um forte sinal de deterioração. Descarte imediatamente.' },
  { keyword: 'peixe com cheiro forte', type: 'perigo', message: 'Peixe com cheiro forte ou odor de amônia está estragado. Descarte imediatamente.' },
  { keyword: 'carne marrom', type: 'perigo', message: 'Carne marrom pode indicar perda de frescor e início de decomposição. Não consuma.' },
  { keyword: 'carne escura', type: 'perigo', message: 'Carne com coloração escura demais geralmente não está mais boa. Prefira descartar.' },
  { keyword: 'meio escuro', type: 'alerta', message: '“Meio escuro” pode ser sinal de início de deterioração. Alguns alimentos escuros são normais, mas se houver cheiro ruim ou textura mole, descarte.' },
  { keyword: 'meia escura', type: 'alerta', message: '“Meia escura” indica aparência duvidosa. Se o alimento for naturalmente escuro, confie no cheiro e na textura antes de julgar.' },
  { keyword: 'escuro demais', type: 'alerta', message: 'Escuro demais pode ser um sinal de estrago, mas nem sempre. Verifique cheiro, textura e validade antes de descartar.' },
  { keyword: 'escura demais', type: 'alerta', message: 'Escura demais pode indicar deterioração. Em alimentos naturalmente escuros, confirme cheiro e textura primeiro.' },
  { keyword: 'carne com cheiro forte', type: 'perigo', message: 'Carne com cheiro forte ou desagradável é sinal de deterioração. Descarte.' },
  { keyword: 'manchas brancas na carne', type: 'perigo', message: 'Manchas brancas na carne podem indicar microrganismos ou contaminação. Evite consumir.' },
  { keyword: 'manchas brancas no frango', type: 'perigo', message: 'Manchas brancas no frango sugerem possível contaminação ou deterioração. Descarte o alimento.' },
  { keyword: 'carne com manchas brancas', type: 'perigo', message: 'Carne com manchas brancas não é normal e deve ser descartada.' },
  { keyword: 'arroz babando', type: 'alerta', message: 'Arroz babando nem sempre significa estrago. Verifique cheiro e bolor: se estiver normal, pode ser apenas empapado.' },
  { keyword: 'arroz empapado', type: 'alerta', message: 'Arroz empapado geralmente não está estragado. Se o cheiro e a aparência estiverem normais, pode ser reaquecer e consumir.' },
  { keyword: 'arroz grudento', type: 'alerta', message: 'Arroz grudento pode ser apenas armazenamento úmido. Verifique odor e bolor antes de descartar.' },
  { keyword: 'arroz grudado', type: 'alerta', message: 'Arroz grudado pode estar apenas empapado. Confirme cheiro e bolor antes de decidir descartar.' },
  { keyword: 'arroz molhado depois de um dia', type: 'alerta', message: 'Arroz ainda molhado após um dia merece atenção. Se não houver cheiro ruim, aqueça bem ou descarte para evitar risco.' },
  { keyword: 'ácido', type: 'perigo', message: 'Cheiro ácido em carne ou leite geralmente indica contaminação e fermentação indesejada.' },
  { keyword: 'fermentado', type: 'perigo', message: 'Fermentação fora de controle pode gerar toxinas. Se o alimento não for fermentado intencionalmente, descarte.' },
  { keyword: 'fruta mole', type: 'perigo', message: 'Fruta mole e encharcada costuma estar estragada. Descarte especialmente se houver cheiro ruim.' },
  { keyword: 'fruta murcha', type: 'perigo', message: 'Fruta murcha e com ateros indicam perda de qualidade e possíveis fungos.' },
  { keyword: 'polpa mole', type: 'perigo', message: 'Polpa mole ou encharcada em frutas indica decomposição. Não consuma.' },
  { keyword: 'aroma metálico', type: 'perigo', message: 'Aroma metálico ou químico em alimentos é sinal de deterioração. Descarte.' },
  { keyword: 'sabor rançoso', type: 'perigo', message: 'Sabor rançoso indica que gorduras do alimento estão oxidadas. Descarte para evitar mal-estar.' },
  { keyword: 'leite coalhado', type: 'perigo', message: 'Leite coalhado ou com textura granulada indica deterioração. Não consuma.' },
  { keyword: 'iogurte com bolor', type: 'perigo', message: 'Iogurte com bolor é claramente estragado. Descarte o pote.' },
  { keyword: 'queijo com bolor', type: 'perigo', message: 'Bolor em queijo que não é tipo moldado indica contaminação e deve ser descartado.' },
  { keyword: 'leite com cheiro ruim', type: 'perigo', message: 'Leite com cheiro ruim ou azedo está estragado. Descarte.' },
  { keyword: 'ovo com cheiro ruim', type: 'perigo', message: 'O cheiro ruim em ovos geralmente indica decomposição. Descarte-os.' },
  { keyword: 'viscoso', type: 'perigo', message: 'Textura viscosa ou "limosa" indica crescimento bacteriano. Descarte imediatamente.' },
  { keyword: 'pegajoso', type: 'perigo', message: 'Textura pegajosa pode ser sinal de bactéria ou decomposição. Não consuma.' },
  { keyword: 'banana preta', type: 'perigo', message: 'Bananas muito pretas ou escuras provavelmente passaram do ponto e podem estar fermentando. Prefira descartar se o cheiro também estiver ruim.' },
  { keyword: 'banana escura', type: 'perigo', message: 'Banana escura demais pode estar em decomposição interna. Não arrisque o consumo se houver cheiro ruim.' },
  { keyword: 'banana com manchas', type: 'perigo', message: 'Manchas escuras ou preta em banana podem indicar podridão ou fermentação.' },
  { keyword: 'morango verde', type: 'perigo', message: 'Morangos verdes ou com manchas verdes podem estar estragados ou começando a apodrecer. Descarte se tiverem cheiro ruim.' },
  { keyword: 'morango com mancha verde', type: 'perigo', message: 'Manchas verdes em morango indicam decomposição ou mofo. Não consuma.' },
  { keyword: 'morango com bolor', type: 'perigo', message: 'Bolor em morango é sinal claro de contaminação. Descarte o fruto.' },
  { keyword: 'maracujá verde', type: 'perigo', message: 'Maracujás verdes ou com aparência estranha podem não estar maduros ou podem estar deteriorados.' },
  { keyword: 'verde', type: 'perigo', message: 'Manchas verdes ou escuras são sinal de mofo ou putrefação. Jogue fora.' },
  { keyword: 'vermelho escuro', type: 'perigo', message: 'Cor escura em carnes frescas pode indicar decomposição. Não consuma.' },
  { keyword: 'fruta podre', type: 'perigo', message: 'Fruta podre geralmente tem textura mole, cheiro desagradável e deve ser descartada.' },
  { keyword: 'podre', type: 'perigo', message: 'O alimento está em decomposição avançada. Risco alto de intoxicação alimentar. Jogue fora.' },
  { keyword: 'perto de estragar', type: 'alerta', message: 'Quando o alimento está perto de estragar, vale conferir cheiro, cor e textura: se houver dúvida, descarte para não correr risco.' },
  { keyword: 'quase estragado', type: 'alerta', message: '“Quase estragado” indica que o alimento já pode estar em fase final de deterioração. Prefira descartar se não estiver bem conservado.' },
  { keyword: 'aparência duvidosa', type: 'alerta', message: 'Aparência duvidosa é um sinal de alerta. Verifique cheiro, textura e validade; se ainda houver dúvida, descarte.' },
  { keyword: 'aparencia duvidosa', type: 'alerta', message: 'Aparência duvidosa é um sinal de alerta. Verifique cheiro, textura e validade; se ainda houver dúvida, descarte.' },
  { keyword: 'duvidosa', type: 'alerta', message: 'Se a aparência do alimento é duvidosa, explore cheiro, textura e validade antes de consumir. Na dúvida, jogue fora.' },
  { keyword: 'abobrinha perto de estragar', type: 'perigo', message: 'Abobrinha perto de estragar ou com aparência duvidosa pode estar começando a decompor. Se houver manchas, textura mole ou cheiro estranho, descarte.' },
  { keyword: 'abobrinha com aparência duvidosa', type: 'perigo', message: 'Abobrinha com aparência duvidosa merece cautela. Quando a superfície estiver mole, escura, com manchas ou cheiro estranho, o mais seguro é descartar.' },
  { keyword: 'vencido', type: 'alerta', message: 'O alimento está fora da validade. Verifique a aparência e cheiro. Se for carne, leite ou ovos, descarte imediatamente.' },
  { keyword: 'estragado', type: 'perigo', message: 'Se o alimento parece estragado, não arrisque. O melhor é descartar imediatamente.' },
  { keyword: 'larva', type: 'perigo', message: 'A presença de larvas indica contaminação por moscas/insetos. Descarte imediatamente e limpe o local.' },
  { keyword: 'off', type: 'perigo', message: 'Se o alimento está “off”, ele pode ter ido para trás. Descarte para evitar intoxicação.' },
  { keyword: 'cheiro normal', type: 'seguro', message: 'O alimento apresenta cheiro normal e fresco, o que é um bom sinal para consumo.' },
  { keyword: 'sem cheiro ruim', type: 'seguro', message: 'Se não há cheiro ruim ou azedo, o alimento tende a estar em boas condições.' },
  { keyword: 'carne vermelha', type: 'seguro', message: 'Carne vermelha fresca com cheiro normal e aparência firme geralmente está boa para consumo.' },
  { keyword: 'carne vermelha fresca', type: 'seguro', message: 'Carne vermelha fresca e com cheiro normal é um alimento seguro e nutritivo quando bem conservado.' },
  { keyword: 'carne vermelha com cheiro normal', type: 'seguro', message: 'Carne vermelha com cheiro normal e suave não apresenta sinais de deterioração.' },
  { keyword: 'frango com cheiro normal', type: 'seguro', message: 'Frango com cheiro neutro e superfície firme é um bom indicativo de frescor.' },
  { keyword: 'peixe fresco', type: 'seguro', message: 'Peixe fresco com cheiro suave e carne firme é seguro para consumo.' },
  { keyword: 'peixe com cheiro suave', type: 'seguro', message: 'Peixe com cheiro suave e não amoniacal indica frescor.' },
  { keyword: 'fruta madura', type: 'seguro', message: 'Fruta madura com aparência brilhante e cheiro agradável costuma estar pronta para consumo.' },
  { keyword: 'fruta com casca enrugada', type: 'seguro', message: 'Frutas com casca enrugada podem ainda estar boas, desde que não tenham mofo ou cheiro ruim.' },
  { keyword: 'banana com pontas escuras', type: 'seguro', message: 'Banana com pontas escuras ainda pode ser consumida se a polpa estiver firme e sem cheiro azedo.' },
  { keyword: 'tomate com pintas', type: 'seguro', message: 'Tomate com pequenas pintas na casca pode ser normal, desde que não haja bolor.' },
  { keyword: 'maçã com mancha', type: 'seguro', message: 'Maçã com pequena mancha superficial ainda pode ser consumida se a polpa estiver crocante.' },
  { keyword: 'legumes firmes', type: 'seguro', message: 'Legumes firmes e crocantes em geral estão frescos e prontos para consumo.' },
  { keyword: 'iogurte natural', type: 'seguro', message: 'Iogurte natural sem bolor ou cheiro forte é seguro e saudável.' },
  { keyword: 'queijo cremoso', type: 'seguro', message: 'Queijo cremoso com superfície limpa e cheiro leve é um produto normal e nutritivo.' },
  { keyword: 'pão com casca dura', type: 'seguro', message: 'Pão com casca dourada e textura firme pode estar fresco e bem assado.' },
  { keyword: 'arroz soltinho', type: 'seguro', message: 'Arroz soltinho e sem cheiro estranho indica bom preparo e conservação.' },
  { keyword: 'textura firme', type: 'seguro', message: 'Textura firme e sem manchas escuras geralmente é um sinal de alimento saudável.' },
  { keyword: 'cor natural', type: 'seguro', message: 'Cor natural e uniforme indica que o alimento está em boas condições.' },
  { keyword: 'cheiro fresco', type: 'seguro', message: 'Cheiro fresco é um bom indicativo de alimento saudável e seguro.' },
  { keyword: 'sem odor forte', type: 'seguro', message: 'Sem odor forte ou desagradável, o alimento tende a ser seguro para consumo.' },
  { keyword: 'aparência normal', type: 'seguro', message: 'Aparência normal e sem sinais de decomposição indica que o alimento está em bom estado.' },
  { keyword: 'boa aparência', type: 'seguro', message: 'Boa aparência do alimento geralmente significa que ele está saudável e pronto para consumo.' },
  { keyword: 'normal', type: 'seguro', message: 'Se a aparência, cheiro e textura estão normais e na validade, o consumo parece ser seguro.' }
];

let sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

// Função para desenhar a mensagem na tela
function addMessage(text, sender) {
  const messagesContainer = document.getElementById('chatbot-messages');
  const msgDiv = document.createElement('div');
  if (sender === 'bot') {
    msgDiv.style.cssText = "background-color: var(--secondary); color: var(--foreground); padding: 10px; border-radius: var(--radius); align-self: flex-start; max-width: 85%; font-family: var(--font-sans);";
  } else {
    msgDiv.style.cssText = "background-color: var(--primary); color: white; padding: 10px; border-radius: var(--radius); align-self: flex-end; max-width: 85%; text-align: right; font-family: var(--font-sans);";
  }
  msgDiv.innerHTML = text;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================================
// 🎛️ CONTROLE DO BOTÃO ANALISAR
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  const inputAlimentos = document.getElementById('alimentos');
  const btnAnalisar = document.querySelector('.btn-analyze');
  const tagsContainer = document.getElementById('tags');

  function toggleBtnAnalisar() {
    const hasInput = inputAlimentos.value.trim().length > 0;
    const hasTags = tagsContainer.children.length > 0;
    if (hasInput || hasTags) {
      btnAnalisar.style.display = 'inline-flex';
    } else {
      btnAnalisar.style.display = 'none';
    }
  }

  // Esconder inicialmente
  btnAnalisar.style.display = 'none';

  // Event listeners
  inputAlimentos.addEventListener('input', toggleBtnAnalisar);
  inputAlimentos.addEventListener('keyup', toggleBtnAnalisar);

  // Observar mudanças nos tags
  const observer = new MutationObserver(toggleBtnAnalisar);
  observer.observe(tagsContainer, { childList: true });
});

// Função que processa a mensagem do usuário
function handleSend() {
  const inputField = document.getElementById('chatbot-input');
  const text = inputField.value.trim();
  if (!text) return;

  // Mostra a mensagem do usuário
  addMessage(text, 'user');
  inputField.value = '';

  // Mensagem temporária de "Analisando..."
  const loadingId = "loading-" + Date.now();
  addMessage("<em id='"+loadingId+"'>Analisando alimento...</em>", 'bot');

  // Simula processamento (pode ser substituído por chamada de API)
  setTimeout(() => {
    document.getElementById(loadingId).parentNode.remove();
    const reply = processMessage(text);
    addMessage(reply, 'bot');
  }, 1000); // Simula delay de 1 segundo
}

// Lógica para processar a mensagem
function processMessage(message) {
  const normalizedMessage = normalizar(message.toLowerCase());
  const isFoodContext = isFoodRelated(normalizedMessage);
  let botResponse = "";
  let isDanger = false;
  let matchedRules = [];

  if (!isFoodContext) {
    return "⚠️ Meu foco é apenas segurança e orientação sobre alimentos. Por favor, me fale sobre um alimento, descrevendo cor, cheiro, textura ou validade.";
  }

  // Cruza a mensagem com o banco de conhecimento usando normalização
  foodKnowledge.forEach(rule => {
    if (ruleMatchesMessage(rule.keyword, normalizedMessage)) {
      if (!matchedRules.includes(rule.message)) {
        matchedRules.push(rule.message);
      }
      if (rule.type === 'perigo') isDanger = true;
    }
  });

  // Construindo a resposta
  if (matchedRules.length > 0) {
    botResponse = (isDanger ? "🚨 <strong>Alerta:</strong> " : "✅ <strong>Análise:</strong> ") + matchedRules.join(" ");
  } else {
    const foodSpoilageResponse = getFoodSpoilageResponse(normalizedMessage);
    if (foodSpoilageResponse) {
      return foodSpoilageResponse;
    }
    if (normalizedMessage.length < 15) {
      botResponse = "Pode me dar mais detalhes? Preciso saber sobre a cor, cheiro, textura e a validade do alimento.";
    } else {
      botResponse = "Não encontrei essas características no meu banco de dados. Na dúvida sobre a segurança de um alimento, a regra de ouro é: <strong>jogue fora</strong>.";
    }
  }

  return botResponse;
}

// Inicialização do chatbot
function createNutribotWidget() {
  if (document.getElementById('nutribot-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'nutribot-overlay';
  overlay.className = 'nutribot-overlay hidden';
  overlay.innerHTML = `
    <div class="nutribot-panel">
      <div class="nutribot-header">
        <div class="nutribot-title">
          <span>NutriBot</span>
          <small>Segurança alimentar</small>
        </div>
        <button type="button" class="nutribot-toggle" aria-label="Minimizar ou abrir NutriBot">✕</button>
      </div>
      <div class="nutribot-body">
        <div id="chatbot-messages" class="nutribot-messages"></div>
        <div class="nutribot-input-area">
          <input id="chatbot-input" type="text" placeholder="Descreva o alimento..." autocomplete="off">
          <button id="chatbot-send" type="button">Enviar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('.nutribot-toggle')?.addEventListener('click', toggleNutribotWidget);
}

function initChatbot() {
  createNutribotWidget();

  const sendButton = document.getElementById('chatbot-send');
  const inputField = document.getElementById('chatbot-input');

  if (sendButton && inputField) {
    sendButton.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    if (!document.getElementById('nutribot-overlay')?.classList.contains('open')) {
      addMessage("Olá! Sou o Nutribot, especialista em segurança alimentar. Me descreva a aparência, cheiro e textura do alimento e verificarei no meu sistema se é seguro. Não respondo dúvidas fora do tema alimentação.", 'bot');
    }
  }
}

function openNutribotWidget() {
  let overlay = document.getElementById('nutribot-overlay');
  if (!overlay) {
    createNutribotWidget();
    overlay = document.getElementById('nutribot-overlay');
  }
  overlay.classList.remove('hidden', 'minimized');
  overlay.classList.add('open');
  document.getElementById('chatbot-input')?.focus();
}

function closeNutribotWidget() {
  const overlay = document.getElementById('nutribot-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.classList.remove('open', 'minimized');
}

function toggleNutribotWidget() {
  const overlay = document.getElementById('nutribot-overlay');
  if (!overlay || overlay.classList.contains('hidden')) {
    openNutribotWidget();
    return;
  }

  if (overlay.classList.contains('open')) {
    closeNutribotWidget();
  } else {
    openNutribotWidget();
  }
}

function goToNutribot() {
  toggleNutribotWidget();
}

// Adicionar event listeners para os botões Nutribot
document.addEventListener('DOMContentLoaded', () => {
  init();
  initChatbot();

  const nutribotBtn = document.getElementById('nutribot-btn');
  const nutribotBtnMobile = document.getElementById('nutribot-btn-mobile');

  if (nutribotBtn) {
    nutribotBtn.addEventListener('click', goToNutribot);
  }
  if (nutribotBtnMobile) {
    nutribotBtnMobile.addEventListener('click', goToNutribot);
  }
});
