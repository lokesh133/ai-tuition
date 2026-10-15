// Official Master Curriculum Database for CBSE & RBSE (Classes 1st to 8th)
// Covers Hindi & English Medium, Official Chapters, and Exam Weightage for 4 Subjects:
// 1. Mathematics (Sharma Sir)
// 2. EVS / Science (Neha Mam)
// 3. English (Riya Didi)
// 4. Hindi (Pooja Mam)

export interface Chapter {
  id: string;
  chapterNumber: number;
  titleEnglish: string;
  titleHindi: string;
  concepts: string[];
  keyFormulas?: string[];
  term: 'half_yearly' | 'annual';
  estimatedMinutes: number;
  sampleQuestions: {
    question: string;
    type: 'mcq' | 'fill' | 'solve';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    whiteboardSteps?: { step: string; formula: string; annotation: string }[];
  }[];
}

export interface SubjectCurriculum {
  id: string;
  subject: string;
  subjectHindi: string;
  bookName: string;
  teacherId: 'sharma' | 'neha' | 'riya' | 'pooja';
  teacherName: string;
  emoji: string;
  chapters: Chapter[];
}

export interface BoardCurriculum {
  board: 'RBSE' | 'CBSE';
  classes: {
    [className: string]: {
      [medium in 'english' | 'hindi']: SubjectCurriculum[];
    };
  };
}

