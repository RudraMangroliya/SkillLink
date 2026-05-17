import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

# Load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

app = FastAPI(title="SkillLink AI Recommendation Service", version="1.0.0")

class ProfileRequest(BaseModel):
    user_id: str
    skills: List[str]
    interests: List[str]
    headline: str
    bio: str

class DraftRequest(BaseModel):
    target_name: str
    target_headline: str
    target_skills: List[str]

class TargetProfile(BaseModel):
    id: str
    text_data: str

class RecommendationRequest(BaseModel):
    source_profile: ProfileRequest
    targets: List[TargetProfile]

class ChatMessage(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillLink AI Recommendation Service"}

def generate_text_representation(profile: ProfileRequest) -> str:
    # Repeat skills 5x to give them much higher weight in TF-IDF than generic bio text
    skills_text = " ".join(profile.skills)
    weighted_skills = " ".join([skills_text] * 5)
    
    # Combine relevant fields into a single text document for vectorization
    text = f"{profile.headline} {profile.bio} {weighted_skills} {' '.join(profile.interests)}"
    # Basic cleaning using spaCy
    doc = nlp(text.lower())
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    return " ".join(tokens)

@app.post("/recommend")
def recommend_similar(req: RecommendationRequest):
    if not req.targets:
        return {"recommendations": []}

    source_text = generate_text_representation(req.source_profile)
    target_texts = [t.text_data for t in req.targets]
    
    # Prepend source text to target texts to fit everything in the same TF-IDF space
    all_texts = [source_text] + target_texts
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # Calculate cosine similarity between source (index 0) and targets (index 1 to N)
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    # Pair targets with their similarity scores and sort
    results = []
    for i, target in enumerate(req.targets):
        results.append({
            "id": target.id,
            "similarity_score": float(cosine_sim[i])
        })
        
    # Sort by descending similarity score
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    
    return {"recommendations": results[:10]}

@app.post("/smart-reply")
def generate_smart_reply(req: ChatMessage):
    # Split the concatenated string sent by the frontend
    parts = req.message.split(" | ")
    latest_message = parts[-1].strip()
    history = " ".join(parts[:-1]).strip() if len(parts) > 1 else ""
    
    latest_lower = latest_message.lower()
    
    # Process only the latest message for NLP rules to avoid reacting to old context
    doc = nlp(latest_message)
    
    # 1. Identify questions in the LATEST message
    is_question = latest_message.endswith("?") or any(w.tag_ in ["WP", "WRB"] for w in doc)
    
    # 2. Extract key nouns and verbs from the LATEST message
    nouns = [chunk.text for chunk in doc.noun_chunks if chunk.root.pos_ == "NOUN"]
    verbs = [token.lemma_ for token in doc if token.pos_ == "VERB" and token.is_alpha]
    
    suggestions = []
    
    # Rule based keywords (high priority) - evaluated only against latest message
    if any(word in latest_lower for word in ["interview", "schedule", "tomorrow", "time"]):
        suggestions = ["Yes, I am available.", "Could we do another time?", "Please share the meeting details."]
    elif any(word in latest_lower for word in ["resume", "portfolio", "cv", "work"]):
        suggestions = ["Sure, I will send it right over.", "You can view my portfolio on my profile.", "Let me attach that for you."]
    elif any(word in latest_lower for word in ["thank", "thanks", "appreciate"]):
        suggestions = ["You're welcome!", "Happy to help.", "No problem at all."]
    elif any(word in latest_lower for word in ["hello", "hi", "hey"]):
        suggestions = ["Hello! How can I help you?", "Hi there!", "Hey, great to connect."]
    elif "location" in latest_lower or "where" in latest_lower:
        suggestions = ["Let me send you the address.", "Where are you currently located?", "I'll check the best spot."]
    elif "suggest" in latest_lower or "recommend" in latest_lower:
        # Dynamic tech suggestion based on user's input
        if "tech" in latest_lower or "stack" in latest_lower:
            suggestions = ["I'd recommend React and Node.js.", "Python and FastAPI is a great choice.", "Let's go with the MERN stack."]
        else:
            suggestions = ["I can definitely suggest some options.", "What are your preferences?", "Let me think about it and get back to you."]
    elif is_question:
        if "can you" in latest_lower or "could you" in latest_lower:
            suggestions = ["Yes, I can.", "Let me see what I can do.", "I'd be happy to."]
        elif "do you" in latest_lower:
            suggestions = ["Yes, I do.", "No, not right now.", "Can you elaborate?"]
        else:
            suggestions = ["I'll look into that.", "Can you give me more context?", "Let's discuss this further."]
    else:
        # Dynamic fallback using nouns/verbs from latest message
        if nouns:
            subject = nouns[-1].lower()
            suggestions.append(f"Let's talk more about {subject}.")
            suggestions.append(f"Got it. I'll focus on the {subject}.")
            suggestions.append(f"Tell me more about {subject}.")
        if verbs:
            action = verbs[-1]
            suggestions.append(f"I will {action} that shortly.")
            suggestions.append(f"When should we {action}?")
            suggestions.append(f"Let's {action} it together.")
            
        if not suggestions:
            # If no nouns/verbs and no keywords, maybe use history?
            if history:
                suggestions = ["Sounds good based on what you said.", "Okay, got it.", "Can you tell me more?"]
            else:
                suggestions = ["Sounds good.", "Okay, got it.", "Can you tell me more?"]
            
    # Ensure exactly 3 suggestions
    if len(suggestions) < 3:
        suggestions.extend(["Sounds good.", "I see.", "Okay."])
        
    # Deduplicate and return 3
    final_suggestions = []
    for s in suggestions:
        if s not in final_suggestions:
            final_suggestions.append(s)
        if len(final_suggestions) == 3:
            break
            
    return {"suggestions": final_suggestions}

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    # Placeholder for PDF/DOCX parsing logic
    # In a full implementation, we'd use pdfplumber or python-docx to extract text,
    # then use spaCy to perform NER (Named Entity Recognition) to pull out skills.
    return {
        "message": "Resume parsed successfully (mock data)",
        "extracted_skills": ["Python", "Machine Learning", "FastAPI", "React"],
        "extracted_education": ["B.S. Computer Science"],
        "extracted_experience": "2 years Software Developer"
    }

@app.post("/generate-draft")
def generate_recommendation_draft(req: DraftRequest):
    name = req.target_name.split()[0] if req.target_name else "this professional"
    headline = req.target_headline if req.target_headline else "their field"
    
    if req.target_skills and len(req.target_skills) > 0:
        skills_text = ", ".join(req.target_skills[:3])
        strength_sentence = f"Core Strengths: {name}'s expertise in {skills_text} is truly impressive."
    else:
        strength_sentence = f"Core Strengths: {name} consistently delivers high-quality results and shows great dedication."

    draft = (
        f"I highly recommend {name} for any role related to {headline}.\n\n"
        f"🌟 {strength_sentence}\n\n"
        f"📈 Areas for Growth: While already highly skilled, {name} is always looking to expand their knowledge in new areas, which is a great asset.\n\n"
        f"📚 Learning & Adaptability: {name} has a remarkable eagerness to learn and adapts quickly to new challenges.\n\n"
        f"It was an absolute pleasure working together, and I am confident that {name} will be a strong asset wherever they go."
    )
    
    return {"draft": draft}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
