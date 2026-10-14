export interface SyllabusChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subject: 'Mathematics' | 'EVS' | 'English' | 'Hindi';
  coreConcepts: string[];
  learningOutcomes: string;
  keywords: string[];
}

export interface BoardCurriculum {
  board: string;
  state: string;
  classGrade: string;
  medium: string;
  academicYear: string;
  verificationStatus: 'Verified & Active' | 'Pending Verification';
  subjects: {
    [key: string]: {
      subjectName: string;
      totalChapters: number;
      chapters: SyllabusChapter[];
    };
  };
}

export const RBSE_CLASS_4_ENGLISH_MEDIUM: BoardCurriculum = {
  board: 'RBSE (Rajasthan Board of Secondary Education)',
  state: 'Rajasthan',
  classGrade: 'Class 4th',
  medium: 'English Medium',
  academicYear: '2024-2025 / 2025-2026',
  verificationStatus: 'Verified & Active',
  subjects: {
    mathematics: {
      subjectName: 'Mathematics (Math-Magic / Ganit)',
      totalChapters: 14,
      chapters: [
        {
          id: 'rbse-m-1',
          chapterNumber: 1,
          title: 'Building with Bricks',
          subject: 'Mathematics',
          coreConcepts: ['Brick patterns', '2D and 3D shapes', 'Arches and Jharokhas', 'Counting in hundreds and thousands'],
          learningOutcomes: 'Students learn spatial reasoning, face calculation of bricks, and Rajasthani architectural patterns.',
          keywords: ['brick', 'pattern', 'face', 'edge', 'arch', 'jharokha'],
        },
        {
          id: 'rbse-m-2',
          chapterNumber: 2,
          title: 'Long and Short',
          subject: 'Mathematics',
          coreConcepts: ['Measurement of length', 'Centimetre (cm)', 'Metre (m)', 'Kilometre (km)', 'Conversion of units'],
          learningOutcomes: 'Understand distance estimation and conversions: 1m = 100cm, 1km = 1000m.',
          keywords: ['length', 'height', 'distance', 'centimetre', 'metre', 'kilometre'],
        },
        {
          id: 'rbse-m-3',
          chapterNumber: 3,
          title: 'A Trip to Bhopal & Rajasthan',
          subject: 'Mathematics',
          coreConcepts: ['Addition and Subtraction word problems', 'Estimation', 'Time calculation', 'Bus fare and fuel rates'],
          learningOutcomes: 'Apply mental math in real-life travel situations like ticket costs and distance covered.',
          keywords: ['travel', 'bus', 'fare', 'diesel', 'addition', 'subtraction'],
        },
        {
          id: 'rbse-m-4',
          chapterNumber: 4,
          title: 'Tick-Tick-Tick',
          subject: 'Mathematics',
          coreConcepts: ['Reading analog clocks', 'Minutes and hours', 'AM vs PM', '24-hour clock', 'Calendar dates'],
          learningOutcomes: 'Calculate elapsed time, read train/bus timetables, and compute date intervals.',
          keywords: ['clock', 'time', 'hour', 'minute', 'calendar', 'date', '24-hour'],
        },
        {
          id: 'rbse-m-5',
          chapterNumber: 5,
          title: 'The Way the World Looks',
          subject: 'Mathematics',
          coreConcepts: ['Top view, Front view, Side view', 'Route maps', 'Scale mapping', 'Spatial perspective'],
          learningOutcomes: 'Recognize objects from different viewpoints and read classroom or town floor-maps.',
          keywords: ['view', 'top view', 'map', 'perspective', 'direction'],
        },
        {
          id: 'rbse-m-6',
          chapterNumber: 6,
          title: 'The Junk Seller',
          subject: 'Mathematics',
          coreConcepts: ['Indian currency (Rupees & Paise)', 'Multiplication techniques', 'Loan calculation', 'Profit/Loss'],
          learningOutcomes: 'Calculate cash transactions, rate per kg, and total bill preparation.',
          keywords: ['money', 'rupees', 'paise', 'rate', 'multiplication', 'loan', 'bill'],
        },
        {
          id: 'rbse-m-7',
          chapterNumber: 7,
          title: 'Jugs and Mugs',
          subject: 'Mathematics',
          coreConcepts: ['Capacity and Liquid Volume', 'Litres (L)', 'Millilitres (mL)', '1L = 1000mL', 'Volume estimation'],
          learningOutcomes: 'Estimate and measure volume of water, milk, and medical syrup doses.',
          keywords: ['liquid', 'capacity', 'litre', 'millilitre', 'volume', 'jug', 'mug'],
        },
        {
          id: 'rbse-m-8',
          chapterNumber: 8,
          title: 'Carts and Wheels',
          subject: 'Mathematics',
          coreConcepts: ['Circles', 'Center point', 'Radius', 'Diameter', 'Drawing round shapes using string or compass'],
          learningOutcomes: 'Identify circular objects in daily life and understand radius relationship to circle size.',
          keywords: ['circle', 'radius', 'wheel', 'diameter', 'compass', 'center'],
        },
        {
          id: 'rbse-m-9',
          chapterNumber: 9,
          title: 'Halves and Quarters',
          subject: 'Mathematics',
          coreConcepts: ['Fraction basics: 1/2, 1/4, 3/4', 'Equal sharing of chapati/cake', 'Equivalent fractions', 'Word problems'],
          learningOutcomes: 'Understand equal division of wholes and calculation of fractional quantities.',
          keywords: ['fraction', 'half', 'quarter', 'three-fourths', 'equal parts', 'denominator', 'numerator'],
        },
        {
          id: 'rbse-m-10',
          chapterNumber: 10,
          title: 'Play with Patterns',
          subject: 'Mathematics',
          coreConcepts: ['Number patterns', 'Shape symmetry', 'Tiling and tessellation', 'Magic squares', 'Secret messages'],
          learningOutcomes: 'Detect geometric rules in sequence patterns and develop logical thinking.',
          keywords: ['pattern', 'sequence', 'symmetry', 'tiling', 'rule', 'magic square'],
        },
        {
          id: 'rbse-m-11',
          chapterNumber: 11,
          title: 'Tables and Shares',
          subject: 'Mathematics',
          coreConcepts: ['Multiplication tables up to 20', 'Division as repeated subtraction', 'Equal sharing and remainders'],
          learningOutcomes: 'Divide 2-digit numbers by 1-digit numbers and solve equal distribution problems.',
          keywords: ['table', 'multiplication', 'division', 'share', 'quotient', 'remainder'],
        },
        {
          id: 'rbse-m-12',
          chapterNumber: 12,
          title: 'How Heavy? How Light?',
          subject: 'Mathematics',
          coreConcepts: ['Weight measurement', 'Gram (g)', 'Kilogram (kg)', '1kg = 1000g', 'Pan balance beam'],
          learningOutcomes: 'Compare weights, use balance scales, and calculate grocery weights accurately.',
          keywords: ['weight', 'gram', 'kilogram', 'balance', 'heavy', 'light'],
        },
        {
          id: 'rbse-m-13',
          chapterNumber: 13,
          title: 'Fields and Fences',
          subject: 'Mathematics',
          coreConcepts: ['Perimeter of shapes', 'Boundary calculation of farms and fields', 'Area using square grid counting'],
          learningOutcomes: 'Calculate total fence wire needed by adding lengths of all sides of polygons.',
          keywords: ['perimeter', 'boundary', 'fence', 'length of sides', 'field', 'grid'],
        },
        {
          id: 'rbse-m-14',
          chapterNumber: 14,
          title: 'Smart Charts',
          subject: 'Mathematics',
          coreConcepts: ['Data representation', 'Tally marks (||||)', 'Bar charts', 'Chapati charts (pie charts)'],
          learningOutcomes: 'Record real-world observations and interpret pictographs and bar graphs.',
          keywords: ['chart', 'data', 'tally mark', 'pictograph', 'bar graph'],
        },
      ],
    },
    evs: {
      subjectName: 'Environmental Studies (Looking Around / Apana Parivesh)',
      totalChapters: 27,
      chapters: [
        {
          id: 'rbse-e-1',
          chapterNumber: 1,
          title: 'Going to School',
          subject: 'EVS',
          coreConcepts: ['Camel cart in Rajasthan Thar desert', 'Bamboo bridge in Assam', 'Vallam boat in Kerala'],
          learningOutcomes: 'Understand geographical diversity and how children travel to school across different terrains.',
          keywords: ['camel cart', 'desert', 'bridge', 'trolley', 'school', 'rajasthan'],
        },
        {
          id: 'rbse-e-4',
          chapterNumber: 4,
          title: 'The Story of Amrita',
          subject: 'EVS',
          coreConcepts: [
            'Bishnoi community of Khejarli village near Jodhpur, Rajasthan',
            'Sacrifice of Amrita Devi and 363 Bishnois to protect Khejri trees from Maharaja soldiers',
            'Khejri is Rajasthan state tree: drought resistant, medicinal bark, nutritious beans (Sangri)',
          ],
          learningOutcomes: 'Appreciate nature conservation, forest protection, and Rajasthan historical environmental heritage.',
          keywords: ['amrita', 'khejarli', 'jodhpur', 'rajasthan', 'bishnoi', 'khejri tree', 'sangri', 'forest'],
        },
        {
          id: 'rbse-e-5',
          chapterNumber: 5,
          title: 'Anita and the Honeybees',
          subject: 'EVS',
          coreConcepts: ['Girl child education (Right to Education)', 'Bee-keeping cycle (October to December breeding)'],
          learningOutcomes: 'Learn about social empowerment and life cycle of queen bee, worker bee, and honey collection.',
          keywords: ['anita', 'honeybee', 'queen bee', 'nectar', 'education', 'beekeeping'],
        },
        {
          id: 'rbse-e-18',
          chapterNumber: 18,
          title: 'Too Much Water, Too Little Water',
          subject: 'EVS',
          coreConcepts: ['Water scarcity in arid regions', 'Water-borne diseases (Diarrhoea, Cholera)', 'Making ORS at home'],
          learningOutcomes: 'Learn ORS recipe (boiled water + pinch of salt + spoon of sugar) and water conservation techniques.',
          keywords: ['water', 'ors', 'clean water', 'scarcity', 'dehydration', 'conservation'],
        },
        {
          id: 'rbse-e-25',
          chapterNumber: 25,
          title: 'Spicy Riddles',
          subject: 'EVS',
          coreConcepts: ['Spices of India & Rajasthan', 'Clove for toothache', 'Turmeric for wounds', 'Cumin & Cardamom aroma'],
          learningOutcomes: 'Identify kitchen spices by aroma, taste, and traditional Ayurvedic medicinal benefits.',
          keywords: ['spice', 'clove', 'turmeric', 'cumin', 'cardamom', 'ayurveda'],
        },
      ],
    },
    english: {
      subjectName: 'English (Lets Learn English / Marigold)',
      totalChapters: 10,
      chapters: [
        {
          id: 'rbse-eng-1',
          chapterNumber: 1,
          title: 'A Boy with a Wish',
          subject: 'English',
          coreConcepts: ['Courage and persistence', 'Vocabulary building', 'Reading comprehension'],
          learningOutcomes: 'Develop reading fluency and positive attitude towards overcoming difficulties.',
          keywords: ['boy', 'wish', 'courage', 'dreams', 'hard work'],
        },
        {
          id: 'rbse-eng-3',
          chapterNumber: 3,
          title: 'A Brave Tribal Girl',
          subject: 'English',
          coreConcepts: ['Bravery of Seema', 'Courage in facing wild animals in Aravali hills', 'Story sequencing'],
          learningOutcomes: 'Learn descriptive adjectives and narrative writing.',
          keywords: ['brave', 'tribal', 'forest', 'courage', 'story'],
        },
        {
          id: 'rbse-eng-10',
          chapterNumber: 10,
          title: 'Festivals of Rajasthan',
          subject: 'English',
          coreConcepts: ['Desert Festival Jaisalmer', 'Teej and Gangaur', 'Pushkar Camel Fair', 'Cultural vocabulary'],
          learningOutcomes: 'Describe cultural celebrations in English using festive vocabulary.',
          keywords: ['rajasthan', 'teej', 'gangaur', 'pushkar', 'jaisalmer', 'festival'],
        },
      ],
    },
  },
};

