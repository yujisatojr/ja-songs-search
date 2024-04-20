from dotenv import load_dotenv, find_dotenv
import json
from openai import OpenAI
import openai
import os
from qdrant_client import models, QdrantClient
from qdrant_client.http import models as rest
from qdrant_client.http.models import Record

load_dotenv(find_dotenv())
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
)

# Connect to the Qdrant cloud
qdrant_client = QdrantClient(
    url=os.getenv('QDRANT_URL'),
    api_key=os.getenv('QDRANT_API_KEY'),
)

collection_name = 'songs'
vector_name='metadata'

print(qdrant_client.get_collections())
qdrant_client.count(collection_name=collection_name)

def query_qdrant(query, collection_name, vector_name, top_k=15):
    # Creates embedding vector from user query
    completion = openai.embeddings.create(
        input=query,
        model='text-embedding-3-small'  # Be sure to use the same embedding model as the vectors in the collection
    )

    embedded_query = completion.data[0].embedding

    query_results = qdrant_client.search(
        collection_name=collection_name,
        query_vector=(
            vector_name, embedded_query
        ),
        limit=top_k,
    )
    
    return query_results

def parse_user_query(user_query):
    
    prompt_template = f"""
        Your task is to parse the following query '{user_query}' provided by a user and generate JSON output according to the template provided later.
        The explanation of each value in the JSON template is as follows:
        "query": For this field, put the user query as is.
        "sentiment": This field represents the sentiment of the song. If the user mentions words or phrases that can be interpreted as sad or unhappy, fill out this field with 'negative'. If words or phrases that can be interpreted as happy are mentioned, fill out this field with 'positive'. If sentiment is not specified in the user query, leave the field empty.
        "insights": For this field, provide one sentence of brief insights regarding the user's keywords and one sentence of recommendations to the user (use 'あなた' to refer to the user) on which Japanese song(s) and/or Japanese artist(s) the user might like based on the user's keywords. The entire sentence needs to have a friendly tone and be entirely in the Japanese language.
        Below is the JSON template:
        {{
            "query": "{user_query}",
            "sentiment": "positive",
            "insights": "あなたのキーワード「海と夏」から察するに、あなたはリラックスしたり夏の気分を楽しむ音楽をお探しのようですね。その場合、スピッツの「ロビンソン」という曲がおすすめですよ！"
        }}
    """

    messages = [{
            "role": "system",
            "content": "Please generate output in JSON format exclusively, avoiding any additional text or explanations.",
        },
        {
            "role": "user",
            "content": prompt_template
        }
    ]

    stream = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        messages=messages,
        max_tokens=500,
        temperature=0.5,
        frequency_penalty=0,
        presence_penalty=0,
        response_format={ "type": "json_object" }
    )
    return json.loads(stream.choices[0].message.content)

def create_filter(parsed_query):

    print('FILTER GENERATED')
    print(parsed_query)

    data = json.loads(parsed_query)

    # Extract original user query
    user_query = data['query']
    sentiment = data['sentiment']
    insights = data['insights']
    
    # Build filter conditions
    filter_conditions = []
    
    if sentiment is not None and sentiment != '':
        if sentiment == 'positive':
            filter_conditions.append(models.FieldCondition(
                key="sentiment_score",
                range=models.Range(
                    gt=0,
                )
            ))
        elif sentiment == 'negative':
            filter_conditions.append(models.FieldCondition(
                key="sentiment_score",
                range=models.Range(
                    lt=0,
                )
            ))

    return filter_conditions

def search_filtered_vector(parsed_query, collection_name, vector_name, top_k=15):

    filter_conditions = create_filter(parsed_query)

    json_parsed = json.loads(parsed_query)
    user_query = json_parsed['query']
    
    completion = openai.embeddings.create(
        input=user_query,
        model='text-embedding-3-small'  # Be sure to use the same embedding model as the vectors in the collection
    )
    
    embedded_query = completion.data[0].embedding

    query_results = qdrant_client.search(
        collection_name=collection_name,
        query_filter=models.Filter(
            must=filter_conditions,
        ),
        search_params=models.SearchParams(hnsw_ef=128, exact=False),
        query_vector=(
            vector_name, embedded_query
        ),
        limit=top_k,
    )
    
    return query_results

def search_songs_in_qdrant(parsed_query):

    # json_query = json.loads(parsed_query)
    json_query = json.dumps(parsed_query)

    query_results = search_filtered_vector(json_query, collection_name, vector_name)

    # print(query_results)

    results = []
    
    for i, vector in enumerate(query_results):
        tmp = {
            "rank": i,
            "song": vector.payload["song"],
            "artist": vector.payload["artist"],
            "lyrics": vector.payload["lyrics"],  # convert this to MM-DD-YYYY format
            "sentiment_score": vector.payload["sentiment_score"],
            "img_src": vector.payload["img_src"],
        }
        results.append(tmp)

    return (json.loads(json.dumps(results)))