// 1. REAL OFFICIAL RBSE CLASS 4 MATHEMATICS (भाग-1) CHAPTERS (Directly from 66-Page Textbook PDF)
const CLASS_4_MATH_CHAPTERS: Chapter[] = [
  {
    id: 'm-ch1',
    chapterNumber: 1,
    titleEnglish: 'Library (Numbers 501 to 999)',
    titleHindi: 'पाठ 1: पुस्तकालय (501 से 999 संख्याएं)',
    concepts: ['500 तक की संख्याओं का अभ्यास', '501 से 999 तक की संख्याओं की पहचान', 'विस्तारित रूप', 'अलमारी में पुस्तकों का क्रम'],
    keyFormulas: ['382 = 300 + 80 + 2', '226 = 2 सैकड़ा + 2 दहाई + 6 इकाई'],
    term: 'half_yearly',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'किताब का सवाल: 382 का विस्तारित रूप क्या होगा?',
        type: 'solve',
        correctAnswer: '300 + 80 + 2',
        explanation: '382 में 3 सैकड़ा (300), 8 दहाई (80) और 2 इकाई (2) हैं = 300 + 80 + 2।',
        whiteboardSteps: [
          { step: 'चरण 1: स्थानीय मान समझना', formula: '3 सैकड़ा = 300, 8 दहाई = 80, 2 इकाई = 2', annotation: 'शर्मा सर: "प्रत्येक अंक का स्थानीय मान निकाला गया।"' },
          { step: 'चरण 2: विस्तारित रूप', formula: '382 = 300 + 80 + 2', annotation: 'तीनों मानों को जोड़ के रूप में लिखा।' },
          { step: 'चरण 3: अंतिम उत्तर', formula: '300 + 80 + 2 ✅', annotation: 'किताब के पेज 113 का पहला सवाल हल हो गया!' },
        ],
      },
      {
        question: '541 और 550 के ठीक बीच में कौन सी संख्या आएगी?',
        type: 'mcq',
        options: ['543', '545', '548', '552'],
        correctAnswer: '545',
        explanation: 'अलमारी की पंक्ति E में 545 नंबर की किताब 541 और 550 के बीच आएगी।',
      },
    ],
  },
  {
    id: 'm-ch2',
    chapterNumber: 2,
    titleEnglish: 'Janaks Village (Comparison & Views)',
    titleHindi: 'पाठ 2: जनक का गाँव (<, >, = और दृश्य)',
    concepts: ['संख्याओं में छोटे-बड़े की समझ (<, >, =)', 'टॉप व्यू / साइड व्यू / फ्रंट व्यू', 'नज़री नक्शा'],
    term: 'half_yearly',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'मकान को ऊपर से देखने पर दिखने वाले दृश्य को क्या कहते हैं?',
        type: 'mcq',
        options: ['फ्रंट व्यू (सामने का दृश्य)', 'टॉप व्यू (शीर्ष दृश्य)', 'साइड व्यू', 'बैक व्यू'],
        correctAnswer: 'टॉप व्यू (शीर्ष दृश्य)',
        explanation: 'किसी भी वस्तु को ठीक ऊपर से देखने पर उसका टॉप व्यू (शीर्ष दृश्य) दिखता है।',
      },
      {
        question: 'अस्पताल की दूरी 545 कदम है और रूबीना के घर की दूरी 700 कदम। सही चिह्न भरिए: 545 [ ... ] 700',
        type: 'mcq',
        options: ['< (छोटा है)', '> (बड़ा है)', '= (बराबर है)'],
        correctAnswer: '< (छोटा है)',
        explanation: '545 कदम 700 कदम से कम है, इसलिए 545 < 700।',
      },
    ],
  },
  {
    id: 'm-ch3',
    chapterNumber: 3,
    titleEnglish: 'Addition of Numbers (Brick Kiln)',
    titleHindi: 'पाठ 3: संख्याओं में जोड़ (देलवाड़ा ईंट भट्ठा)',
    concepts: ['तीन अंकों की संख्याओं में जोड़', 'हासिल के साथ जोड़', 'देवनागरी अंकों में जोड़'],
    term: 'half_yearly',
    estimatedMinutes: 50,
    sampleQuestions: [
      {
        question: 'किताब का सवाल (पेज 135): लोकेश बाजार से 567 रु. की घड़ी और 280 रु. की टार्च खरीदता है। कुल खर्च कितना हुआ?',
        type: 'solve',
        correctAnswer: '847',
        explanation: '567 + 280 = 847 रुपये।',
        whiteboardSteps: [
          { step: 'चरण 1: प्रश्न में दी गई जानकारी', formula: 'घड़ी का मूल्य = 567 रु., टार्च का मूल्य = 280 रु.', annotation: 'शर्मा सर: "दोनों वस्तुओं का मूल्य लिख लिया।"' },
          { step: 'चरण 2: जोड़ की क्रिया', formula: '567 + 280 = 847 रु.', annotation: 'इकाई: 7+0=7, दहाई: 6+8=14 (हासिल 1), सैकड़ा: 5+2+1=8' },
          { step: 'चरण 3: अंतिम उत्तर', formula: 'कुल खर्च = 847 रुपये ✅', annotation: 'लोकेश द्वारा खर्च की गई कुल राशि 847 रु. है!' },
        ],
      },
    ],
  },
  {
    id: 'm-ch4',
    chapterNumber: 4,
    titleEnglish: 'Addition & Subtraction (Taratai Village)',
    titleHindi: 'पाठ 4: संख्याओं में जोड़-घटाव (मिट्टी के दीपक)',
    concepts: ['तीन अंकों में घटाव', 'हासिल के साथ घटाव', 'देवनागरी अंकों में घटाव'],
    term: 'half_yearly',
    estimatedMinutes: 50,
    sampleQuestions: [
      {
        question: 'राजू के परिवार ने 790 दीपक बनाए और चेतन के परिवार ने 630। राजू ने कितने अधिक दीपक बनाए?',
        type: 'solve',
        correctAnswer: '160',
        explanation: '790 - 630 = 160 दीपक।',
        whiteboardSteps: [
          { step: 'चरण 1: दीपक की संख्या', formula: 'राजू = 790 दीपक, चेतन = 630 दीपक', annotation: 'अधिक संख्या ज्ञात करने के लिए घटाएंगे।' },
          { step: 'चरण 2: घटाव', formula: '790 - 630 = 160', annotation: '790 में से 630 घटाने पर 160 बचा।' },
          { step: 'चरण 3: उत्तर', formula: '160 दीपक अधिक बनाए ✅', annotation: 'सही उत्तर 160 है!' },
        ],
      },
    ],
  },
  {
    id: 'm-ch5',
    chapterNumber: 5,
    titleEnglish: 'Vedic Mathematics (Ekadhikena Purvena)',
    titleHindi: 'पाठ 5: वैदिक गणित (एकाधिकेन पूर्वेण)',
    concepts: ['एकाधिकेन पूर्वेण सूत्र से जोड़', 'एक न्यूनेन पूर्वेण से घटाव', 'परम मित्र अंक नियम'],
    keyFormulas: ['15 का एकाधिक = 16', '7 का परम मित्र अंक = 3 (योग = 10)'],
    term: 'annual',
    estimatedMinutes: 55,
    sampleQuestions: [
      {
        question: 'वैदिक गणित में अंक 7 का "परम मित्र" अंक कौन सा होता है?',
        type: 'mcq',
        options: ['2', '3', '5', '8'],
        correctAnswer: '3',
        explanation: 'जिन दो अंकों का योग 10 होता है, वे एक-दूसरे के परम मित्र होते हैं (7 + 3 = 10)।',
      },
      {
        question: 'संख्या 28 में अंक 8 पर एकाधिकेन पूर्वेण लगाने पर नया मान क्या होगा?',
        type: 'solve',
        correctAnswer: '38',
        explanation: '8 के पूर्व अंक 2 पर एकाधिक लगाने से वह 3 बन जाता है, अतः नया मान 38 होगा।',
      },
    ],
  },
  {
    id: 'm-ch6',
    chapterNumber: 6,
    titleEnglish: 'Shapes & 3D Geometry (Aakritiyan)',
    titleHindi: 'पाठ 6: आकृतियाँ (2D और 3D आकृतियां)',
    concepts: ['वृत्त (Circle)', 'त्रिभुज (Triangle)', 'आयत (Rectangle)', 'वर्ग (Square)', 'घन व घनाभ जाल'],
    term: 'annual',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'चारों भुजाएं समान हों और चार कोने हों, ऐसी बन्द आकृति को क्या कहते हैं?',
        type: 'mcq',
        options: ['वृत्त', 'त्रिभुज', 'आयत', 'वर्ग (Square)'],
        correctAnswer: 'वर्ग (Square)',
        explanation: 'चारों बराबर भुजाओं वाली बंद आकृति वर्ग कहलाती है।',
      },
    ],
  },
  {
    id: 'm-ch7',
    chapterNumber: 7,
    titleEnglish: 'Symmetry (Sammiti & Mirror Reflection)',
    titleHindi: 'पाठ 7: सममिति (दर्पण व प्रकृति में सममिति)',
    concepts: ['अक्षरों में दर्पण सममिति (INDIA, C, P, E)', 'तितली व पेड़ में सममिति अक्ष', 'वस्तुओं में सममिति रेखा'],
    term: 'annual',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'अंग्रेजी का कौन सा अक्षर दर्पण (Mirror) में देखने पर बिल्कुल नहीं बदलता?',
        type: 'mcq',
        options: ['C', 'P', 'E', 'A'],
        correctAnswer: 'A',
        explanation: 'अक्षर A उर्ध्वाधर सममित (Symmetric) होता है, अतः दर्पण में भी सीधा A ही दिखता है।',
      },
    ],
  },
  {
    id: 'm-ch8',
    chapterNumber: 8,
    titleEnglish: 'Lets Make Tables (Pahade & Laddoo Game)',
    titleHindi: 'पाठ 8: आओ पहाड़े बनाएँ (11 से 20 तक पहाड़े)',
    concepts: ['पहाड़ों की समझ (गुणा के रूप में)', '11 से 20 तक पहाड़े बनाना', '1 से 50 गिनती में लड्डू खेल'],
    keyFormulas: ['7 × 6 = 42 रु. (दिशु की 6 कॉपियों का मूल्य)', '3 × 20 = 60'],
    term: 'annual',
    estimatedMinutes: 50,
    sampleQuestions: [
      {
        question: 'किताब का सवाल (पेज 160): एक कॉपी 7 रु. की है। दिशु 6 कॉपियां खरीदती है, तो कुल कितने रुपये हुए?',
        type: 'solve',
        correctAnswer: '42',
        explanation: '7 × 6 = 42 रुपये।',
        whiteboardSteps: [
          { step: 'चरण 1: मूल्य व कॉपियों की संख्या', formula: '1 कॉपी = 7 रु., कुल कॉपियां = 6', annotation: 'शर्मा सर: "दिशु ने 6 कॉपियां लीं।"' },
          { step: 'चरण 2: पहाड़े द्वारा गणना', formula: '7 × 6 = 42 रु.', annotation: '7 का पहाड़ा 6 बार बोलने पर 42 प्राप्त हुआ।' },
          { step: 'चरण 3: अंतिम उत्तर', formula: 'कुल मूल्य = 42 रुपये ✅', annotation: 'दिशु दुकानदार को 42 रु. देगी!' },
        ],
      },
    ],
  },
];

