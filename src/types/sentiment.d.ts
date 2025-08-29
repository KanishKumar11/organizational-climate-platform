declare module 'sentiment' {
  interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Array<{ [word: string]: number }>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  interface SentimentOptions {
    extras?: { [word: string]: number };
  }

  function sentiment(
    phrase: string,
    options?: SentimentOptions
  ): SentimentResult;

  export = sentiment;
}
