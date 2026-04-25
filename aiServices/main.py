from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

app = FastAPI()

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


class MatchRequest(BaseModel):
    cv_text: str
    job_text: str


def split_sentences(text):
    sentences = re.split(r'[.\n]', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    return sentences


@app.post("/match")
def match_cv_job(data: MatchRequest):

    # -------- FULL TEXT SIMILARITY --------
    cv_embedding = model.encode(
        [data.cv_text],
        normalize_embeddings=True
    )

    job_embedding = model.encode(
        [data.job_text],
        normalize_embeddings=True
    )

    full_score = cosine_similarity(cv_embedding, job_embedding)[0][0]

    # -------- SENTENCE-LEVEL MATCHING --------
    cv_sentences = split_sentences(data.cv_text)
    job_sentences = split_sentences(data.job_text)

    if len(cv_sentences) == 0 or len(job_sentences) == 0:
        sentence_score = 0
    else:
        cv_sent_embeddings = model.encode(
            cv_sentences,
            normalize_embeddings=True
        )

        job_sent_embeddings = model.encode(
            job_sentences,
            normalize_embeddings=True
        )

        sim_matrix = cosine_similarity(cv_sent_embeddings, job_sent_embeddings)

        # For each CV sentence, take best matching job sentence
        max_per_sentence = sim_matrix.max(axis=1)

        sentence_score = float(np.mean(max_per_sentence))

    # -------- FINAL SCORE --------
    final_score = 0.6 * full_score + 0.4 * sentence_score

    return {
        "full_text_score": float(full_score),
        "sentence_level_score": float(sentence_score),
        "final_match_score": float(final_score)
    }