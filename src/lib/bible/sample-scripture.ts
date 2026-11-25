export interface VerseItem {
  verseNum: number;
  text: string;
}

/**
 * Exact Public Domain KJV & WEB Scripture passages for offline/initial fallback & seeding.
 * Never altered or AI-generated.
 */
export const SAMPLE_CHAPTERS: Record<string, VerseItem[]> = {
  "KJV:1:1": [
    { verseNum: 1, text: "In the beginning God created the heaven and the earth." },
    { verseNum: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters." },
    { verseNum: 3, text: "And God said, Let there be light: and there was light." },
    { verseNum: 4, text: "And God saw the light, that it was good: and God divided the light from the darkness." },
    { verseNum: 5, text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day." },
    { verseNum: 6, text: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters." },
    { verseNum: 7, text: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so." },
    { verseNum: 8, text: "And God called the firmament Heaven. And the evening and the morning were the second day." },
    { verseNum: 9, text: "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so." },
    { verseNum: 10, text: "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good." },
  ],
  "KJV:19:23": [
    { verseNum: 1, text: "The LORD is my shepherd; I shall not want." },
    { verseNum: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
    { verseNum: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
    { verseNum: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
    { verseNum: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
    { verseNum: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever." },
  ],
  "WEB:19:23": [
    { verseNum: 1, text: "Yahweh is my shepherd: I shall lack nothing." },
    { verseNum: 2, text: "He makes me lie down in green pastures. He leads me beside still waters." },
    { verseNum: 3, text: "He restores my soul. He guides me in the paths of righteousness for his name's sake." },
    { verseNum: 4, text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me." },
    { verseNum: 5, text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil. My cup runs over." },
    { verseNum: 6, text: "Surely goodness and loving kindness shall follow me all the days of my life, and I will dwell in Yahweh's house forever." },
  ],
  "KJV:43:3": [
    { verseNum: 1, text: "There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:" },
    { verseNum: 2, text: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him." },
    { verseNum: 3, text: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God." },
    { verseNum: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
    { verseNum: 17, text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved." },
  ],
  "WEB:43:3": [
    { verseNum: 1, text: "Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews." },
    { verseNum: 2, text: "The same came to him by night, and said to him, \"Rabbi, we know that you are a teacher come from God, for no one can do these signs that you do, unless God is with him.\"" },
    { verseNum: 3, text: "Jesus answered him, \"Most certainly, I tell you, unless one is born anew, he can't see God's Kingdom.\"" },
    { verseNum: 16, text: "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life." },
    { verseNum: 17, text: "For God didn't send his Son into the world to judge the world, but that the world should be saved through him." },
  ],
  "KJV:45:8": [
    { verseNum: 1, text: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." },
    { verseNum: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
    { verseNum: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come," },
    { verseNum: 39, text: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord." },
  ],
  "WEB:45:8": [
    { verseNum: 1, text: "There is therefore now no condemnation to those who are in Christ Jesus, who don't walk according to the flesh, but according to the Spirit." },
    { verseNum: 28, text: "We know that all things work together for good for those who love God, for those who are called according to his purpose." },
    { verseNum: 38, text: "For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers," },
    { verseNum: 39, text: "nor height, nor depth, nor any other created thing will be able to separate us from God's love which is in Christ Jesus our Lord." },
  ],
};
