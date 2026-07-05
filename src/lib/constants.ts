export const DEFAULT_LABEL = "Darkrooms Music Group";
export const DEFAULT_CLINE = "© 2026 Darkrooms Music Group";
export const DEFAULT_PLINE = "℗ 2026 Darkrooms Music Group";

export const GENRES: Record<string, string[]> = {
  "Indian": ["Bollywood", "Ghazal", "Bhajan", "Qawwali", "Filmy", "Other"],
  "Pop": ["Indie Pop", "Synth Pop", "Dance Pop", "Electro Pop", "Other"],
  "Rock": ["Alternative Rock", "Hard Rock", "Indie Rock", "Classic Rock", "Other"],
  "Hip Hop": ["Trap", "Conscious Hip Hop", "Drill", "Boom Bap", "Other"],
  "Electronic/Dance": ["Ambient Electronic", "House", "Techno", "Dubstep", "Other"],
  "R&B": ["Contemporary R&B", "Neo Soul", "Alternative R&B", "Other"],
  "Jazz": ["Smooth Jazz", "Bebop", "Fusion", "Contemporary Jazz", "Other"],
  "Classical": ["Orchestral", "Chamber", "Solo", "Contemporary Classical", "Other"],
  "Folk": ["Indie Folk", "Traditional Folk", "Contemporary Folk", "Other"],
  "Country": ["Modern Country", "Traditional Country", "Country Pop", "Other"],
  "Metal": ["Heavy Metal", "Death Metal", "Black Metal", "Progressive Metal", "Other"],
  "Latin": ["Reggaeton", "Salsa", "Bachata", "Latin Pop", "Other"],
  "World": ["Afrobeat", "Reggae", "Soca", "Bhangra", "Other"],
  "Other": ["Experimental", "Spoken Word", "Comedy", "Children's", "Other"],
};

export const LANGUAGES = [
  "Hindi", "English", "Punjabi", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Gujarati", "Odia", "Urdu",
  "Assamese", "Bhojpuri", "Rajasthani", "Haryanvi", "Instrumental",
  "Spanish", "French", "German", "Japanese", "Korean", "Mandarin",
  "Arabic", "Portuguese", "Russian", "Italian", "Dutch", "Turkish",
  "Swedish", "Danish", "Norwegian", "Finnish", "Polish", "Greek",
  "Romanian", "Hungarian", "Czech", "Thai", "Vietnamese", "Indonesian",
  "Other",
];

export const CONTENT_TYPES = [
  "Original/Exclusive Licensed",
  "AI Generated",
  "Non-Exclusive Licensed",
];

export const RELEASE_TYPES = ["Single", "EP", "Album"];

export const SAMPLE_RATES = [44100, 48000, 96000, 192000];
export const BIT_DEPTHS = [16, 24, 32];

export const ALLOWED_IMAGE_SIZES = [
  { width: 3000, height: 3000, label: "3000x3000" },
  { width: 1400, height: 1400, label: "1400x1400" },
];
