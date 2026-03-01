from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")

class MatchRequest(BaseModel):
    cv_text: str
    job_text: str

@app.post("/match")
def match_cv_job(data: MatchRequest):
    cv_embedding = model.encode([data.cv_text])
    job_embedding = model.encode([data.job_text])

    score = cosine_similarity(cv_embedding, job_embedding)[0][0]

    return {"match_score": float(score)}