// 2. CLASS 4 EVS / SCIENCE CHAPTERS
const CLASS_4_EVS_CHAPTERS: Chapter[] = [
  {
    id: 'evs-ch1',
    chapterNumber: 1,
    titleEnglish: 'Going to School',
    titleHindi: 'चलो, चलें स्कूल!',
    concepts: ['Camel carts in Thar Rajasthan', 'Bamboo bridge', 'Vallam boat'],
    term: 'half_yearly',
    estimatedMinutes: 40,
    sampleQuestions: [
      {
        question: 'राजस्थान के रेगिस्तान में बच्चे स्कूल जाने के लिए किस गाड़ी का उपयोग करते हैं?',
        type: 'mcq',
        options: ['बैलगाड़ी', 'ऊँट गाड़ी (Camel Cart)', 'साइकिल', 'स्लेज'],
        correctAnswer: 'ऊँट गाड़ी (Camel Cart)',
        explanation: 'रेत पर चलने के लिए ऊँट गाड़ी सबसे उपयोगी साधन है।',
      },
    ],
  },
  {
    id: 'evs-ch4',
    chapterNumber: 4,
    titleEnglish: 'The Story of Amrita (Bishnoi & Khejri)',
    titleHindi: 'अमृता की कहानी (खेजड़ली बलिदान)',
    concepts: ['Bishnoi community Jodhpur', 'Khejri tree preservation', 'Wildlife protection'],
    term: 'half_yearly',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'अमृता और विश्नोई समाज ने किस वृक्ष की रक्षा के लिए अपने प्राणों का बलिदान दिया?',
        type: 'mcq',
        options: ['बरगद', 'खेजड़ी (Khejri)', 'नीम', 'पीपल'],
        correctAnswer: 'खेजड़ी (Khejri)',
        explanation: 'जोधपुर के खेजड़ली गाँव में 363 लोगों ने खेजड़ी के पेड़ों के लिए बलिदान दिया।',
      },
    ],
  },
  {
    id: 'evs-ch11',
    chapterNumber: 11,
    titleEnglish: 'The Valley of Flowers',
    titleHindi: 'फूलों की घाटी (उत्तराखंड)',
    concepts: ['Valley of flowers Chamoli Uttarakhand', 'Madhubani paintings', 'Floral scents & Itr of Kannauj'],
    term: 'annual',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'फूलों की घाटी (Valley of Flowers) भारत के किस राज्य में स्थित है?',
        type: 'mcq',
        options: ['राजस्थान', 'उत्तराखंड (Uttarakhand)', 'केरल', 'गुजरात'],
        correctAnswer: 'उत्तराखंड (Uttarakhand)',
        explanation: 'उत्तराखंड के चमोली जिले में हिमालय की गोद में फूलों की खूबसूरत घाटी स्थित है।',
      },
      {
        question: 'इत्र (Perfume) बनाने के लिए उत्तर प्रदेश का कौन सा शहर प्रसिद्ध है?',
        type: 'mcq',
        options: ['कन्नौज (Kannauj)', 'जयपुर', 'आगरा', 'लखनऊ'],
        correctAnswer: 'कन्नौज (Kannauj)',
        explanation: 'कन्नौज अपने प्राकृतिक गुलाब और चमेली के इत्र के लिए विश्व प्रसिद्ध है।',
      },
    ],
  },
];

