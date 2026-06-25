import re

# Predefined standard English stopwords to avoid NLTK download errors
STOPWORDS = set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
])

# Simple sentiment lexicon for lexical analysis
SENTIMENT_LEXICON = {
    'good': 1, 'great': 2, 'excellent': 3, 'awesome': 3, 'wonderful': 2, 'happy': 1.5, 'positive': 1,
    'breaking': 0.5, 'huge': 0.5, 'historic': 0.8, 'success': 1.5, 'trusted': 1.5, 'credible': 2,
    'bad': -1, 'fake': -2, 'worst': -3, 'awful': -2.5, 'terrible': -2.5, 'horrible': -2.5, 'sad': -1,
    'conspiracy': -2, 'scandal': -1.5, 'outrage': -2, 'shocking': -1.5, 'liar': -2.5, 'lie': -2,
    'hoax': -3, 'propaganda': -2.5, 'manipulated': -2, 'unproven': -1.5, 'suspicious': -1.5,
    'hate': -2, 'kill': -2.5, 'corrupt': -2, 'illegal': -1.5, 'fraud': -2.5, 'threat': -1.5
}

class NLPProcessor:
    @staticmethod
    def clean_text(text):
        """
        Removes HTML tags, punctuation, and extra whitespace.
        """
        # Remove HTML
        text = re.sub(r'<[^>]+>', '', text)
        # Remove special characters/numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text.lower()

    @staticmethod
    def tokenize(text):
        """
        Splits text into words.
        """
        return text.split()

    @staticmethod
    def remove_stopwords(tokens):
        """
        Filters out common English stopwords.
        """
        return [token for token in tokens if token not in STOPWORDS]

    @staticmethod
    def stem_word(word):
        """
        Simple Porter-like suffix-stripping rules as a zero-dependency lemmatizer.
        """
        if len(word) <= 3:
            return word
        if word.endswith('ing'):
            return word[:-3]
        if word.endswith('ed'):
            return word[:-2]
        if word.endswith('s') and not word.endswith('ss'):
            return word[:-1]
        return word

    @classmethod
    def preprocess(cls, text):
        """
        Runs full pipeline: cleaning, tokenization, stopword removal, stemming.
        """
        cleaned = cls.clean_text(text)
        tokens = cls.tokenize(cleaned)
        filtered = cls.remove_stopwords(tokens)
        stemmed = [cls.stem_word(w) for w in filtered]
        return stemmed

    @staticmethod
    def get_pos_tags(text):
        """
        A rule-based POS tagger using regex and basic word endings.
        """
        words = text.split()
        tagged = []
        for word in words:
            clean = re.sub(r'[^a-zA-Z]', '', word).lower()
            if not clean:
                continue
            
            # Simple rule-based tagging
            if clean in STOPWORDS:
                tag = 'DT'  # Determiner/Conjunction/Preposition fallback
            elif clean.endswith('ly'):
                tag = 'RB'  # Adverb
            elif clean.endswith('ing'):
                tag = 'VBG' # Verb present participle
            elif clean.endswith('ed'):
                tag = 'VBD' # Verb past tense
            elif clean.endswith('tion') or clean.endswith('ness') or clean.endswith('ment'):
                tag = 'NN'  # Noun
            elif clean.endswith('ful') or clean.endswith('able') or clean.endswith('ive'):
                tag = 'JJ'  # Adjective
            else:
                tag = 'NN'  # Default to noun
                
            tagged.append({'word': word, 'tag': tag})
        return tagged[:50]  # Limit to first 50 words to keep response fast

    @staticmethod
    def extract_entities(text):
        """
        Regex-based Named Entity Recognition (NER).
        Detects potential Names, Organizations, Locations by identifying capitalized groups.
        """
        # Look for sequences of capitalized words that aren't at the start of a sentence
        # (For simplicity, we grab any capitalized words and filter out common sentence starters)
        words = re.findall(r'\b[A-Z][a-z]+\b', text)
        entities = {}
        
        # Simple entity typing rules
        for word in words:
            if word in ['The', 'A', 'An', 'It', 'He', 'She', 'They', 'This', 'But', 'If', 'Or']:
                continue
            
            # Determine type
            ent_type = 'PERSON'
            if word.endswith('Inc') or word.endswith('Corp') or word in ['Google', 'NASA', 'WHO', 'FBI', 'UN', 'Microsoft', 'Government']:
                ent_type = 'ORGANIZATION'
            elif word in ['London', 'Paris', 'Egypt', 'America', 'China', 'Russia', 'Europe', 'India', 'Washington']:
                ent_type = 'LOCATION'
                
            entities[word] = ent_type

        return [{'name': k, 'type': v} for k, v in entities.items()][:15]

    @classmethod
    def get_sentiment(cls, text):
        """
        Calculates sentiment score from -1.0 to 1.0 using a pre-populated lexicon.
        """
        cleaned_words = cls.tokenize(cls.clean_text(text))
        score = 0.0
        word_count = 0
        
        for word in cleaned_words:
            if word in SENTIMENT_LEXICON:
                score += SENTIMENT_LEXICON[word]
                word_count += 1
                
        if word_count == 0:
            return {'score': 0.0, 'sentiment': 'Neutral'}
            
        avg_score = score / word_count
        sentiment = 'Neutral'
        if avg_score > 0.3:
            sentiment = 'Positive'
        elif avg_score < -0.3:
            sentiment = 'Negative/Sensational'
            
        return {
            'score': round(max(-1.0, min(1.0, avg_score)), 2),
            'sentiment': sentiment
        }
