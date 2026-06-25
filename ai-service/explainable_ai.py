import re
from nlp_processor import NLPProcessor, SENTIMENT_LEXICON

class ExplainableAI:
    @staticmethod
    def get_lexicon_influence(tokens):
        """
        Calculates token impact scores based on our lexicon.
        """
        contributions = []
        for word in tokens:
            cleaned_word = word.lower()
            if cleaned_word in SENTIMENT_LEXICON:
                weight = abs(SENTIMENT_LEXICON[cleaned_word])
                impact = 'Fake/Sensational' if SENTIMENT_LEXICON[cleaned_word] < 0 else 'Authentic'
                contributions.append({
                    "word": cleaned_word,
                    "weight": weight,
                    "impact": impact
                })
        return contributions

    @classmethod
    def analyze_predictions(cls, text, category, model_pipeline=None):
        """
        Inspects model parameters or falls back to lexicon analysis to determine
        why the text is classified into a certain bucket, return detailed explanations.
        """
        # Preprocess text
        tokens = NLPProcessor.preprocess(text)
        raw_words = text.split()
        
        # 1. Keywords influencing prediction
        keywords = []
        
        # If we have a trained pipeline, extract feature weights
        if model_pipeline and hasattr(model_pipeline, 'named_steps'):
            try:
                tfidf = model_pipeline.named_steps['tfidf']
                clf = model_pipeline.named_steps['clf']
                
                # Get vector representation
                vector = tfidf.transform([' '.join(tokens)]).toarray()[0]
                feature_names = tfidf.get_feature_names_out()
                
                # Find non-zero feature weights in input text
                active_features = []
                for idx, val in enumerate(vector):
                    if val > 0:
                        word = feature_names[idx]
                        # Estimate classifier feature importance for this class
                        # For Random Forest, we look at feature_importances_
                        importance = clf.feature_importances_[idx] if hasattr(clf, 'feature_importances_') else 0.1
                        active_features.append((word, val * importance))
                
                # Sort active features
                active_features = sorted(active_features, key=lambda x: x[1], reverse=True)[:6]
                for f_name, score in active_features:
                    # Map to a category impact
                    impact = 'Neutral'
                    if f_name in ['fake', 'conspiracy', 'hoax', 'liar', 'propaganda']:
                        impact = 'Fake/Propaganda'
                    elif f_name in ['you', 'won\'t', 'believe', 'shocking', 'trick']:
                        impact = 'Fake/Clickbait'
                    elif f_name in ['Nature', 'Nature', 'scientists', 'government', 'reserve']:
                        impact = 'Factual/Real'
                    
                    keywords.append({
                        "word": f_name,
                        "weight": round(float(score * 100), 2),
                        "impact": impact
                    })
            except Exception as e:
                print("Error extracting features from model pipeline:", e)
                keywords = []
        
        # Fallback keyword weights from lexicon if model failed or is empty
        if not keywords:
            lexicon_influence = cls.get_lexicon_influence(tokens)
            # Deduplicate by word
            seen = set()
            for item in lexicon_influence:
                if item['word'] not in seen:
                    seen.add(item['word'])
                    keywords.append({
                        "word": item['word'],
                        "weight": round(item['weight'], 2),
                        "impact": item['impact']
                    })
            
            # Fill with frequent words if lexicon is empty
            if not keywords:
                freq = {}
                for w in tokens:
                    if len(w) > 4:
                        freq[w] = freq.get(w, 0) + 1
                sorted_f = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]
                for w, c in sorted_f:
                    keywords.append({
                        "word": w,
                        "weight": round(c * 0.2, 2),
                        "impact": "Neutral/Structural"
                    })

        # Ensure we return up to 6 keywords
        keywords = keywords[:6]

        # 2. Sentences triggering warnings (Sensational/Clickbait/Propaganda)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        highlighted_phrases = []
        
        # Common triggers
        clickbait_rx = re.compile(r'\b(you won\'t believe|shocking|secret|trick|hack|miracle|click here)\b', re.IGNORECASE)
        propaganda_rx = re.compile(r'\b(conspiracy|deep state|corrupt|traitors|sheeple|puppet|fake news|agenda)\b', re.IGNORECASE)
        emotional_rx = re.compile(r'\b(destroy|annihilate|evil|terrible|furious|disgrace|scandal|worst|horrific)\b', re.IGNORECASE)

        for sent in sentences:
            sent_clean = sent.strip()
            if not sent_clean:
                continue
            
            if clickbait_rx.search(sent_clean):
                highlighted_phrases.append({"text": sent_clean, "type": "clickbait"})
            elif propaganda_rx.search(sent_clean):
                highlighted_phrases.append({"text": sent_clean, "type": "propaganda"})
            elif emotional_rx.search(sent_clean):
                highlighted_phrases.append({"text": sent_clean, "type": "emotional"})

        # 3. Simple language reasoning summary
        reasoning = ""
        if category == "Real News":
            reasoning = "The article was classified as Real News because it maintains a balanced, objective, and analytical tone. It utilizes standard news structure and lacks high-emotional descriptors or curiosity hooks typical of misinformation."
        elif category == "Fake News":
            reasoning = "The article was classified as Fake News due to high frequencies of unverified sensational claims, emotional language patterns, and similarity to text blocks seen in known news hoaxes."
        elif category == "Clickbait":
            reasoning = "The text has been classified as Clickbait because it features curiosity gap headlines and language templates ('you won't believe', 'miracle trick') designed primarily to attract clicks rather than convey factual data."
        elif category == "Propaganda":
            reasoning = "This article exhibits key patterns of Propaganda, including politically polarizing words ('corrupt', 'traitors'), conspiracy associations ('deep state'), and heavily slanted subjective reasoning."
        elif category == "Satire":
            reasoning = "The article is classified as Satire. It uses absurd scenarios, parodied figures, or ironical phrasing which closely matches the structural layout of comedic reporting."
        else: # Misleading
            reasoning = "The article is flagged as Misleading. It mixes some factual elements with highly skewed headlines or exaggeration patterns, creating a false impression of the context."

        return {
            "topKeywords": keywords,
            "highlightedPhrases": highlighted_phrases,
            "reasoning": reasoning
        }