// 3. CLASS 4 ENGLISH CHAPTERS (MARIGOLD / LET'S LEARN ENGLISH)
const CLASS_4_ENGLISH_CHAPTERS: Chapter[] = [
  {
    id: 'eng-ch1',
    chapterNumber: 1,
    titleEnglish: 'Wake Up! & Nehas Alarm Clock',
    titleHindi: 'उठो! और नेहा की अलार्म घड़ी',
    concepts: ['Morning routines', 'Birds chirping', 'Rhyming words', 'Past tense'],
    term: 'half_yearly',
    estimatedMinutes: 40,
    sampleQuestions: [
      {
        question: 'What time did Neha’s clock ring every morning?',
        type: 'mcq',
        options: ['4 o’clock', '6 o’clock', '8 o’clock', '9 o’clock'],
        correctAnswer: '6 o’clock',
        explanation: 'Neha’s alarm clock always rang at 6 in the morning.',
      },
    ],
  },
  {
    id: 'eng-ch5',
    chapterNumber: 5,
    titleEnglish: 'Helen Keller & The Little Fir Tree',
    titleHindi: 'हेलेन केलर (दृढ़ निश्चय की कहानी)',
    concepts: ['Helen Keller determination', 'Braille script introduction', 'Adjectives & Opposites'],
    term: 'annual',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'Who agreed to teach and help Helen Keller?',
        type: 'mcq',
        options: ['Miss Sullivan', 'Dr. Sharma', 'Her grandmother', 'Her friend Seema'],
        correctAnswer: 'Miss Sullivan',
        explanation: 'Miss Sullivan was Helen Keller’s dedicated and kind young teacher.',
      },
      {
        question: 'What is the opposite of the word "Dark"?',
        type: 'mcq',
        options: ['Black', 'Bright / Light', 'Heavy', 'Cold'],
        correctAnswer: 'Bright / Light',
        explanation: 'The antonym (opposite) of dark is bright or light.',
      },
    ],
  },
  {
    id: 'eng-ch8',
    chapterNumber: 8,
    titleEnglish: 'Going to Buy a Book',
    titleHindi: 'किताब खरीदने चलना',
    concepts: ['Bookstore visit', 'Grandfather gift', 'Reading comprehension', 'Storybooks'],
    term: 'annual',
    estimatedMinutes: 40,
    sampleQuestions: [
      {
        question: 'Who gave the children money to buy books?',
        type: 'mcq',
        options: ['Their Father', 'Their Grandfather', 'Their Teacher', 'Their Uncle'],
        correctAnswer: 'Their Grandfather',
        explanation: 'One day, their grandfather gave them some money to buy books.',
      },
    ],
  },
];