/**
 * Helper to match query against RBSE Class 4 syllabus chapters
 */
export function matchRbseClass4Syllabus(query: string, subjectHint?: string) {
  const q = query.toLowerCase();
  const allChapters: SyllabusChapter[] = [];

  Object.values(RBSE_CLASS_4_ENGLISH_MEDIUM.subjects).forEach((sub) => {
    allChapters.push(...sub.chapters);
  });

  // 1. Direct keyword match
  for (const chap of allChapters) {
    if (subjectHint && chap.subject.toLowerCase() !== subjectHint.toLowerCase()) {
      continue;
    }
    const hasMatch = chap.keywords.some((k) => q.includes(k.toLowerCase())) ||
      chap.title.toLowerCase().includes(q) ||
      chap.coreConcepts.some((c) => q.includes(c.toLowerCase().slice(0, 8)));

    if (hasMatch) {
      return {
        matched: true,
        chapter: chap,
        board: RBSE_CLASS_4_ENGLISH_MEDIUM.board,
        classGrade: RBSE_CLASS_4_ENGLISH_MEDIUM.classGrade,
        medium: RBSE_CLASS_4_ENGLISH_MEDIUM.medium,
        contextText: `RBSE Rajasthan Board Class 4th (English Medium) - ${chap.subject} Chapter ${chap.chapterNumber}: "${chap.title}". Key concepts: ${chap.coreConcepts.join(', ')}.`,
      };
    }
  }

  // Default fallback to Class 4 Math Chapter 9 (Fractions) if generic math
  if (q.includes('fraction') || q.includes('/') || q.includes('plus') || q.includes('+')) {
    const fracChap = RBSE_CLASS_4_ENGLISH_MEDIUM.subjects.mathematics.chapters.find((c) => c.chapterNumber === 9);
    if (fracChap) {
      return {
        matched: true,
        chapter: fracChap,
        board: RBSE_CLASS_4_ENGLISH_MEDIUM.board,
        classGrade: RBSE_CLASS_4_ENGLISH_MEDIUM.classGrade,
        medium: RBSE_CLASS_4_ENGLISH_MEDIUM.medium,
        contextText: `RBSE Rajasthan Board Class 4th (English Medium) - Mathematics Chapter 9: "Halves and Quarters". Core concepts: Fraction basics (1/2, 1/4, 3/4), equal sharing, equivalent fractions.`,
      };
    }
  }

  return {
    matched: false,
    board: RBSE_CLASS_4_ENGLISH_MEDIUM.board,
    classGrade: RBSE_CLASS_4_ENGLISH_MEDIUM.classGrade,
    medium: RBSE_CLASS_4_ENGLISH_MEDIUM.medium,
    contextText: `RBSE Rajasthan Board Class 4th (English Medium) standard curriculum.`,
  };
}
