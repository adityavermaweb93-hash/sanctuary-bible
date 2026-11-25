export interface BibleBookMeta {
  id: number;
  osisCode: string;
  name: string;
  testament: "OT" | "NT";
  category: string;
  chapterCount: number;
  displayOrder: number;
}

export const BIBLE_BOOKS: BibleBookMeta[] = [
  // Old Testament (39 books)
  { id: 1, osisCode: "Gen", name: "Genesis", testament: "OT", category: "Law", chapterCount: 50, displayOrder: 1 },
  { id: 2, osisCode: "Exod", name: "Exodus", testament: "OT", category: "Law", chapterCount: 40, displayOrder: 2 },
  { id: 3, osisCode: "Lev", name: "Leviticus", testament: "OT", category: "Law", chapterCount: 27, displayOrder: 3 },
  { id: 4, osisCode: "Num", name: "Numbers", testament: "OT", category: "Law", chapterCount: 36, displayOrder: 4 },
  { id: 5, osisCode: "Deut", name: "Deuteronomy", testament: "OT", category: "Law", chapterCount: 34, displayOrder: 5 },
  { id: 6, osisCode: "Josh", name: "Joshua", testament: "OT", category: "History", chapterCount: 24, displayOrder: 6 },
  { id: 7, osisCode: "Judg", name: "Judges", testament: "OT", category: "History", chapterCount: 21, displayOrder: 7 },
  { id: 8, osisCode: "Ruth", name: "Ruth", testament: "OT", category: "History", chapterCount: 4, displayOrder: 8 },
  { id: 9, osisCode: "1Sam", name: "1 Samuel", testament: "OT", category: "History", chapterCount: 31, displayOrder: 9 },
  { id: 10, osisCode: "2Sam", name: "2 Samuel", testament: "OT", category: "History", chapterCount: 24, displayOrder: 10 },
  { id: 11, osisCode: "1Kgs", name: "1 Kings", testament: "OT", category: "History", chapterCount: 22, displayOrder: 11 },
  { id: 12, osisCode: "2Kgs", name: "2 Kings", testament: "OT", category: "History", chapterCount: 25, displayOrder: 12 },
  { id: 13, osisCode: "1Chr", name: "1 Chronicles", testament: "OT", category: "History", chapterCount: 29, displayOrder: 13 },
  { id: 14, osisCode: "2Chr", name: "2 Chronicles", testament: "OT", category: "History", chapterCount: 36, displayOrder: 14 },
  { id: 15, osisCode: "Ezra", name: "Ezra", testament: "OT", category: "History", chapterCount: 10, displayOrder: 15 },
  { id: 16, osisCode: "Neh", name: "Nehemiah", testament: "OT", category: "History", chapterCount: 13, displayOrder: 16 },
  { id: 17, osisCode: "Esth", name: "Esther", testament: "OT", category: "History", chapterCount: 10, displayOrder: 17 },
  { id: 18, osisCode: "Job", name: "Job", testament: "OT", category: "Poetry", chapterCount: 42, displayOrder: 18 },
  { id: 19, osisCode: "Ps", name: "Psalms", testament: "OT", category: "Poetry", chapterCount: 150, displayOrder: 19 },
  { id: 20, osisCode: "Prov", name: "Proverbs", testament: "OT", category: "Poetry", chapterCount: 31, displayOrder: 20 },
  { id: 21, osisCode: "Eccl", name: "Ecclesiastes", testament: "OT", category: "Poetry", chapterCount: 12, displayOrder: 21 },
  { id: 22, osisCode: "Song", name: "Song of Solomon", testament: "OT", category: "Poetry", chapterCount: 8, displayOrder: 22 },
  { id: 23, osisCode: "Isa", name: "Isaiah", testament: "OT", category: "Major Prophets", chapterCount: 66, displayOrder: 23 },
  { id: 24, osisCode: "Jer", name: "Jeremiah", testament: "OT", category: "Major Prophets", chapterCount: 52, displayOrder: 24 },
  { id: 25, osisCode: "Lam", name: "Lamentations", testament: "OT", category: "Major Prophets", chapterCount: 5, displayOrder: 25 },
  { id: 26, osisCode: "Ezek", name: "Ezekiel", testament: "OT", category: "Major Prophets", chapterCount: 48, displayOrder: 26 },
  { id: 27, osisCode: "Dan", name: "Daniel", testament: "OT", category: "Major Prophets", chapterCount: 12, displayOrder: 27 },
  { id: 28, osisCode: "Hos", name: "Hosea", testament: "OT", category: "Minor Prophets", chapterCount: 14, displayOrder: 28 },
  { id: 29, osisCode: "Joel", name: "Joel", testament: "OT", category: "Minor Prophets", chapterCount: 3, displayOrder: 29 },
  { id: 30, osisCode: "Amos", name: "Amos", testament: "OT", category: "Minor Prophets", chapterCount: 9, displayOrder: 30 },
  { id: 31, osisCode: "Obad", name: "Obadiah", testament: "OT", category: "Minor Prophets", chapterCount: 1, displayOrder: 31 },
  { id: 32, osisCode: "Jonah", name: "Jonah", testament: "OT", category: "Minor Prophets", chapterCount: 4, displayOrder: 32 },
  { id: 33, osisCode: "Mic", name: "Micah", testament: "OT", category: "Minor Prophets", chapterCount: 7, displayOrder: 33 },
  { id: 34, osisCode: "Nah", name: "Nahum", testament: "OT", category: "Minor Prophets", chapterCount: 3, displayOrder: 34 },
  { id: 35, osisCode: "Hab", name: "Habakkuk", testament: "OT", category: "Minor Prophets", chapterCount: 3, displayOrder: 35 },
  { id: 36, osisCode: "Zeph", name: "Zephaniah", testament: "OT", category: "Minor Prophets", chapterCount: 3, displayOrder: 36 },
  { id: 37, osisCode: "Hag", name: "Haggai", testament: "OT", category: "Minor Prophets", chapterCount: 2, displayOrder: 37 },
  { id: 38, osisCode: "Zech", name: "Zechariah", testament: "OT", category: "Minor Prophets", chapterCount: 14, displayOrder: 38 },
  { id: 39, osisCode: "Mal", name: "Malachi", testament: "OT", category: "Minor Prophets", chapterCount: 4, displayOrder: 39 },

  // New Testament (27 books)
  { id: 40, osisCode: "Matt", name: "Matthew", testament: "NT", category: "Gospels", chapterCount: 28, displayOrder: 40 },
  { id: 41, osisCode: "Mark", name: "Mark", testament: "NT", category: "Gospels", chapterCount: 16, displayOrder: 41 },
  { id: 42, osisCode: "Luke", name: "Luke", testament: "NT", category: "Gospels", chapterCount: 24, displayOrder: 42 },
  { id: 43, osisCode: "John", name: "John", testament: "NT", category: "Gospels", chapterCount: 21, displayOrder: 43 },
  { id: 44, osisCode: "Acts", name: "Acts", testament: "NT", category: "Acts", chapterCount: 28, displayOrder: 44 },
  { id: 45, osisCode: "Rom", name: "Romans", testament: "NT", category: "Epistles", chapterCount: 16, displayOrder: 45 },
  { id: 46, osisCode: "1Cor", name: "1 Corinthians", testament: "NT", category: "Epistles", chapterCount: 16, displayOrder: 46 },
  { id: 47, osisCode: "2Cor", name: "2 Corinthians", testament: "NT", category: "Epistles", chapterCount: 13, displayOrder: 47 },
  { id: 48, osisCode: "Gal", name: "Galatians", testament: "NT", category: "Epistles", chapterCount: 6, displayOrder: 48 },
  { id: 49, osisCode: "Eph", name: "Ephesians", testament: "NT", category: "Epistles", chapterCount: 6, displayOrder: 49 },
  { id: 50, osisCode: "Phil", name: "Philippians", testament: "NT", category: "Epistles", chapterCount: 4, displayOrder: 50 },
  { id: 51, osisCode: "Col", name: "Colossians", testament: "NT", category: "Epistles", chapterCount: 4, displayOrder: 51 },
  { id: 52, osisCode: "1Thess", name: "1 Thessalonians", testament: "NT", category: "Epistles", chapterCount: 5, displayOrder: 52 },
  { id: 53, osisCode: "2Thess", name: "2 Thessalonians", testament: "NT", category: "Epistles", chapterCount: 3, displayOrder: 53 },
  { id: 54, osisCode: "1Tim", name: "1 Timothy", testament: "NT", category: "Epistles", chapterCount: 6, displayOrder: 54 },
  { id: 55, osisCode: "2Tim", name: "2 Timothy", testament: "NT", category: "Epistles", chapterCount: 4, displayOrder: 55 },
  { id: 56, osisCode: "Titus", name: "Titus", testament: "NT", category: "Epistles", chapterCount: 3, displayOrder: 56 },
  { id: 57, osisCode: "Phlm", name: "Philemon", testament: "NT", category: "Epistles", chapterCount: 1, displayOrder: 57 },
  { id: 58, osisCode: "Heb", name: "Hebrews", testament: "NT", category: "Epistles", chapterCount: 13, displayOrder: 58 },
  { id: 59, osisCode: "Jas", name: "James", testament: "NT", category: "Epistles", chapterCount: 5, displayOrder: 59 },
  { id: 60, osisCode: "1Pet", name: "1 Peter", testament: "NT", category: "Epistles", chapterCount: 5, displayOrder: 60 },
  { id: 61, osisCode: "2Pet", name: "2 Peter", testament: "NT", category: "Epistles", chapterCount: 3, displayOrder: 61 },
  { id: 62, osisCode: "1John", name: "1 John", testament: "NT", category: "Epistles", chapterCount: 5, displayOrder: 62 },
  { id: 63, osisCode: "2John", name: "2 John", testament: "NT", category: "Epistles", chapterCount: 1, displayOrder: 63 },
  { id: 64, osisCode: "3John", name: "3 John", testament: "NT", category: "Epistles", chapterCount: 1, displayOrder: 64 },
  { id: 65, osisCode: "Jude", name: "Jude", testament: "NT", category: "Epistles", chapterCount: 1, displayOrder: 65 },
  { id: 66, osisCode: "Rev", name: "Revelation", testament: "NT", category: "Prophecy", chapterCount: 22, displayOrder: 66 },
];

export function findBookByNameOrId(input: string | number): BibleBookMeta | undefined {
  if (typeof input === "number") {
    return BIBLE_BOOKS.find((b) => b.id === input);
  }
  const normalized = input.trim().toLowerCase();
  return BIBLE_BOOKS.find(
    (b) =>
      b.name.toLowerCase() === normalized ||
      b.osisCode.toLowerCase() === normalized ||
      String(b.id) === normalized
  );
}