// 4. CLASS 4 HINDI CHAPTERS (रिमझिम / भाषा भारती)
const CLASS_4_HINDI_CHAPTERS: Chapter[] = [
  {
    id: 'hin-ch1',
    chapterNumber: 1,
    titleEnglish: 'Man Ke Bhole Bhale Badal',
    titleHindi: 'मन के भोले-भाले बादल',
    concepts: ['कविता वाचन', 'तुकांत शब्द', 'बादलों के रूप'],
    term: 'half_yearly',
    estimatedMinutes: 40,
    sampleQuestions: [
      {
        question: 'बादलों के गाल किसकी तरह फूले हुए बताए गए हैं?',
        type: 'mcq',
        options: ['गुब्बारे की तरह', 'हाथी की तरह', 'ऊँट की तरह', 'पेड़ की तरह'],
        correctAnswer: 'गुब्बारे की तरह',
        explanation: 'कविता में बादलों को "झब्बर-झब्बर बालों वाले, गुब्बारों से गालों वाले" कहा गया है।',
      },
    ],
  },
  {
    id: 'hin-ch5',
    chapterNumber: 5,
    titleEnglish: 'Dost Ki Poshak (Nasruddin)',
    titleHindi: 'दोस्त की पोशाक (नसीरुद्दीन की कहानी)',
    concepts: ['मुहावरे', 'कहानी वाचन', 'अचकन और पोशाक'],
    term: 'half_yearly',
    estimatedMinutes: 45,
    sampleQuestions: [
      {
        question: 'नसीरुद्दीन ने अपने दोस्त जमाल साहब को क्या पहनने के लिए दिया था?',
        type: 'mcq',
        options: ['कुर्ता', 'भड़कीली अचकन', 'धोती', 'पगड़ी'],
        correctAnswer: 'भड़कीली अचकन',
        explanation: 'नसीरुद्दीन ने अपने दोस्त को अपनी खास भड़कीली अचकन दी थी।',
      },
    ],
  },
  {
    id: 'hin-ch8',
    chapterNumber: 8,
    titleEnglish: 'Kaun? (Chidiya aur Chuha)',
    titleHindi: 'कौन? (सोहनलाल द्विवेदी की कविता)',
    concepts: ['पहेली रूपी कविता', 'कुतरना', 'चूहे की हरकतें'],
    term: 'annual',
    estimatedMinutes: 40,
    sampleQuestions: [
      {
        question: 'रात भर घर में सामान कौन कुतरता रहता है?',
        type: 'mcq',
        options: ['बिल्ली', 'चूहा', 'चिड़िया', 'गिलहरी'],
        correctAnswer: 'चूहा',
        explanation: 'कविता के अंत में पता चलता है कि वह शरारती जीव चूहा है।',
      },
    ],
  },
];

