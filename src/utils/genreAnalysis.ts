import { Genre } from '../types';

// This is a mock implementation to simulate ML genre classification
// In a real app, this would be a call to a backend ML service
export const simulateGenreAnalysis = async (songTitle: string): Promise<Genre[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, generate genres based on song title
  const possibleGenres = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical', 
    'Electronic', 'Dance', 'Indie', 'Country', 'Metal', 'Folk'
  ];
  
  // Use the song title to deterministically pick a primary genre
  const titleSum = songTitle.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const primaryGenreIndex = titleSum % possibleGenres.length;
  const primaryGenre = possibleGenres[primaryGenreIndex];
  
  // Generate 1-3 additional genres with lower confidence
  const otherGenres: Genre[] = [];
  const numOtherGenres = (titleSum % 3) + 1;
  
  for (let i = 0; i < numOtherGenres; i++) {
    const index = (primaryGenreIndex + i + 1) % possibleGenres.length;
    if (possibleGenres[index] !== primaryGenre) {
      otherGenres.push({
        name: possibleGenres[index],
        confidence: Math.round((0.85 - (i * 0.2)) * 100) / 100
      });
    }
  }
  
  // Return primary genre with high confidence plus additional genres
  return [
    { name: primaryGenre, confidence: 0.95 },
    ...otherGenres
  ];
};

// This simulates fetching similar songs by genre
export const getSimilarSongsByGenre = async (genreName: string, limit = 5): Promise<string[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock database of songs by genre
  const songsByGenre: Record<string, string[]> = {
    'Pop': ['Shape of You', 'Bad Guy', 'Blinding Lights', 'Watermelon Sugar', 'Don\'t Start Now'],
    'Rock': ['Bohemian Rhapsody', 'Sweet Child O\' Mine', 'Back in Black', 'Stairway to Heaven', 'Smells Like Teen Spirit'],
    'Hip Hop': ['Sicko Mode', 'God\'s Plan', 'HUMBLE.', '99 Problems', 'Lose Yourself'],
    'R&B': ['Blinding Lights', 'Adorn', 'Redbone', 'Love Galore', 'Crew'],
    'Jazz': ['Take Five', 'So What', 'My Favorite Things', 'A Love Supreme', 'Sing, Sing, Sing'],
    'Classical': ['Canon in D', 'Für Elise', 'Moonlight Sonata', 'The Four Seasons', 'Symphony No. 5'],
    'Electronic': ['Around the World', 'Strobe', 'Scary Monsters and Nice Sprites', 'Levels', 'Animals'],
    'Dance': ['One More Time', 'Don\'t You Worry Child', 'Clarity', 'Summer', 'Wake Me Up'],
    'Indie': ['Do I Wanna Know?', 'Mr. Brightside', 'Midnight City', 'Skinny Love', 'Chamber of Reflection'],
    'Country': ['Old Town Road', 'Meant to Be', 'Body Like a Back Road', 'Cruise', 'Tequila'],
    'Metal': ['Enter Sandman', 'Master of Puppets', 'Paranoid', 'Chop Suey!', 'Iron Man'],
    'Folk': ['The Hanging Tree', 'Little Lion Man', 'Ho Hey', 'Skinny Love', 'I Will Wait']
  };
  
  // Return songs for the requested genre, or an empty array if genre not found
  return songsByGenre[genreName]?.slice(0, limit) || [];
};