import os
import pickle
import numpy as np
import pandas as pd
from nlp_processor import NLPProcessor

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.model_selection import train_test_split
    from sklearn.linear_model import LogisticRegression
    from sklearn.naive_bayes import MultinomialNB
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.metrics import classification_report, accuracy_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Create synthetic dataset for training
def generate_synthetic_data():
    data = []
    
    # Real News Samples
    real_news = [
        "The Federal Reserve announced a interest rate cut of 25 basis points citing economic stability and job market growth.",
        "A new study published in Nature shows that renewable energy sources accounted for 30 percent of global electricity generation.",
        "Local government officials approved the budget for building three new public parks and expanding public transit routes.",
        "The space agency successfully launched a weather satellite into geostationary orbit to monitor hurricane development.",
        "Health authorities report a significant decline in seasonal influenza cases due to increased public vaccination rates.",
        "Global trade volume rose by 4 percent in the first quarter, driven by strong manufacturing output in major trade routes.",
        "The annual technology summit convened leaders from around the world to discuss standardizing artificial intelligence safety.",
        "Archaeologists have discovered ancient ruins dating back to the Bronze Age during a highway construction excavation.",
        "The major automotive manufacturer announced plans to transition half of its production fleet to electric vehicles by 2030."
    ]
    for text in real_news:
        data.append({"text": text, "label": "Real News"})
        
    # Fake News Samples
    fake_news = [
        "Leaked documents prove that planetary alignment completely reversed global temperatures within 24 hours.",
        "Secret government underground facilities are using magnetic fields to control minds of citizens in cities.",
        "Breaking news reveals that drinking a secret juice mixture provides complete immunity to all known viral infections.",
        "Scientists verify that the moon is hollow and houses ancient space stations observing human activities.",
        "An official report confirms that global elites are planning to deactivate the electricity grid next week.",
        "Evidence shows that a hidden comet will pass between Earth and the moon causing all electronics to fail instantly.",
        "Whistleblower claims that a major tech firm is secretly recording conversations in empty rooms to train robot clones.",
        "Anonymous sources reveal that local tap water contains chemical compounds designed to alter human memory structures."
    ]
    for text in fake_news:
        data.append({"text": text, "label": "Fake News"})

    # Clickbait Samples
    clickbait = [
        "You won't believe what this simple trick does to your phone battery life! Click to see the miracle results.",
        "Scientists are shocked by what happens when you eat this ordinary fruit before sleeping tonight!",
        "This one simple habit will make you a millionaire in less than a month. Watch this free video now.",
        "Her husband looked at this photo and was instantly horrified by what he saw in the background!",
        "They did not want you to know about this secret hack that saves 80 percent on your grocery bills.",
        "What this child did during the piano recital shocked the judges and left the entire audience in tears.",
        "She tried this bizarre exercise for five minutes and the results blew her mind completely."
    ]
    for text in clickbait:
        data.append({"text": text, "label": "Clickbait"})

    # Propaganda Samples
    propaganda = [
        "The corrupt opposition leaders are traitors working with foreign entities to destroy our nation's heritage.",
        "Our glorious leader has single-handedly defeated the international coalition attempting to damage our industry.",
        "The global media is pushing a fake agenda to enslave our citizens under the guise of health regulations.",
        "Wake up sheeple! The shadow global cabinet is manufacturing a financial crisis to seize personal properties.",
        "Patriots must assemble to overthrow the puppet authorities who are implementing dangerous laws.",
        "The engineered crisis in our banking sector is a secret plot by offshore bankers to destroy local sovereignty."
    ]
    for text in propaganda:
        data.append({"text": text, "label": "Propaganda"})

    # Satire Samples
    satire = [
        "In a hilarious satirical development, the Mayor officially declared that the weekend is now three days long.",
        "Local man spends entire life savings building a submarine in his backyard swimming pool, citing heavy rain fears.",
        "Following a system update, smart refrigerator refuses to open its door until owner performs 20 jumping jacks.",
        "Comedy club introduces new AI comedian that only tells jokes about database configurations and server crashes.",
        "In a spoof statement, the department of work announced that sleeping during meetings is now a mandatory task.",
        "A parody reports that cats have successfully negotiated a treaty to ban vacuum cleaners from residential zones."
    ]
    for text in satire:
        data.append({"text": text, "label": "Satire"})

    # Misleading Samples
    misleading = [
        "Major research group says coffee causes severe health problems. (The study actually only studied extreme caffeine overdose in mice).",
        "Economic indices plunge to historic lows under the new administration. (The dip was a minor seasonal adjustment of 0.1 percent).",
        "Police department budget cut by 90 percent in local city. (The cut was a relocation of security administrative contracts).",
        "Automobile manufacturer recalls all vehicles due to steering issues. (It was a voluntary service advisory for a single batch of 100 cars)."
    ]
    for text in misleading:
        data.append({"text": text, "label": "Misleading News"})

    return pd.DataFrame(data)

def train_and_save_models():
    print("Initializing Fake News Detection training pipeline...")
    
    df = generate_synthetic_data()
    print(f"Generated {len(df)} training samples across {df['label'].nunique()} categories.")
    
    if not SKLEARN_AVAILABLE:
        print("Scikit-learn is not available in current environment. Saving simulated model configuration.")
        # Save a simple config file so Flask server can load mock classes
        config = {
            "trained": False,
            "categories": list(df['label'].unique()),
            "message": "Scikit-learn not installed. Running on fallback analyzer."
        }
        with open("model_pipeline.pkl", "wb") as f:
            pickle.dump(config, f)
        print("Simulated configuration saved successfully.")
        return

    # Preprocess texts
    print("Preprocessing text data...")
    df['processed_text'] = df['text'].apply(lambda x: ' '.join(NLPProcessor.preprocess(x)))
    
    X = df['processed_text']
    y = df['label']
    
    # Train test split (with stratification if possible, or simple split)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Build a Random Forest pipeline
    print("Training Random Forest model...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=1000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy on Test Split: {accuracy:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Save the pipeline
    model_path = os.path.join(os.path.dirname(__file__), 'model_pipeline.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({
            "trained": True,
            "pipeline": pipeline,
            "categories": list(pipeline.classes_),
            "features": pipeline.named_steps['tfidf'].get_feature_names_out().tolist()
        }, f)
        
    print(f"Model successfully saved to {model_path}")

if __name__ == '__main__':
    train_and_save_models()