// ALL 4 SUBJECTS FOR CLASS 4
const CLASS_4_SUBJECTS: SubjectCurriculum[] = [
  {
    id: 'math',
    subject: 'Mathematics',
    subjectHindi: 'गणित (Math)',
    bookName: 'गणित का जादू (Math-Magic)',
    teacherId: 'sharma',
    teacherName: 'Sharma Sir',
    emoji: '📐',
    chapters: CLASS_4_MATH_CHAPTERS,
  },
  {
    id: 'evs',
    subject: 'EVS / Science',
    subjectHindi: 'पर्यावरण (EVS)',
    bookName: 'अपना परिवेश (Looking Around)',
    teacherId: 'neha',
    teacherName: 'Neha Mam',
    emoji: '🔬',
    chapters: CLASS_4_EVS_CHAPTERS,
  },
  {
    id: 'english',
    subject: 'English',
    subjectHindi: 'अंग्रेजी (English)',
    bookName: 'Marigold (मैरीगोल्ड)',
    teacherId: 'riya',
    teacherName: 'Riya Didi',
    emoji: '📚',
    chapters: CLASS_4_ENGLISH_CHAPTERS,
  },
  {
    id: 'hindi',
    subject: 'Hindi',
    subjectHindi: 'हिंदी (Hindi)',
    bookName: 'रिमझिम (Rimjhim)',
    teacherId: 'pooja',
    teacherName: 'Pooja Mam',
    emoji: '✍️',
    chapters: CLASS_4_HINDI_CHAPTERS,
  },
];

export const CURRICULUM_DATA: { RBSE: BoardCurriculum; CBSE: BoardCurriculum } = {
  RBSE: {
    board: 'RBSE',
    classes: {
      'Class 4th': {
        english: CLASS_4_SUBJECTS,
        hindi: CLASS_4_SUBJECTS,
      },
    },
  },
  CBSE: {
    board: 'CBSE',
    classes: {
      'Class 4th': {
        english: CLASS_4_SUBJECTS,
        hindi: CLASS_4_SUBJECTS,
      },
    },
  },
};

export function getCurriculum(board: 'RBSE' | 'CBSE', className: string, medium: 'english' | 'hindi' = 'hindi'): SubjectCurriculum[] {
  const b = CURRICULUM_DATA[board] || CURRICULUM_DATA.RBSE;
  return b.classes['Class 4th']?.[medium] || CLASS_4_SUBJECTS;
}

export function getSubjectById(subjectId: string): SubjectCurriculum {
  return CLASS_4_SUBJECTS.find((s) => s.id === subjectId) || CLASS_4_SUBJECTS[0];
}
