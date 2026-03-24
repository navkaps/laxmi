export interface TriviaQuestion {
  question: string;
  options: string[];
  answer: number; // index of correct option
}

export interface TriviaCategory {
  id: string;
  label: string;
  emoji: string;
  color: string; // tailwind gold/white classes for accent
  questions: TriviaQuestion[];
}

export const TRIVIA_CATEGORIES: TriviaCategory[] = [
  {
    id: "movies",
    label: "Movies",
    emoji: "🎬",
    color: "from-gold-600 to-gold-400",
    questions: [
      {
        question: "Which film won the first ever Academy Award for Best Picture?",
        options: ["Sunrise", "Wings", "The Jazz Singer", "Ben-Hur"],
        answer: 1,
      },
      {
        question: "Who directed Pulp Fiction?",
        options: ["Martin Scorsese", "David Fincher", "Quentin Tarantino", "Coen Brothers"],
        answer: 2,
      },
      {
        question: "What is the highest-grossing film of all time (unadjusted for inflation)?",
        options: ["Avengers: Endgame", "Avatar", "Titanic", "Top Gun: Maverick"],
        answer: 1,
      },
      {
        question: "Which actor has won the most Academy Awards for Best Actor?",
        options: ["Jack Nicholson", "Marlon Brando", "Daniel Day-Lewis", "Tom Hanks"],
        answer: 2,
      },
      {
        question: "In The Matrix, which pill does Neo choose?",
        options: ["Blue", "Red", "Green", "He takes both"],
        answer: 1,
      },
      {
        question: "Which film features the line 'Here's looking at you, kid'?",
        options: ["Gone with the Wind", "Casablanca", "Citizen Kane", "Some Like It Hot"],
        answer: 1,
      },
      {
        question: "Who played the Joker in The Dark Knight?",
        options: ["Jared Leto", "Joaquin Phoenix", "Jack Nicholson", "Heath Ledger"],
        answer: 3,
      },
      {
        question: "Which country produces the most films annually?",
        options: ["USA", "China", "India", "Nigeria"],
        answer: 2,
      },
      {
        question: "What is the name of the fictional African country in Black Panther?",
        options: ["Zamunda", "Wakanda", "Genosha", "Latveria"],
        answer: 1,
      },
      {
        question: "In Inception, what is the name of the spinning top Cobb uses as a totem?",
        options: ["The Top", "The Dreidel", "The Spinner", "It has no name"],
        answer: 3,
      },
    ],
  },
  {
    id: "pop",
    label: "Pop",
    emoji: "🎤",
    color: "from-pink-500 to-rose-400",
    questions: [
      {
        question: "Which artist holds the record for most Grammy wins?",
        options: ["Beyoncé", "Taylor Swift", "Georg Solti", "Quincy Jones"],
        answer: 0,
      },
      {
        question: "What was the best-selling single of the 1990s globally?",
        options: ["Baby One More Time", "Macarena", "My Heart Will Go On", "Candle in the Wind"],
        answer: 3,
      },
      {
        question: "Which pop star is known as the 'Queen of Pop'?",
        options: ["Mariah Carey", "Whitney Houston", "Madonna", "Janet Jackson"],
        answer: 2,
      },
      {
        question: "Taylor Swift's 'Shake It Off' is from which album?",
        options: ["Red", "1989", "Reputation", "Fearless"],
        answer: 1,
      },
      {
        question: "Which artist was once known as 'Prince'?",
        options: ["The Artist", "The Symbol", "Love Symbol #2", "The Purple One"],
        answer: 0,
      },
      {
        question: "Ed Sheeran is originally from which country?",
        options: ["Australia", "Canada", "Ireland", "England"],
        answer: 3,
      },
      {
        question: "'Bad Guy' was a massive hit for which artist?",
        options: ["Dua Lipa", "Billie Eilish", "Ariana Grande", "Lorde"],
        answer: 1,
      },
      {
        question: "What year did Michael Jackson release 'Thriller'?",
        options: ["1979", "1980", "1982", "1984"],
        answer: 2,
      },
      {
        question: "Which pop duo had a hit with 'Wake Me Up Before You Go-Go'?",
        options: ["Pet Shop Boys", "Wham!", "Hall & Oates", "Tears for Fears"],
        answer: 1,
      },
      {
        question: "Adele's album '21' was named after what?",
        options: ["Her house number", "Her age when she wrote it", "Number of tracks originally recorded", "A lucky number"],
        answer: 1,
      },
    ],
  },
  {
    id: "hiphop",
    label: "Hip Hop",
    emoji: "🎧",
    color: "from-purple-500 to-violet-400",
    questions: [
      {
        question: "Who is often credited as the 'Father of Hip Hop'?",
        options: ["Grandmaster Flash", "Afrika Bambaataa", "DJ Kool Herc", "Melle Mel"],
        answer: 2,
      },
      {
        question: "Which rapper released the album 'To Pimp a Butterfly'?",
        options: ["J. Cole", "Kendrick Lamar", "Drake", "Kanye West"],
        answer: 1,
      },
      {
        question: "Jay-Z's real name is?",
        options: ["Shawn Carter", "Dwayne Carter", "Marcus Carter", "James Carter"],
        answer: 0,
      },
      {
        question: "Which city is Eminem from?",
        options: ["Chicago", "New York", "Detroit", "Los Angeles"],
        answer: 2,
      },
      {
        question: "What does 'OVO' stand for in Drake's brand?",
        options: ["Over Valued Ones", "October's Very Own", "Only Valuable Originals", "One Vision Only"],
        answer: 1,
      },
      {
        question: "Which hip hop group had Tupac as a member?",
        options: ["Wu-Tang Clan", "N.W.A", "Digital Underground", "A Tribe Called Quest"],
        answer: 2,
      },
      {
        question: "Cardi B's debut single was?",
        options: ["Money", "WAP", "Bodak Yellow", "I Like It"],
        answer: 2,
      },
      {
        question: "'Sicko Mode' features which two artists?",
        options: ["Travis Scott & Drake", "Lil Wayne & Nicki Minaj", "Kanye West & Jay-Z", "Post Malone & 21 Savage"],
        answer: 0,
      },
      {
        question: "Nas's debut album is considered one of the greatest. What is it called?",
        options: ["It Was Written", "Stillmatic", "Illmatic", "Street's Disciple"],
        answer: 2,
      },
      {
        question: "Which rapper's real name is Aubrey Graham?",
        options: ["Future", "Drake", "Lil Uzi Vert", "The Weeknd"],
        answer: 1,
      },
    ],
  },
  {
    id: "bollywood",
    label: "Bollywood",
    emoji: "🎭",
    color: "from-orange-500 to-amber-400",
    questions: [
      {
        question: "Which film is the highest-grossing Bollywood movie of all time?",
        options: ["Dangal", "Baahubali 2", "KGF Chapter 2", "RRR"],
        answer: 1,
      },
      {
        question: "Who is known as the 'King of Bollywood'?",
        options: ["Salman Khan", "Aamir Khan", "Shah Rukh Khan", "Hrithik Roshan"],
        answer: 2,
      },
      {
        question: "Which Bollywood film won India's first Academy Award nomination for Best Foreign Language Film?",
        options: ["Lagaan", "Mother India", "Guide", "Sholay"],
        answer: 1,
      },
      {
        question: "A.R. Rahman composed the music for which Oscar-winning film?",
        options: ["Lagaan", "Devdas", "Slumdog Millionaire", "Life of Pi"],
        answer: 2,
      },
      {
        question: "Which actress is known as the 'Dream Girl' of Bollywood?",
        options: ["Rekha", "Madhuri Dixit", "Hema Malini", "Sridevi"],
        answer: 2,
      },
      {
        question: "Dilwale Dulhania Le Jayenge ran continuously in one Mumbai cinema for how many years?",
        options: ["10 years", "15 years", "20 years", "25+ years"],
        answer: 3,
      },
      {
        question: "Who directed the Baahubali series?",
        options: ["Sanjay Leela Bhansali", "SS Rajamouli", "Karan Johar", "Mani Ratnam"],
        answer: 1,
      },
      {
        question: "Priyanka Chopra won Miss World in which year?",
        options: ["1998", "2000", "2002", "2004"],
        answer: 1,
      },
      {
        question: "Which film features the iconic song 'Ek Do Teen' (remixed in 2018)?",
        options: ["Tezaab", "Maine Pyar Kiya", "Qayamat Se Qayamat Tak", "Ram Lakhan"],
        answer: 0,
      },
      {
        question: "Amitabh Bachchan is nicknamed what in Bollywood?",
        options: ["The Don", "Big B", "Shahenshah", "Deewar"],
        answer: 1,
      },
    ],
  },
];
